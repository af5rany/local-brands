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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { GetProductsDto } from './dto/get-products.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Get()
  async findAll(
    @Query() query: GetProductsDto,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() productData: Partial<Product>): Promise<Product> {
    const startTime = Date.now();
    // console.log('Creating product with data:', productData);

    const result = await this.productsService.create(productData);

    const endTime = Date.now();
    console.log('Product creation took:', endTime - startTime, 'ms');

    return result;
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() updateData: Partial<Product>,
  ): Promise<Product> {
    return this.productsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.productsService.remove(id);
  }

  @Delete()
  deleteAll(): Promise<void> {
    return this.productsService.deleteAll();
  }
}
