import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingRate } from './shipping-rate.entity';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShippingZone, ShippingRate]),
    BrandsModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
