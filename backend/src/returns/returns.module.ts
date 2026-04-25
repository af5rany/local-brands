import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { ReturnRequest } from './return-request.entity';
import { ReturnPolicy } from './return-policy.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReturnRequest,
      ReturnPolicy,
      Order,
      OrderItem,
      Product,
      ProductVariant,
    ]),
    NotificationsModule,
    BrandsModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
