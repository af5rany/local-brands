import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Brand } from '../brands/brand.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Wishlist } from '../wishlist/wishlist.entity';
import { Cart } from '../cart/cart.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Brand,
            Product,
            User,
            Order,
            OrderItem,
            Wishlist,
            Cart,
        ]),
    ],
    providers: [StatisticsService],
    controllers: [StatisticsController],
})
export class StatisticsModule { }
