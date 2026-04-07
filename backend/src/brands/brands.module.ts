import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './brand.entity';
import { BrandUser } from './brand-user.entity';
import { BrandFollow } from './brand-follow.entity';
import { User } from '../users/user.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, BrandUser, BrandFollow, User]),
    NotificationsModule,
  ],
  providers: [BrandsService],
  controllers: [BrandsController],
  exports: [BrandsService, TypeOrmModule],
})
export class BrandsModule {}
