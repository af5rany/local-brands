import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from './product.entity';
import { Brand } from '../brands/brand.entity';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import { ProductType, SortBy, SortOrder, ProductStatus } from 'src/common/enums/product.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { PublicProductDto } from './dto/public-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) { }

  async findAll(dto: GetProductsDto, currentUser?: any): Promise<PaginatedResult<PublicProductDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      productType,
      gender,
      season,
      minPrice,
      maxPrice,
      brandId,
      status,
      isAvailable,
      inStock,
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
    if (category)
      qb.andWhere('product.subcategory = :category', { category });
    if (productType)
      qb.andWhere('product.productType = :productType', { productType });
    if (gender) qb.andWhere('product.gender = :gender', { gender });
    if (season) qb.andWhere('product.season = :season', { season });
    if (minPrice) qb.andWhere('product.price >= :minPrice', { minPrice });
    if (maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice });
    if (brandId) qb.andWhere('product.brandId = :brandId', { brandId });

    // Role-based visibility logic
    const canSeeAll = currentUser && (
      currentUser.role === UserRole.ADMIN ||
      (
        currentUser.role === UserRole.BRAND_OWNER &&
        brandId &&
        currentUser.brandIds?.includes(Number(brandId))
      )
    );

    if (!canSeeAll) {
      // If not admin/owner, only show PUBLISHED products
      qb.andWhere('product.status = :publishedStatus', { publishedStatus: ProductStatus.PUBLISHED });
    } else if (status) {
      // If admin/owner and a specific status is requested, apply it
      qb.andWhere('product.status = :status', { status });
    }

    if (isAvailable !== undefined) {
      qb.andWhere('product.isAvailable = :isAvailable', { isAvailable });
    }

    if (inStock === true) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM json_array_elements(CASE 
            WHEN json_typeof(product.variants) = 'array' THEN product.variants 
            ELSE '[]'::json 
          END) AS variant 
          WHERE (variant->>'stock')::int > 0
        )`,
      );
    } else if (inStock === false) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM json_array_elements(CASE 
            WHEN json_typeof(product.variants) = 'array' THEN product.variants 
            ELSE '[]'::json 
          END) AS variant 
          WHERE (variant->>'stock')::int > 0
        )`,
      );
    }

    // Sorting
    this.applySorting(qb, sortBy, sortOrder);

    // Pagination
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(item => this.mapToPublicDto(item)),
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
        qb.orderBy('product.viewCount', sortOrder).addOrderBy(
          'product.salesCount',
          sortOrder,
        );
        break;
      default:
        qb.orderBy('product.createdAt', SortOrder.DESC);
    }

    qb.addOrderBy('product.id', sortOrder);
  }

  async getFilterOptions() {
    const productTypes = Object.values(ProductType);
    const categoriesQuery = await this.productsRepository
      .createQueryBuilder('product')
      .select('DISTINCT(product.subcategory)', 'category')
      .where("product.subcategory IS NOT NULL AND product.subcategory != ''")
      .getRawMany();

    const categories = categoriesQuery.map((item) => item.category);

    return {
      categories,
      productTypes,
    };
  }

  async findOne(id: number): Promise<PublicProductDto> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.brandUsers'],
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return this.mapToPublicDto(product);
  }

  private mapToPublicDto(product: Product): PublicProductDto {
    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      basePrice: product.basePrice ? Number(product.basePrice) : null,
      currency: product.currency,
      mainImage: product.images?.[0] || '',
      images: product.images || [],
      brand: {
        id: product.brand?.id,
        name: product.brand?.name,
        logo: product.brand?.logo,
        slug: product.brand?.slug,
      },
      category: product.subcategory || 'Uncategorized',
      productType: product.productType,
      isAvailable: product.isAvailable,
      inStock: product.isInStock(),
      isLowStock: product.isLowStock(),
      variants: product.variants || [],
      rating: Number(product.averageRating),
      reviewCount: product.reviewCount,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      status: product.status,
      gender: product.gender,
      season: product.season,
      tags: product.tags,
      material: product.material,
      careInstructions: product.careInstructions,
      origin: product.origin,
      stock: totalStock,
    };
  }

  async create(productData: Partial<Product>): Promise<PublicProductDto> {
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

    if (productData.variants && Array.isArray(productData.variants)) {
      productData.variants = productData.variants.map((variant) => ({
        ...variant,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    const product = this.productsRepository.create(productData);
    const savedProduct = await this.productsRepository.save(product);
    return this.findOne(savedProduct.id);
  }

  async update(id: number, updateData: Partial<Product>): Promise<PublicProductDto> {
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

    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((variant) => ({
        ...variant,
        updatedAt: new Date(),
        createdAt: variant.createdAt || new Date(),
      }));
    }

    await this.productsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productsRepository.softDelete(id);
  }

  async batchCreate(productsData: CreateProductDto[]): Promise<PublicProductDto[]> {
    console.log(`[ProductsService] Starting batchCreate for ${productsData.length} products`);
    const products: Product[] = [];

    for (let i = 0; i < productsData.length; i++) {
      const data = productsData[i];
      console.log(`[ProductsService] Processing product ${i + 1}/${productsData.length}: ${data.name}`);

      if (data.brandId) {
        const brand = await this.brandsRepository.findOne({
          where: { id: data.brandId },
          select: ['id', 'name'],
        });

        if (!brand) {
          console.error(`[ProductsService] Brand with id ${data.brandId} does not exist`);
          throw new BadRequestException(
            `Brand with id ${data.brandId} does not exist`,
          );
        }
        console.log(`[ProductsService] Brand validation passed for product ${i + 1}`);
      }

      if (data.variants && Array.isArray(data.variants)) {
        console.log(`[ProductsService] Processing ${data.variants.length} variants for product ${i + 1}`);
        data.variants = data.variants.map((variant) => ({
          ...variant,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as any;
      }

      const product = this.productsRepository.create(data as any) as unknown as Product;
      products.push(product);
    }

    console.log(`[ProductsService] Saving ${products.length} products to database...`);
    const savedProducts = await this.productsRepository.save(products as any);
    console.log(`[ProductsService] Successfully saved ${savedProducts.length} products`);

    // Filter out duplicates and fetch full products to map to public DTOs
    // Using simple approach: wait for all findOne calls
    return Promise.all(savedProducts.map((p) => this.findOne(p.id)));
  }

  async deleteAll(): Promise<void> {
    await this.productsRepository.softDelete({});
  }
}
