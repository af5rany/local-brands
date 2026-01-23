import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private brandsService: BrandsService) { }

  @Get()
  findAll(@Query() dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    return this.brandsService.findAll(dto);
  }

  // @Get('with-product-count')
  // findAllWithProductCount(
  //   @Query() dto: GetBrandsDto,
  // ): Promise<PaginatedResult<Brand & { productCount: number }>> {
  //   return this.brandsService.findAllWithProductCount(dto);
  // }

  @Get('my-brands')
  @Roles(UserRole.BRAND_OWNER)
  async getMyBrands(@Request() req): Promise<Brand[]> {
    const currentUser = req.user;
    return this.brandsService.findByOwner(currentUser.userId as number);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  // Create brand - Only Admin can create
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() brandData: Partial<Brand>): Promise<Brand> {
    return this.brandsService.create(brandData);
  }

  // Update brand - Admin can update any, Brand Owner can update only their own
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<Brand>,
    @Request() req,
  ): Promise<Brand> {
    const currentUser = req.user;

    // If user is brand owner, check if they own this brand
    if (currentUser.role === UserRole.BRAND_OWNER) {
      const brand = await this.brandsService.findOne(id);

      // Check if the brand owner is trying to update their own brand
      if (!brand.owner || brand.owner.id !== currentUser.userId) {
        throw new ForbiddenException('You can only update brands that you own');
      }
    }

    console.log('Updating brand:', { user: currentUser, brandId: id });
    return this.brandsService.update(id, updateData);
  }

  // Delete brand - Admin can delete any, Brand Owner can delete only their own
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    const currentUser = req.user;

    if (currentUser.role === UserRole.BRAND_OWNER) {
      const brand = await this.brandsService.findOne(id);
      if (!brand.owner || brand.owner.id !== currentUser.userId) {
        throw new ForbiddenException('You can only delete brands that you own');
      }
    }

    console.log('Deleting brand:', { user: currentUser, brandId: id });
    return this.brandsService.remove(id);
  }
}
