import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { Public } from '../auth/public.decorator';

@ApiTags('bundles')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BundlesController {
  constructor(private bundlesService: BundlesService) {}

  // Customer: check if cart qualifies for a bundle discount
  @Post('bundles/check')
  @ApiOperation({ summary: 'Check bundle discount for cart product IDs' })
  async check(@Body() body: { productIds: number[]; brandId: number }) {
    return this.bundlesService.checkBundleDiscount(body.productIds, body.brandId);
  }

  // Brand owner CRUD
  @Get('brands/:id/bundles')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'List bundles for brand' })
  findAll(@Param('id', ParseIntPipe) brandId: number) {
    return this.bundlesService.findAllByBrand(brandId);
  }

  @Post('brands/:id/bundles')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create bundle' })
  create(
    @Param('id', ParseIntPipe) brandId: number,
    @Body() dto: CreateBundleDto,
  ) {
    return this.bundlesService.create(brandId, dto);
  }

  @Put('brands/:id/bundles/:bundleId')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update bundle' })
  update(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @Body() dto: CreateBundleDto,
  ) {
    return this.bundlesService.update(bundleId, dto);
  }

  @Put('brands/:id/bundles/:bundleId/toggle')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'Toggle bundle active state' })
  toggle(@Param('bundleId', ParseIntPipe) bundleId: number) {
    return this.bundlesService.toggleActive(bundleId);
  }

  @Delete('brands/:id/bundles/:bundleId')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'Delete bundle' })
  remove(@Param('bundleId', ParseIntPipe) bundleId: number) {
    return this.bundlesService.remove(bundleId);
  }
}
