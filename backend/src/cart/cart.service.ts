// src/cart/cart.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CartItemsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Get cart summary (lightweight, no pagination needed)
  async getCartSummary(userId: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id', 'totalAmount', 'totalItems', 'updatedAt'],
    });
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  }

  // Get paginated cart items with search and sorting
  async getCartItems(
    userId: number,
    query: CartItemsQuery = {},
  ): Promise<PaginationResult<CartItem>> {
    const {
      page = 0,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search = '',
    } = query;

    // First get the cart
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!cart) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }

    // Build query with search and sorting
    const queryBuilder = this.cartItemRepository
      .createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('cartItem.cartId = :cartId', { cartId: cart.id });

    // Add search functionality
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR brand.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add sorting
    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case 'price':
        queryBuilder.orderBy('cartItem.unitPrice', sortOrder);
        break;
      default:
        queryBuilder.orderBy('cartItem.createdAt', sortOrder);
    }

    // Get total count and items
    const [items, total] = await queryBuilder
      .take(limit)
      .skip(page * limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0,
    };
  }

  // Cursor-based pagination for very large carts
  async getCartItemsCursor(
    userId: number,
    cursor?: string,
    limit: number = 10,
  ): Promise<{ items: CartItem[]; nextCursor?: string }> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!cart) {
      return { items: [] };
    }

    const queryBuilder = this.cartItemRepository
      .createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('product.brand', 'brand')
      .where('cartItem.cartId = :cartId', { cartId: cart.id })
      .orderBy('cartItem.createdAt', 'DESC')
      .take(limit + 1); // Take one extra to determine if there's a next page

    if (cursor) {
      queryBuilder.andWhere('cartItem.createdAt < :cursor', { cursor });
    }

    const items = await queryBuilder.getMany();
    const hasNext = items.length > limit;

    if (hasNext) {
      items.pop(); // Remove the extra item
    }

    const nextCursor =
      hasNext && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : undefined;

    return { items, nextCursor };
  }

  // Add item to cart (optimized)
  async addToCart(
    userId: number,
    productId: number,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string,
  ): Promise<CartItem> {
    // Get or create cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!cart) {
      cart = await this.cartRepository.save({
        user: { id: userId },
        totalAmount: 0,
        totalItems: 0,
      });
    }

    // Get product
    const product = await this.productRepository.findOne({
      where: { id: productId },
      select: ['id', 'name', 'price', 'stock'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if item already exists with same variants
    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: productId },
        selectedColor,
        selectedSize,
      },
    });

    if (cartItem) {
      // Update existing item
      cartItem.quantity += quantity;
      cartItem.totalPrice = cartItem.quantity * product.price;
    } else {
      // Create new item
      cartItem = this.cartItemRepository.create({
        cart: { id: cart.id },
        product: { id: productId },
        quantity,
        selectedColor,
        selectedSize,
        unitPrice: product.price,
        totalPrice: quantity * product.price,
      });
    }

    await this.cartItemRepository.save(cartItem);
    await this.updateCartTotals(cart.id);

    return cartItem;
  }

  // Update cart totals efficiently
  private async updateCartTotals(cartId: number): Promise<void> {
    const result = await this.cartItemRepository
      .createQueryBuilder('cartItem')
      .select('SUM(cartItem.totalPrice)', 'totalAmount')
      .addSelect('SUM(cartItem.quantity)', 'totalItems')
      .where('cartItem.cartId = :cartId', { cartId })
      .getRawOne();

    await this.cartRepository.update(cartId, {
      totalAmount: result.totalAmount || 0,
      totalItems: result.totalItems || 0,
    });
  }

  // Remove item from cart
  async removeFromCart(userId: number, cartItemId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    await this.cartItemRepository.delete({
      id: cartItemId,
      cart: { id: cart.id },
    });

    await this.updateCartTotals(cart.id);
  }

  // Clear cart (soft delete approach for better performance)
  async clearCart(userId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!cart) {
      return;
    }

    // Bulk delete all items
    await this.cartItemRepository.delete({
      cart: { id: cart.id },
    });

    // Reset cart totals
    await this.cartRepository.update(cart.id, {
      totalAmount: 0,
      totalItems: 0,
    });
  }
}
