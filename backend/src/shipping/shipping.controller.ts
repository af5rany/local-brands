import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';

@ApiTags('shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  // ── Customer endpoint ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Calculate shipping rates for a destination' })
  @Post('shipping/calculate')
  calculateShipping(@Body(ValidationPipe) dto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(
      dto.brandId,
      dto.countryCode,
      dto.totalWeight,
    );
  }

  // ── Brand owner — zones ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List shipping zones for a brand' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/shipping/zones')
  getZones(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.shippingService.getZonesByBrand(brandId);
  }

  @ApiOperation({ summary: 'Create a shipping zone' })
  @UseGuards(BrandAccessGuard)
  @Post('brands/:brandId/shipping/zones')
  createZone(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(ValidationPipe) dto: CreateShippingZoneDto,
  ) {
    return this.shippingService.createZone(brandId, dto);
  }

  @ApiOperation({ summary: 'Update a shipping zone' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/shipping/zones/:zoneId')
  updateZone(
    @Param('zoneId', ParseIntPipe) zoneId: number,
    @Body(ValidationPipe) dto: Partial<CreateShippingZoneDto>,
  ) {
    return this.shippingService.updateZone(zoneId, dto);
  }

  @ApiOperation({ summary: 'Delete a shipping zone' })
  @UseGuards(BrandAccessGuard)
  @Delete('brands/:brandId/shipping/zones/:zoneId')
  deleteZone(@Param('zoneId', ParseIntPipe) zoneId: number) {
    return this.shippingService.deleteZone(zoneId);
  }

  // ── Brand owner — rates ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List shipping rates for a zone' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/shipping/zones/:zoneId/rates')
  getRates(@Param('zoneId', ParseIntPipe) zoneId: number) {
    return this.shippingService.getRatesByZone(zoneId);
  }

  @ApiOperation({ summary: 'Create a shipping rate for a zone' })
  @UseGuards(BrandAccessGuard)
  @Post('brands/:brandId/shipping/zones/:zoneId/rates')
  createRate(
    @Param('zoneId', ParseIntPipe) zoneId: number,
    @Body(ValidationPipe) dto: CreateShippingRateDto,
  ) {
    return this.shippingService.createRate(zoneId, dto);
  }

  @ApiOperation({ summary: 'Update a shipping rate' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/shipping/rates/:rateId')
  updateRate(
    @Param('rateId', ParseIntPipe) rateId: number,
    @Body(ValidationPipe) dto: Partial<CreateShippingRateDto>,
  ) {
    return this.shippingService.updateRate(rateId, dto);
  }

  @ApiOperation({ summary: 'Delete a shipping rate' })
  @UseGuards(BrandAccessGuard)
  @Delete('brands/:brandId/shipping/rates/:rateId')
  deleteRate(@Param('rateId', ParseIntPipe) rateId: number) {
    return this.shippingService.deleteRate(rateId);
  }
}
