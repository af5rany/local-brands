import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { CarrierTrackingService } from './carrier-tracking.service';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingRate } from './shipping-rate.entity';
import { Order } from '../orders/order.entity';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingZone, ShippingRate, Order]),
    BrandsModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingService, CarrierTrackingService],
  exports: [ShippingService, CarrierTrackingService],
})
export class ShippingModule {}
