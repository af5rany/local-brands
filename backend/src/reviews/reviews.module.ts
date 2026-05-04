import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from './review.entity';
import { Product } from '../products/product.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReview, Product, OrderItem, Order]), AuthModule, UsersModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
