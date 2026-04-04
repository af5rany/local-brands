import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostProduct } from './entities/post-product.entity';
import { BrandFollow } from './entities/brand-follow.entity';
import { Brand } from '../brands/brand.entity';
import { BrandUser } from '../brands/brand-user.entity';
import { Product } from '../products/product.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostLike,
      PostComment,
      PostProduct,
      BrandFollow,
      Brand,
      BrandUser,
      Product,
    ]),
    NotificationsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
