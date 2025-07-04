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
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';

@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Get()
  findAll(@Query() dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    return this.brandsService.findAll(dto);
  }

  @Get('with-product-count')
  findAllWithProductCount(
    @Query() dto: GetBrandsDto,
  ): Promise<PaginatedResult<Brand & { productCount: number }>> {
    return this.brandsService.findAllWithProductCount(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  @Post()
  create(@Body() brandData: Partial<Brand>): Promise<Brand> {
    return this.brandsService.create(brandData);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<Brand>,
  ): Promise<Brand> {
    return this.brandsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.brandsService.remove(id);
  }
}
