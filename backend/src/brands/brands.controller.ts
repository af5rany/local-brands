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
import { BrandAccessGuard } from '../auth/brand-access.guard';
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

  // Update brand - Admin can update any, Brand Owner can update they are assigned to
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
  @UseGuards(BrandAccessGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<Brand>,
    @Request() req,
  ): Promise<Brand> {
    console.log('Updating brand:', { user: req.user, brandId: id });
    return this.brandsService.update(id, updateData);
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
