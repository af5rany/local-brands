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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
  constructor(private brandsService: BrandsService) {}

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

  @Get('user/followed')
  @ApiOperation({ summary: 'Get brands the current user follows' })
  async getFollowedBrands(@Request() req) {
    return this.brandsService.getFollowedBrands(req.user.id);
  }

  // ── Brand Follow ──

  @Post('follow/:id')
  @ApiOperation({ summary: 'Follow a brand' })
  async follow(
    @Param('id', ParseIntPipe) brandId: number,
    @Request() req,
  ) {
    return this.brandsService.followBrand(req.user.id, brandId);
  }

  @Delete('follow/:id')
  @ApiOperation({ summary: 'Unfollow a brand' })
  async unfollow(
    @Param('id', ParseIntPipe) brandId: number,
    @Request() req,
  ) {
    return this.brandsService.unfollowBrand(req.user.id, brandId);
  }

  @Get('follow/:id/check')
  @ApiOperation({ summary: 'Check if user follows a brand' })
  async isFollowing(
    @Param('id', ParseIntPipe) brandId: number,
    @Request() req,
  ) {
    return this.brandsService.isFollowing(req.user.id, brandId);
  }

  @Get('follow/:id/count')
  @Public()
  @ApiOperation({ summary: 'Get brand follower count' })
  async getFollowerCount(@Param('id', ParseIntPipe) brandId: number) {
    const count = await this.brandsService.getFollowerCount(brandId);
    return { count };
  }

  @Get(':id/analytics')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  @ApiOperation({ summary: 'Get brand analytics for dashboard' })
  async getAnalytics(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.brandsService.getBrandAnalytics(id);
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
    const { ownerId, ...data } = brandData;
    return this.brandsService.createWithOwner(data, ownerId);
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
