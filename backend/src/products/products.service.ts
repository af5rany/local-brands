import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from './product.entity';
import { Brand } from '../brands/brand.entity'; // Import Brand entity
import { GetProductsDto } from './dto/get-products.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import { SortBy, SortOrder } from 'src/common/enums/product.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Brand) // Inject Brand repository
    private brandsRepository: Repository<Brand>,
  ) { }

  async findAll(dto: GetProductsDto): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 10,
      search,
      productType,
      gender,
      season,
      minPrice,
      maxPrice,
      brandId,
      sortBy = SortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = dto;

    const qb = this.productsRepository.createQueryBuilder('product');

    // Always join with brand table to ensure brand name is available
    qb.leftJoinAndSelect('product.brand', 'brand');

    // Search functionality
    if (search) {
      const searchTerm = `%${search}%`.toLowerCase();
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .where('LOWER(product.name) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(product.description) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere(
              'LOWER(CAST(product.productType AS TEXT)) LIKE :searchTerm',
              { searchTerm },
            )
            .orWhere('LOWER(product.subcategory) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('LOWER(CAST(product.gender AS TEXT)) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('LOWER(CAST(product.season AS TEXT)) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('LOWER(product.tags) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(product.material) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(product.origin) LIKE :searchTerm', { searchTerm });
        }),
      );
    }

    // Filters
    if (productType)
      qb.andWhere('product.productType = :productType', { productType });
    if (gender) qb.andWhere('product.gender = :gender', { gender });
    if (season) qb.andWhere('product.season = :season', { season });
    if (minPrice) qb.andWhere('product.price >= :minPrice', { minPrice });
    if (maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice });
    if (brandId) qb.andWhere('product.brandId = :brandId', { brandId });

    // Sorting
    this.applySorting(qb, sortBy, sortOrder);

    // Pagination
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private applySorting(qb: any, sortBy: SortBy, sortOrder: SortOrder): void {
    switch (sortBy) {
      case SortBy.NAME:
        qb.orderBy('product.name', sortOrder);
        break;
      case SortBy.PRICE:
        qb.orderBy('product.price', sortOrder);
        break;
      case SortBy.CREATED_AT:
        qb.orderBy('product.createdAt', sortOrder);
        break;
      case SortBy.UPDATED_AT:
        qb.orderBy('product.updatedAt', sortOrder);
        break;
      case SortBy.BRAND_NAME:
        // Ensure brand is joined before sorting
        if (
          !qb.expressionMap.joinAttributes.find(
            (join: any) => join.alias?.name === 'brand',
          )
        ) {
          qb.leftJoinAndSelect('product.brand', 'brand');
        }
        qb.orderBy('brand.name', sortOrder);
        break;
      case SortBy.POPULARITY:
        // Assuming you have a popularity field or want to sort by some metric
        // You can customize this based on your business logic
        qb.orderBy('product.viewCount', sortOrder).addOrderBy(
          'product.salesCount',
          sortOrder,
        );
        break;
      default:
        qb.orderBy('product.createdAt', SortOrder.DESC);
    }

    // Add secondary sort by id for consistent ordering
    qb.addOrderBy('product.id', sortOrder);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.brandUsers'],
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const startTime = Date.now();

    // Validate brand exists if brandId is provided
    if (productData.brandId) {
      const brand = await this.brandsRepository.findOne({
        where: { id: productData.brandId },
        select: ['id', 'name'],
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id ${productData.brandId} does not exist`,
        );
      }
    }

    // Process variants if provided
    if (productData.variants && Array.isArray(productData.variants)) {
      productData.variants = productData.variants.map((variant) => ({
        ...variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    const product = this.productsRepository.create(productData);
    const savedProduct = await this.productsRepository.save(product);

    const endTime = Date.now();
    console.log('Saving product took:', endTime - startTime, 'ms');

    return savedProduct;
  }

  async update(id: number, updateData: Partial<Product>): Promise<Product> {
    // Validate brand exists if brandId is being updated
    if (updateData.brandId) {
      const brand = await this.brandsRepository.findOne({
        where: { id: updateData.brandId },
        select: ['id', 'name'],
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id ${updateData.brandId} does not exist`,
        );
      }
    }

    // Process variants if provided
    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((variant) => ({
        ...variant,
        updatedAt: new Date(),
        // Keep existing createdAt or add new one
        createdAt: variant.createdAt || new Date(),
      }));
    }

    await this.productsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productsRepository.delete(id);
  }

  async deleteAll(): Promise<void> {
    await this.productsRepository.delete({});
  }
}
