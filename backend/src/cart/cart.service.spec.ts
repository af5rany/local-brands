import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { ProductStatus } from '../common/enums/product.enum';

const mockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  price: 100,
  status: ProductStatus.PUBLISHED,
  productVariants: [],
  ...overrides,
});

const mockVariant = (overrides = {}) => ({
  id: 10,
  productId: 1,
  isAvailable: true,
  stock: 5,
  attributes: { color: 'Red', size: 'M' },
  ...overrides,
});

const mockCart = (overrides = {}) => ({
  id: 1,
  totalAmount: 0,
  totalItems: 0,
  cartItems: [],
  ...overrides,
});

describe('CartService', () => {
  let service: CartService;
  let cartRepo: jest.Mocked<any>;
  let cartItemRepo: jest.Mocked<any>;
  let productRepo: jest.Mocked<any>;
  let variantRepo: jest.Mocked<any>;

  beforeEach(async () => {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ totalAmount: 100, totalItems: 1 }),
    };
    cartRepo = { findOne: jest.fn(), save: jest.fn(), update: jest.fn().mockResolvedValue(undefined) };
    cartItemRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    productRepo = { findOne: jest.fn(), increment: jest.fn().mockResolvedValue(undefined) };
    variantRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: cartRepo },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
      ],
    }).compile();

    service = module.get(CartService);
  });

  describe('addToCart', () => {
    it('throws NotFoundException when product does not exist', async () => {
      cartRepo.findOne.mockResolvedValue(mockCart());
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.addToCart(1, 99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when product not published', async () => {
      cartRepo.findOne.mockResolvedValue(mockCart());
      productRepo.findOne.mockResolvedValue(
        mockProduct({ status: ProductStatus.DRAFT }),
      );

      await expect(service.addToCart(1, 1, 1)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when variant not found', async () => {
      cartRepo.findOne.mockResolvedValue(mockCart());
      productRepo.findOne.mockResolvedValue(mockProduct());
      variantRepo.findOne.mockResolvedValue(null);

      await expect(service.addToCart(1, 1, 1, 999)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when variant not available', async () => {
      cartRepo.findOne.mockResolvedValue(mockCart());
      productRepo.findOne.mockResolvedValue(mockProduct());
      variantRepo.findOne.mockResolvedValue(mockVariant({ isAvailable: false }));

      await expect(service.addToCart(1, 1, 1, 10)).rejects.toThrow(BadRequestException);
    });

    it('creates cart when user has none', async () => {
      const newCart = mockCart({ id: 1 });
      cartRepo.findOne
        .mockResolvedValueOnce(null)     // first call: get cart
        .mockResolvedValueOnce(newCart); // second call: updateCartTotals
      cartRepo.save.mockResolvedValue(newCart);
      productRepo.findOne.mockResolvedValue(mockProduct());
      variantRepo.findOne.mockResolvedValue(mockVariant());
      cartItemRepo.findOne.mockResolvedValue(null);
      cartItemRepo.save.mockResolvedValue({ id: 1, quantity: 1 });

      const result = await service.addToCart(1, 1, 1, 10);
      expect(cartRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ user: { id: 1 } }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('getCartSummary', () => {
    it('creates empty cart when user has none', async () => {
      cartRepo.findOne.mockResolvedValue(null);
      const newCart = mockCart();
      cartRepo.save.mockResolvedValue(newCart);

      const result = await service.getCartSummary(1);
      expect(cartRepo.save).toHaveBeenCalled();
      expect(result.items).toEqual([]);
      expect(result.totalAmount).toBe(0);
    });

    it('returns existing cart summary', async () => {
      const cart = mockCart({ totalAmount: 200, totalItems: 2, cartItems: [] });
      cartRepo.findOne.mockResolvedValue(cart);

      const result = await service.getCartSummary(1);
      expect(result.totalAmount).toBe(200);
      expect(result.totalItems).toBe(2);
    });
  });
});
