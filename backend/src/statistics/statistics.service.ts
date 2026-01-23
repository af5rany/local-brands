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
    ) { }

    async getAdminStats() {
        const [brands, products, users] = await Promise.all([
            this.brandsRepository.count(),
            this.productsRepository.count(),
            this.usersRepository.count(),
        ]);

        return { brands, products, users };
    }

    async getBrandOwnerStats(userId: number) {
        // Get brands owned by the user
        const brands = await this.brandsRepository.find({
            where: { owner: { id: userId } },
            select: ['id'],
        });

        const brandIds = brands.map((b) => b.id);

        if (brandIds.length === 0) {
            return { myProducts: 0, orders: 0, revenue: 0 };
        }

        // Product count
        const myProducts = await this.productsRepository.count({
            where: brandIds.length > 0 ? brandIds.map(id => ({ brandId: id })) : { brandId: -1 },
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
        const [myOrders, wishlist, cart, spentData, pendingOrders, completedOrders] =
            await Promise.all([
                this.ordersRepository.count({ where: { user: { id: userId } } }),
                this.wishlistRepository.count({ where: { user: { id: userId } } }),
                this.cartRepository.findOne({
                    where: { user: { id: userId } },
                    select: ['totalItems'],
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
