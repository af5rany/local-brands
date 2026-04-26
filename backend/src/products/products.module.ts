import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BrandsModule } from 'src/brands/brands.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BrandUser } from 'src/brands/brand-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant, BrandUser]),
    BrandsModule,
    NotificationsModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
