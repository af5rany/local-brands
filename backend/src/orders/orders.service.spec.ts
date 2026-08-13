import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Address } from '../addresses/address.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { BrandUser } from '../brands/brand-user.entity';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { OrderStatus, PaymentMethod } from '../common/enums/order.enum';
import { UserRole } from '../common/enums/user.enum';

const makeOrderRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: ReturnType<typeof makeOrderRepo>;
  let mockDataSource: jest.Mocked<any>;

  beforeEach(async () => {
    orderRepo = makeOrderRepo();

    mockDataSource = {
      transaction: jest.fn((cb) => cb(mockManager)),
    };

    const mockManager: any = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: MailService, useValue: { sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined) } },
        { provide: NotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
        { provide: PromoCodesService, useValue: { validateAndApply: jest.fn(), release: jest.fn() } },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: { save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(Product), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(ProductVariant), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Address), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(OrderStatusHistory), useValue: { save: jest.fn(), create: jest.fn() } },
        { provide: getRepositoryToken(Cart), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(CartItem), useValue: { delete: jest.fn() } },
        { provide: getRepositoryToken(BrandUser), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create — idempotency', () => {
    it('returns existing order when same idempotencyKey reused', async () => {
      const existingOrder = { id: 42, status: OrderStatus.PENDING };
      orderRepo.findOne.mockResolvedValueOnce(existingOrder); // idempotency check

      // Mock findOne on service to avoid query builder complexity
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(existingOrder as any);

      const dto: any = {
        idempotencyKey: 'key-abc',
        items: [{ productId: 1, variantId: 1, quantity: 1 }],
        shippingAddressId: 1,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      };

      const result = await service.create(dto, 1);
      expect(orderRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { id: 1 }, idempotencyKey: 'key-abc' } }),
      );
      expect(result).toEqual(existingOrder);
    });
  });

  describe('create — validation', () => {
    it('throws NotFoundException when shipping address not found', async () => {
      orderRepo.findOne.mockResolvedValue(null); // no existing order

      const mockManager: any = {
        findOne: jest.fn().mockResolvedValue(null), // address not found
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn(),
        }),
      };
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      const dto: any = {
        items: [{ productId: 1, variantId: 1, quantity: 1 }],
        shippingAddressId: 999,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      };

      await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when address belongs to different user', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      const mockManager: any = {
        findOne: jest.fn().mockResolvedValue({ id: 1, user: { id: 99 } }), // wrong owner
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn(),
        }),
      };
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      const dto: any = {
        items: [{ productId: 1, quantity: 1 }],
        shippingAddressId: 1,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      };

      await expect(service.create(dto, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns paginated orders', async () => {
      const mockOrders = [{ id: 1 }, { id: 2 }];
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockOrders, 2]),
      };
      orderRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(
        { page: 0, limit: 10 } as any,
        1,
        UserRole.ADMIN,
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
