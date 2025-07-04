// src/wishlist/wishlist.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Wishlist } from './wishlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, User, Product])],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
