import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';

@ApiTags('promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate a promo code against cart total' })
  @Post('promo-codes/validate')
  async validate(
    @Body(ValidationPipe) dto: ValidatePromoCodeDto,
    @Request() req,
  ) {
    const result = await this.promoCodesService.validate(
      dto.code,
      dto.cartTotal,
      req.user.id,
      dto.brandId,
    );
    return {
      valid: true,
      discountAmount: result.discountAmount,
      code: result.promoCode.code,
      type: result.promoCode.type,
      value: result.promoCode.value,
      description: result.promoCode.description,
    };
  }

  @ApiOperation({ summary: 'List promo codes for a brand' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/promo-codes')
  findAllByBrand(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Query() query: { page?: number; limit?: number; isActive?: boolean },
  ) {
    return this.promoCodesService.findAllByBrand(brandId, query);
  }

  @ApiOperation({ summary: 'Create a promo code for a brand' })
  @UseGuards(BrandAccessGuard)
  @Post('brands/:brandId/promo-codes')
  create(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(ValidationPipe) dto: CreatePromoCodeDto,
  ) {
    return this.promoCodesService.create(brandId, dto);
  }

  @ApiOperation({ summary: 'Update a promo code' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/promo-codes/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Toggle promo code active/inactive' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/promo-codes/:id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.promoCodesService.toggleActive(id);
  }

  @ApiOperation({ summary: 'Get usage stats for a promo code' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/promo-codes/:id/usage')
  getUsage(@Param('id', ParseIntPipe) id: number) {
    return this.promoCodesService.getUsageStats(id);
  }

  @ApiOperation({ summary: 'Delete a promo code (soft delete)' })
  @UseGuards(BrandAccessGuard)
  @Delete('brands/:brandId/promo-codes/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promoCodesService.remove(id);
  }
}
