import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BrandsModule } from 'src/brands/brands.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), BrandsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
