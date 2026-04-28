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
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

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
  @Header('Cache-Control', 'public, max-age=300')
  @Get('trending')
  async getTrending(
    @Query('limit') limit?: number,
  ): Promise<PublicProductDto[]> {
    return this.productsService.getTrending(limit || 10);
  }

  @Public()
  @Header('Cache-Control', 'public, max-age=300')
  @Get('bestsellers')
  async getBestsellers(
    @Query('limit') limit?: number,
  ): Promise<PublicProductDto[]> {
    return this.productsService.getBestsellers(limit || 10);
  }

  @Get('for-you')
  async getForYou(
    @Req() req,
    @Query('limit') limit?: number,
  ): Promise<PublicProductDto[]> {
    return this.productsService.getForYou(req.user.id, limit || 10);
  }

  @Public()
  @Header('Cache-Control', 'public, max-age=600')
  @Get(':id/similar')
  async getSimilar(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ): Promise<PublicProductDto[]> {
    return this.productsService.getSimilar(id, limit || 10);
  }

  @Public()
  @Get('suggestions')
  async getSuggestions(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return { products: [], brands: [] };
    return this.productsService.getSuggestions(q.trim());
  }

  @Public()
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PublicProductDto> {
    return this.productsService.findOne(id, true);
  }

  @Post()
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() productData: CreateProductDto,
    @Req() req,
  ): Promise<PublicProductDto> {
    const startTime = Date.now();

    const result = await this.productsService.create(
      productData as any,
      req.user,
    );

    const endTime = Date.now();
    console.log('Product creation took:', endTime - startTime, 'ms');

    return result;
  }

  @Post('batch')
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async batchCreate(
    @Body() data: BatchCreateProductDto,
    @Req() req,
  ): Promise<PublicProductDto[]> {
    return this.productsService.batchCreate(data.products, req.user);
  }

  @Put(':id')
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateProductDto,
    @Req() req,
  ): Promise<PublicProductDto> {
    return this.productsService.update(id, updateData, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<void> {
    return this.productsService.remove(id, req.user);
  }

  @Delete()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  deleteAll(): Promise<void> {
    return this.productsService.deleteAll();
  }
}
