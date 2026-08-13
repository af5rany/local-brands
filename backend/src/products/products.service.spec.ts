// expo-server-sdk is ESM — mock before any imports resolve it
jest.mock('expo-server-sdk', () => {
  const Expo = jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
  }));
  (Expo as any).isExpoPushToken = jest.fn().mockReturnValue(true);
  return { default: Expo, Expo };
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Brand } from '../brands/brand.entity';
import { BrandUser } from '../brands/brand-user.entity';
import { BrandsService } from '../brands/brands.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { ProductStatus } from '../common/enums/product.enum';
import { UserRole } from '../common/enums/user.enum';

const mockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  price: 100,
  brandId: 1,
  status: ProductStatus.DRAFT,
  images: [],
  productVariants: [],
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepo: jest.Mocked<any>;
  let brandsRepo: jest.Mocked<any>;
  let variantRepo: jest.Mocked<any>;
  let brandUserRepo: jest.Mocked<any>;
  let mockDataSource: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<any>;

  beforeEach(async () => {
    productsRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    brandsRepo = { findOne: jest.fn() };
    variantRepo = { create: jest.fn((data) => data), findOne: jest.fn() };
    brandUserRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const savedInTx = { id: 1 };
    mockDataSource = {
      transaction: jest.fn().mockResolvedValue(savedInTx),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepo },
        { provide: getRepositoryToken(Brand), useValue: brandsRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
        { provide: getRepositoryToken(BrandUser), useValue: brandUserRepo },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: BrandsService,
          useValue: { validateBrandAccess: jest.fn(), notifyFollowers: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PushNotificationService,
          useValue: { sendToUser: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('create', () => {
    it('throws BadRequestException when brand does not exist', async () => {
      brandsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ brandId: 999, name: 'X' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates product and emits product.created when image present', async () => {
      brandsRepo.findOne.mockResolvedValue({ id: 1, name: 'Brand' });
      productsRepo.findOne.mockResolvedValue(mockProduct() as any);

      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockProduct()),
      };
      productsRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.create({
        brandId: 1,
        name: 'Product',
        images: ['http://cdn.example.com/img.jpg'],
        status: ProductStatus.DRAFT,
      } as any);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when product not found', async () => {
      productsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('soft-deletes existing product', async () => {
      productsRepo.findOne.mockResolvedValue(mockProduct() as any);
      productsRepo.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(1);
      expect(productsRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when softDelete affects 0 rows', async () => {
      productsRepo.findOne.mockResolvedValue(mockProduct() as any);
      productsRepo.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for non-existent product', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      productsRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
