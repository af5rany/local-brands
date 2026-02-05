// src/orders/orders.service.ts
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { Address } from '../addresses/address.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, PaymentStatus } from 'src/common/enums/order.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { OrderQueryDto } from './dto/get-orders.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) { }

  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    // Validate addresses
    const shippingAddress = await this.addressRepository.findOne({
      where: { id: createOrderDto.shippingAddressId },
      relations: ['user'],
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    if (shippingAddress.user && shippingAddress.user.id !== userId) {
      throw new ForbiddenException('You can only use your own addresses');
    }

    let billingAddress = shippingAddress;
    if (createOrderDto.billingAddressId) {
      billingAddress = (await this.addressRepository.findOne({
        where: { id: createOrderDto.billingAddressId },
        relations: ['user'],
      }))!;

      if (!billingAddress) {
        throw new NotFoundException('Billing address not found');
      }

      if (billingAddress.user && billingAddress.user.id !== userId) {
        throw new ForbiddenException('You can only use your own addresses');
      }
    }

    // Validate products and calculate totals
    const orderItemsData: Partial<OrderItem>[] = []; // ✅ Fixed type
    let subtotal = 0;
    let totalItems = 0;

    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
        relations: ['brand'],
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      const variant = product.variants?.find(
        (v) => v.color === item.color && (!item.size || v.size === item.size),
      );

      if (!variant) {
        throw new BadRequestException(
          `Variant with color ${item.color} and size ${item.size || 'N/A'} not found for product ${product.name}`,
        );
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name} (Variant: ${item.color}/${item.size || 'N/A'}). Available: ${variant.stock}, Requested: ${item.quantity}`,
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      orderItemsData.push({
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        productName: product.name,
        productColor: item.color,
        productSize: item.size,
        productImage: product.images?.[0],
        brandName: product.brand?.name,
        productSku:
          `${product.brand?.name || 'NO-BRAND'}-${product.id}`.toUpperCase(),
      });
    }

    // Calculate final totals
    const shippingCost = createOrderDto.shippingCost || 0;
    const discountAmount = createOrderDto.discountAmount || 0;
    const taxAmount = subtotal * 0.08; // 8% tax rate
    const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      user: { id: userId },
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      totalAmount,
      totalItems,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress,
      billingAddress,
      notes: createOrderDto.notes,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and update stock
    for (const itemData of orderItemsData) {
      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        ...itemData,
      });
      await this.orderItemRepository.save(orderItem);

      // Update product variant stock
      const product = await this.productRepository.findOne({
        where: { id: itemData.product!.id },
      });

      if (product && product.variants) {
        product.variants = product.variants.map((v) => {
          if (
            v.color === itemData.productColor &&
            (!itemData.productSize || v.size === itemData.productSize)
          ) {
            return {
              ...v,
              stock: v.stock - itemData.quantity!,
              updatedAt: new Date(),
            };
          }
          return v;
        });
        await this.productRepository.save(product);
      }
    }

    return this.findOne(savedOrder.id, userId);
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
      sortBy,
      sortOrder,
    } = query;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.shippingAddress', 'shippingAddress')
      .leftJoinAndSelect('order.billingAddress', 'billingAddress');

    // Apply user filter for customers
    if (userRole === UserRole.CUSTOMER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    // Apply filters
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    if (orderNumber) {
      queryBuilder.andWhere('order.orderNumber LIKE :orderNumber', {
        orderNumber: `%${orderNumber}%`,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    // Apply user filter for customers
    if (userRole === UserRole.CUSTOMER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Load order items
    const orderItems = await this.orderItemRepository.find({
      where: { order: { id: order.id } },
      relations: ['product'],
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

    // Validate status transitions
    if (updateOrderDto.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    // Update delivered timestamp
    if (updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
      updateOrderDto['deliveredAt'] = new Date();
    }

    await this.orderRepository.update(id, updateOrderDto);
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

    // Restore product stock
    const orderItems = await this.orderItemRepository.find({
      where: { order: { id: order.id } },
      relations: ['product'],
    });

    for (const item of orderItems) {
      const product = item.product;
      if (product && product.variants) {
        product.variants = product.variants.map((v) => {
          if (
            v.color === item.productColor &&
            (!item.productSize || v.size === item.productSize)
          ) {
            return {
              ...v,
              stock: v.stock + item.quantity,
              updatedAt: new Date(),
            };
          }
          return v;
        });
        await this.productRepository.save(product);
      }
    }

    await this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
    });

    return this.findOne(id, userId, userRole);
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

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
