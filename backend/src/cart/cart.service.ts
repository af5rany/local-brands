import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { ProductStatus } from 'src/common/enums/product.enum';
import { UpdateCartItemDto } from './dto/add-to-cart.dto';

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
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  // Get cart with items and their product/variant relations
  async getCartSummary(userId: number) {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'cartItems',
        'cartItems.product',
        'cartItems.product.brand',
        'cartItems.product.productVariants',
        'cartItems.variant',
      ],
    });
    if (!cart) {
      cart = await this.cartRepository.save({
        user: { id: userId },
        totalAmount: 0,
        totalItems: 0,
      });
      cart.cartItems = [];
    }
    // Frontend expects "items" key
    return {
      id: cart.id,
      totalAmount: Number(cart.totalAmount),
      totalItems: cart.totalItems,
      items: cart.cartItems,
      updatedAt: cart.updatedAt,
    };
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
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!cart) {
      cart = await this.cartRepository.save({
        user: { id: userId },
        totalAmount: 0,
        totalItems: 0,
      });
    }

    // Build query with search and sorting
    const queryBuilder = this.cartItemRepository
      .createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('cartItem.variant', 'variant')
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
      .leftJoinAndSelect('cartItem.variant', 'variant')
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
    variantId?: number,
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

    // Get product with variants to validate
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['productVariants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('Product is not available for purchase');
    }

    // Validate variant if product has them or if variantId provided
    let variant: ProductVariant | null = null;
    if (variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: variantId, productId: product.id },
      });
      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }
      if (!variant.isAvailable) {
        throw new BadRequestException('Variant is not available');
      }
    } else if (product.productVariants?.length > 0) {
      throw new BadRequestException('Please select a product variant');
    }

    // Determine unit price (Server-owned pricing)
    const unitPrice = variant?.priceOverride
      ? Number(variant.priceOverride)
      : product.salePrice
        ? Number(product.salePrice)
        : Number(product.price);

    // Check if item already exists with same variants
    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cartId: cart.id,
        productId: product.id,
        variantId: variantId || undefined,
      },
    });

    const newQuantity = cartItem ? cartItem.quantity + quantity : quantity;

    // Validate stock
    // const availableStock = variant
    //   ? variant.stock
    //   : product.isInStock()
    //     ? 999
    //     : 0; // Fallback if no variants
    // Note: product.isInStock() logic in entity might need update to support table variants

    if (variant && variant.stock < newQuantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${variant.stock}`,
      );
    }

    if (cartItem) {
      // Update existing item (upsert logic)
      cartItem.quantity = newQuantity;
      cartItem.unitPrice = unitPrice;
      cartItem.totalPrice = newQuantity * unitPrice;
    } else {
      // Create new item
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: product.id,
        variantId: variantId,
        quantity: newQuantity,
        unitPrice: unitPrice,
        totalPrice: newQuantity * unitPrice,
        // Snapshot attributes if available for display
        selectedColor: variant?.attributes?.color,
        selectedSize: variant?.attributes?.size,
      });
    }

    await this.cartItemRepository.save(cartItem);
    await this.updateCartTotals(cart.id);

    return cartItem;
  }

  async updateCartItem(
    userId: number,
    cartItemId: number,
    updateDto: UpdateCartItemDto,
  ): Promise<CartItem | null> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, cart: { user: { id: userId } } },
      relations: ['cart', 'product', 'variant'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (updateDto.quantity !== undefined) {
      if (updateDto.quantity <= 0) {
        await this.removeFromCart(userId, cartItemId);
        return null; // or throw/return something else, but here we just remove
      }

      // Validate stock
      const variant = cartItem.variant;
      const product = cartItem.product;

      if (variant && variant.stock < updateDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${variant.stock}`,
        );
      }

      cartItem.quantity = updateDto.quantity;
      cartItem.totalPrice =
        Number(cartItem.quantity) * Number(cartItem.unitPrice);
    }

    await this.cartItemRepository.save(cartItem);
    await this.updateCartTotals(cartItem.cartId);

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
