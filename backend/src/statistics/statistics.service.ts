import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Wishlist } from '../wishlist/wishlist.entity';
import { Cart } from '../cart/cart.entity';
import { UserRole } from '../common/enums/user.enum';
import { OrderStatus } from '../common/enums/order.enum';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
  ) {}

  async getAdminStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [brands, products, users] = await Promise.all([
      this.brandsRepository.count(),
      this.productsRepository.count(),
      this.usersRepository.count(),
    ]);

    // Revenue stats
    const revenueResult = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .select('SUM(o.totalAmount)', 'total')
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    const revenueThisMonthResult = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('o.createdAt >= :start', { start: startOfMonth })
      .select('SUM(o.totalAmount)', 'total')
      .getRawOne();
    const revenueThisMonth = parseFloat(revenueThisMonthResult?.total || '0');

    const revenueLastMonthResult = await this.ordersRepository
      .createQueryBuilder('o')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('o.createdAt >= :start AND o.createdAt <= :end', {
        start: startOfLastMonth,
        end: endOfLastMonth,
      })
      .select('SUM(o.totalAmount)', 'total')
      .getRawOne();
    const revenueLastMonth = parseFloat(revenueLastMonthResult?.total || '0');

    // Order counts
    const [ordersTotal, ordersThisMonth] = await Promise.all([
      this.ordersRepository.count(),
      this.ordersRepository
        .createQueryBuilder('o')
        .where('o.createdAt >= :start', { start: startOfMonth })
        .getCount(),
    ]);

    // User growth
    const [newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :start', { start: startOfMonth })
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :start AND u.createdAt <= :end', {
          start: startOfLastMonth,
          end: endOfLastMonth,
        })
        .getCount(),
    ]);
    const userGrowthPercent =
      newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : 0;

    // Orders by status
    const ordersByStatusRaw = await this.ordersRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany();
    const ordersByStatus: Record<string, number> = {};
    ordersByStatusRaw.forEach((r) => { ordersByStatus[r.status] = parseInt(r.count, 10); });

    // Top brands by revenue
    const topBrandsRaw = await this.orderItemsRepository
      .createQueryBuilder('oi')
      .leftJoin('oi.product', 'p')
      .leftJoin('p.brand', 'b')
      .leftJoin('oi.order', 'o')
      .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .select('b.id', 'brandId')
      .addSelect('b.name', 'brandName')
      .addSelect('SUM(oi.totalPrice)', 'revenue')
      .groupBy('b.id')
      .addGroupBy('b.name')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();
    const topBrands = topBrandsRaw.map((r) => ({
      brandId: r.brandId,
      brandName: r.brandName,
      revenue: parseFloat(r.revenue || '0'),
    }));

    // GMV by month — last 6 months
    const gmvByMonth: { month: string; gmv: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const gmvResult = await this.ordersRepository
        .createQueryBuilder('o')
        .where('o.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
        .andWhere('o.createdAt >= :start AND o.createdAt <= :end', {
          start: monthStart,
          end: monthEnd,
        })
        .select('SUM(o.totalAmount)', 'total')
        .getRawOne();
      gmvByMonth.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        gmv: parseFloat(gmvResult?.total || '0'),
      });
    }

    return {
      brands,
      products,
      users,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      ordersTotal,
      ordersThisMonth,
      newUsersThisMonth,
      userGrowthPercent,
      ordersByStatus,
      topBrands,
      gmvByMonth,
    };
  }

  async getBrandOwnerStats(userId: number, brandId?: number) {
    // If brandId is provided, verify the user has access to it
    if (brandId) {
      const brand = await this.brandsRepository.findOne({
        where: { id: brandId, brandUsers: { userId } },
        select: ['id'],
      });

      if (!brand) {
        // User doesn't have access to this brand, return empty stats
        return { myProducts: 0, orders: 0, revenue: 0 };
      }

      // Get stats for specific brand
      const myProducts = await this.productsRepository.count({
        where: { brandId },
      });

      // Orders and Revenue for specific brand
      const orderItems = await this.orderItemsRepository
        .createQueryBuilder('orderItem')
        .leftJoin('orderItem.product', 'product')
        .leftJoin('orderItem.order', 'order')
        .where('product.brandId = :brandId', { brandId })
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .select('SUM(orderItem.totalPrice)', 'revenue')
        .addSelect('COUNT(DISTINCT orderItem.orderId)', 'orderCount')
        .getRawOne();

      return {
        myProducts,
        orders: parseInt(orderItems?.orderCount || '0', 10),
        revenue: parseFloat(orderItems?.revenue || '0'),
      };
    }

    // Get brands owned by the user (all brands)
    const brands = await this.brandsRepository.find({
      where: { brandUsers: { userId } },
      select: ['id'],
    });

    const brandIds = brands.map((b) => b.id);

    if (brandIds.length === 0) {
      return { myProducts: 0, orders: 0, revenue: 0 };
    }

    // Product count
    const myProducts = await this.productsRepository.count({
      where:
        brandIds.length > 0
          ? brandIds.map((id) => ({ brandId: id }))
          : { brandId: -1 },
    });

    // Orders and Revenue
    // Revenue is sum of totalPrice from OrderItems belonging to brand's products
    const orderItems = await this.orderItemsRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .where('product.brandId IN (:...brandIds)', { brandIds })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .select('SUM(orderItem.totalPrice)', 'revenue')
      .addSelect('COUNT(DISTINCT orderItem.orderId)', 'orderCount')
      .getRawOne();

    return {
      myProducts,
      orders: parseInt(orderItems?.orderCount || '0', 10),
      revenue: parseFloat(orderItems?.revenue || '0'),
    };
  }

  async getCustomerStats(userId: number) {
    const [
      myOrders,
      wishlist,
      cart,
      spentData,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      this.ordersRepository.count({ where: { user: { id: userId } } }),
      this.wishlistRepository.count({ where: { user: { id: userId } } }),
      this.cartRepository.findOne({
        where: { user: { id: userId } },
        select: ['id', 'totalItems'],
      }),
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.userId = :userId', { userId })
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .select('SUM(order.totalAmount)', 'total')
        .getRawOne(),
      this.ordersRepository.count({
        where: { user: { id: userId }, status: OrderStatus.PENDING },
      }),
      this.ordersRepository.count({
        where: { user: { id: userId }, status: OrderStatus.DELIVERED },
      }),
    ]);

    return {
      myOrders,
      wishlist,
      cartItems: cart?.totalItems || 0,
      totalSpent: parseFloat(spentData?.total || '0'),
      pendingOrders,
      completedOrders,
    };
  }
}
