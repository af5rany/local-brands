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
  Header,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { BatchCreateProductDto } from './dto/batch-create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PublicProductDto } from './dto/public-product.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Public()
  @Header('Cache-Control', 'public, max-age=600') // Cache for 10 minutes
  @Get()
  async findAll(
    @Query() query: GetProductsDto,
    @Req() req,
  ): Promise<PaginatedResult<PublicProductDto>> {
    return this.productsService.findAll(query, req.user);
  }

  @Public()
  @Get('filters')
  async getFilterOptions() {
    return this.productsService.getFilterOptions();
  }

  @Public()
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PublicProductDto> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() productData: CreateProductDto): Promise<PublicProductDto> {
    const startTime = Date.now();
    // console.log('Creating product with data:', productData);

    const result = await this.productsService.create(productData as any);

    const endTime = Date.now();
    console.log('Product creation took:', endTime - startTime, 'ms');

    return result;
  }

  @Post('batch')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async batchCreate(@Body() data: BatchCreateProductDto): Promise<PublicProductDto[]> {
    return this.productsService.batchCreate(data.products);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateProductDto,
  ): Promise<PublicProductDto> {
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
