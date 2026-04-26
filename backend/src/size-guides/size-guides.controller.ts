import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SizeGuidesService } from './size-guides.service';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user.enum';
import { Public } from '../auth/public.decorator';

@ApiTags('size-guides')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SizeGuidesController {
  constructor(private sizeGuidesService: SizeGuidesService) {}

  @Public()
  @Get('size-guides/product/:productId')
  @ApiOperation({ summary: 'Get size guide for a product (falls back to brand guide)' })
  async findForProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('brandId', ParseIntPipe) brandId: number,
  ) {
    return this.sizeGuidesService.findForProduct(productId, brandId);
  }

  @Get('brands/:id/size-guides')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'List size guides for a brand' })
  async findByBrand(@Param('id', ParseIntPipe) brandId: number) {
    return this.sizeGuidesService.findByBrand(brandId);
  }

  @Post('brands/:id/size-guides')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create size guide' })
  async create(
    @Param('id', ParseIntPipe) brandId: number,
    @Body() dto: CreateSizeGuideDto,
  ) {
    return this.sizeGuidesService.create({ ...dto, brandId });
  }

  @Put('brands/:id/size-guides/:guideId')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update size guide' })
  async update(
    @Param('guideId', ParseIntPipe) guideId: number,
    @Body() dto: UpdateSizeGuideDto,
  ) {
    return this.sizeGuidesService.update(guideId, dto);
  }

  @Delete('brands/:id/size-guides/:guideId')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'Delete size guide' })
  async remove(@Param('guideId', ParseIntPipe) guideId: number) {
    return this.sizeGuidesService.remove(guideId);
  }
}
