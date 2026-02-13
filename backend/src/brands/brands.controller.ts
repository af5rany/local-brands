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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { Public } from '../auth/public.decorator';

import { BatchCreateBrandDto } from './dto/batch-create-brand.dto';

@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private brandsService: BrandsService) { }

  @Public()
  @Get()
  findAll(@Query() dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    return this.brandsService.findAll(dto);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    return this.brandsService.findAll(dto, true);
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

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  // Create brand - Only Admin can create
  @Post()
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() brandData: CreateBrandDto): Promise<Brand> {
    return this.brandsService.create(brandData);
  }

  // Batch import brands - Admin only
  @Post('batch')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async batchCreate(@Body() data: BatchCreateBrandDto): Promise<Brand[]> {
    return this.brandsService.batchCreate(data.brands);
  }

  // Update brand - Admin can update any, Brand Owner can update they are assigned to
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateBrandDto,
    @Request() req,
  ): Promise<Brand> {
    console.log('Updating brand:', { user: req.user, brandId: id });
    return this.brandsService.update(id, updateData);
  }

  // Assign user to brand - Admin only
  @Post(':id/assign-user')
  @Roles(UserRole.ADMIN)
  async assignUser(
    @Param('id', ParseIntPipe) brandId: number,
    @Body() body: { userId: number; role?: string },
  ) {
    const { userId, role } = body;
    return this.brandsService.assignUserToBrand(brandId, userId, role as any);
  }

  // Remove user from brand - Admin only
  @Delete(':id/remove-user/:userId')
  @Roles(UserRole.ADMIN)
  async removeUser(
    @Param('id', ParseIntPipe) brandId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.brandsService.removeUserFromBrand(brandId, userId);
  }

  // Delete brand - Admin can delete any, Brand Owner can delete brands they are assigned to
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    console.log('Deleting brand:', { user: req.user, brandId: id });
    return this.brandsService.remove(id);
  }
}
