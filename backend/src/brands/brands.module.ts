import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './brand.entity';
import { BrandUser } from './brand-user.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, BrandUser])],
  providers: [BrandsService],
  controllers: [BrandsController],
  exports: [BrandsService, TypeOrmModule],
})
export class BrandsModule { }
