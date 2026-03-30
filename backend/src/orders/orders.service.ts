import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Address } from '../addresses/address.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PaymentStatus } from 'src/common/enums/order.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { OrderQueryDto } from './dto/get-orders.dto';
import { OrderStatusHistory } from './order-status-history.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { MailService } from '../common/mail/mail.service';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    const { idempotencyKey } = createOrderDto;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingOrder = await this.orderRepository.findOne({
        where: { user: { id: userId }, idempotencyKey },
      });
      if (existingOrder) {
        return this.findOne(existingOrder.id, userId);
      }
    }

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 2. Validate Addresses
      const shippingAddress = await manager.findOne(Address, {
        where: { id: createOrderDto.shippingAddressId },
        relations: ['user'],
      });

      if (!shippingAddress)
        throw new NotFoundException('Shipping address not found');
      if (shippingAddress.user?.id !== userId)
        throw new ForbiddenException('Invalid address owner');

      let billingAddress = shippingAddress;
      if (createOrderDto.billingAddressId) {
        const bAddress = await manager.findOne(Address, {
          where: { id: createOrderDto.billingAddressId },
          relations: ['user'],
        });
        if (!bAddress) throw new NotFoundException('Billing address not found');
        if (bAddress.user?.id !== userId)
          throw new ForbiddenException('Invalid address owner');
        billingAddress = bAddress;
      }

      // 3. Validate Products/Variants and Calculate Totals
      let subtotal = 0;
      let totalItemsCount = 0;
      const orderItemsToCreate: Partial<OrderItem>[] = [];

      for (const item of createOrderDto.items) {
        // Lock the product row to prevent concurrent stock reads
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          relations: ['brand'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!product)
          throw new NotFoundException(`Product ${item.productId} not found`);

        let variant: ProductVariant | undefined;
        if (item.variantId) {
          variant =
            (await manager.findOne(ProductVariant, {
              where: { id: item.variantId, productId: product.id },
              lock: { mode: 'pessimistic_write' },
            })) ?? undefined;
          if (!variant)
            throw new NotFoundException(`Variant ${item.variantId} not found`);
        }

        // Stock validation — variant stock if variant, product stock otherwise
        if (variant) {
          if (variant.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}`,
            );
          }
        } else {
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}`,
            );
          }
        }

        const unitPrice = variant?.priceOverride
          ? Number(variant.priceOverride)
          : product.salePrice
            ? Number(product.salePrice)
            : Number(product.price);

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;
        totalItemsCount += item.quantity;

        orderItemsToCreate.push({
          productId: product.id,
          variantId: variant?.id,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          productName: product.name,
          productColor: variant?.attributes?.color || item.color,
          productSize: variant?.attributes?.size || item.size,
          productImage: variant?.images?.[0] || product.images?.[0],
          brandName: product.brand?.name,
          productSku: variant?.sku || product.sku || `SKU-${product.id}`,
        });
      }

      // 4. Calculate Final Totals
      const shippingCost = createOrderDto.shippingCost || 0;
      const discountAmount = createOrderDto.discountAmount || 0;
      const taxAmount = subtotal * 0.08; // 8% example
      const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

      // 5. Create Order
      const order = manager.create(Order, {
        orderNumber: this.generateOrderNumber(),
        user: { id: userId },
        subtotal,
        shippingCost,
        taxAmount,
        discountAmount,
        totalAmount,
        totalItems: totalItemsCount,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: createOrderDto.paymentMethod,
        shippingAddress,
        billingAddress,
        notes: createOrderDto.notes,
        idempotencyKey,
      });

      const savedOrder = await manager.save(Order, order);

      // 6. Create OrderItems & Deduct Stock
      for (const itemData of orderItemsToCreate) {
        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          ...itemData,
        });
        await manager.save(OrderItem, orderItem);

        // Deduct stock — variant stock if variant, product stock otherwise
        if (itemData.variantId) {
          await manager.decrement(
            ProductVariant,
            { id: itemData.variantId },
            'stock',
            itemData.quantity!,
          );
        } else {
          await manager.decrement(
            Product,
            { id: itemData.productId },
            'stock',
            itemData.quantity!,
          );
        }
      }

      // 7. Clear Cart
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
      });
      if (cart) {
        await manager.delete(CartItem, { cartId: cart.id });
        await manager.update(Cart, cart.id, { totalAmount: 0, totalItems: 0 });
      }

      // 8. Record Status History
      const history = manager.create(OrderStatusHistory, {
        order: savedOrder,
        oldStatus: undefined,
        newStatus: OrderStatus.PENDING,
        changedByUserId: userId,
        notes: 'Order created via checkout',
      });
      await manager.save(OrderStatusHistory, history);

      // Send order confirmation email (non-blocking)
      const user = await manager.findOne(User, { where: { id: userId } });
      if (user?.email) {
        this.mailService
          .sendOrderConfirmationEmail(
            user.email,
            savedOrder.orderNumber,
            Number(savedOrder.totalAmount),
            savedOrder.totalItems,
          )
          .catch(() => {}); // Fire-and-forget
      }

      return savedOrder;
    });
  }

  async checkout(checkoutDto: CheckoutDto, userId: number): Promise<Order> {
    // 1. Get the user's cart with items
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'cartItems',
        'cartItems.product',
        'cartItems.product.brand',
        'cartItems.variant',
      ],
    });

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // 2. Build items from cart
    const items = cart.cartItems.map((ci) => ({
      productId: ci.productId,
      variantId: ci.variantId || undefined,
      quantity: ci.quantity,
      color: ci.selectedColor || undefined,
      size: ci.selectedSize || undefined,
    }));

    // 3. Delegate to existing create() with proper DTO
    const createOrderDto: CreateOrderDto = {
      items,
      shippingAddressId: checkoutDto.shippingAddressId,
      billingAddressId: checkoutDto.billingAddressId,
      paymentMethod: checkoutDto.paymentMethod,
      idempotencyKey: checkoutDto.idempotencyKey,
      notes: checkoutDto.notes,
    };

    return this.create(createOrderDto, userId);
  }

  async findAll(query: OrderQueryDto, userId: number, userRole: UserRole) {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      startDate,
      endDate,
      orderNumber,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress');

    if (userRole === UserRole.CUSTOMER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    if (status) queryBuilder.andWhere('order.status = :status', { status });
    if (paymentStatus)
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    if (orderNumber)
      queryBuilder.andWhere('order.orderNumber ILIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`,
      });
    if (startDate && endDate) {
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    queryBuilder.orderBy(`order.${sortBy}`, sortOrder as any);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Marketplace-safe: Get items belonging to a specific brand within orders
  async findBrandOrders(brandId: number, query: OrderQueryDto) {
    const { page = 1, limit = 10 } = query;

    // Join with OrderItem and Product to filter by brandId
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.orderItems', 'orderItem')
      .innerJoin('orderItem.product', 'product')
      .where('product.brandId = :brandId', { brandId })
      .leftJoinAndSelect('order.user', 'user')
      // Only select OrderItems for THIS brand when returning the order
      // (This is a simplified view; ideally you filter the items in the service logic)
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    // Filter orderItems to only show brand-specific items
    for (const order of orders) {
      const allItems = await this.orderItemRepository.find({
        where: { order: { id: order.id }, product: { brandId } },
        relations: ['product'],
      });
      (order as any).brandItems = allItems;
    }

    return {
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(
    id: number,
    userId: number,
    userRole?: UserRole,
  ): Promise<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress')
      .where('order.id = :id', { id });

    if (userRole === UserRole.CUSTOMER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    const order = await queryBuilder.getOne();
    if (!order) throw new NotFoundException('Order not found');

    const orderItems = await this.orderItemRepository.find({
      where: { order: { id: order.id } },
    });
    (order as any).orderItems = orderItems;

    return order;
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    userId: number,
    userRole: UserRole,
  ): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);
    const oldStatus = order.status;

    if (updateOrderDto.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    if (updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
      updateOrderDto['deliveredAt'] = new Date();
    }

    await this.dataSource.transaction(async (manager) => {
      // Defensive check: TypeORM update() fails with empty object or object with only undefined values
      const hasUpdateValues = Object.values(updateOrderDto).some(
        (v) => v !== undefined,
      );
      if (hasUpdateValues) {
        await manager.update(Order, id, updateOrderDto);
      }

      if (updateOrderDto.status && updateOrderDto.status !== oldStatus) {
        const history = manager.create(OrderStatusHistory, {
          order: { id },
          oldStatus,
          newStatus: updateOrderDto.status,
          changedByUserId: userId,
          notes: `Status changed to ${updateOrderDto.status}`,
        });
        await manager.save(OrderStatusHistory, history);

        // Send status update email (non-blocking)
        const user = await manager.findOne(User, {
          where: { id: order.user.id },
        });
        if (user?.email) {
          this.mailService
            .sendOrderStatusUpdateEmail(
              user.email,
              order.orderNumber,
              updateOrderDto.status,
            )
            .catch(() => {});
        }

        // Send in-app notification for order status change
        const statusMessages: Record<string, string> = {
          CONFIRMED: 'Your order has been confirmed',
          PROCESSING: 'Your order is being prepared',
          SHIPPED: 'Your order is on its way',
          DELIVERED: 'Your order has been delivered',
          CANCELLED: 'Your order has been cancelled',
          RETURNED: 'Your return has been processed',
        };
        const msg =
          statusMessages[updateOrderDto.status] ||
          `Order status updated to ${updateOrderDto.status}`;
        this.notificationsService
          .create(
            order.user.id,
            NotificationType.ORDER_UPDATE,
            `Order ${order.orderNumber}`,
            msg,
            { orderId: order.id },
          )
          .catch(() => {});
      }
    });

    return this.findOne(id, userId, userRole);
  }

  async cancel(id: number, userId: number, userRole: UserRole): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(OrderItem, {
        where: { order: { id: order.id } },
      });

      // Restore Stock
      for (const item of items) {
        if (item.variantId) {
          await manager.increment(
            ProductVariant,
            { id: item.variantId },
            'stock',
            item.quantity,
          );
        } else {
          await manager.increment(
            Product,
            { id: item.productId },
            'stock',
            item.quantity,
          );
        }
      }

      await manager.update(Order, id, {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      });

      const history = manager.create(OrderStatusHistory, {
        order: { id },
        oldStatus: order.status,
        newStatus: OrderStatus.CANCELLED,
        changedByUserId: userId,
        notes: 'Order cancelled by user',
      });
      await manager.save(OrderStatusHistory, history);
    });

    return this.findOne(id, userId, userRole);
  }

  async getStatusHistory(orderId: number): Promise<OrderStatusHistory[]> {
    return this.statusHistoryRepository.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });
  }

  async getOrderStats(userId?: number) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    if (userId) {
      queryBuilder.where('order.user.id = :userId', { userId });
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PENDING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CONFIRMED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PROCESSING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.SHIPPED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),
    ]);

    const totalRevenue = await queryBuilder
      .select('SUM(order.totalAmount)', 'total')
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: Number(totalRevenue?.total || 0),
    };
  }

  private generateOrderNumber(): string {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
