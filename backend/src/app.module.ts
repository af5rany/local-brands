import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrdersModule } from './orders/orders.module';
import { StatisticsModule } from './statistics/statistics.module';
import { MailModule } from './common/mail/mail.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReferralsModule } from './referrals/referrals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TryOnModule } from './try-on/try-on.module';
import { FeedModule } from './feed/feed.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ImageSearchModule } from './image-search/image-search.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { ShippingModule } from './shipping/shipping.module';
import { ReturnsModule } from './returns/returns.module';
import { SizeGuidesModule } from './size-guides/size-guides.module';
import { EmailCampaignsModule } from './email-campaigns/email-campaigns.module';
import { BundlesModule } from './bundles/bundles.module';
import { ProductQuestionsModule } from './product-questions/product-questions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'local_brands_db',
      autoLoadEntities: true,
      synchronize: true,
      // synchronize: false,
      // migrationsRun: true,
      // migrations: [__dirname + '/migrations/*.{ts,js}'],
      // logging: true,
    }),
    AuthModule,
    UsersModule,
    BrandsModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    StatisticsModule,
    MailModule,
    ReviewsModule,
    AddressesModule,
    ReferralsModule,
    NotificationsModule,
    TryOnModule,
    FeedModule,
    ImageSearchModule,
    PromoCodesModule,
    ShippingModule,
    ReturnsModule,
    SizeGuidesModule,
    EmailCampaignsModule,
    BundlesModule,
    ProductQuestionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
