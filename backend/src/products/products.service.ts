import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, DataSource } from 'typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Brand } from '../brands/brand.entity';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import {
  ProductType,
  SortBy,
  SortOrder,
  ProductStatus,
} from 'src/common/enums/product.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { PublicProductDto } from './dto/public-product.dto';
import { BrandsService } from '../brands/brands.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private dataSource: DataSource,
    private brandsService: BrandsService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(
    dto: GetProductsDto,
    currentUser?: any,
  ): Promise<PaginatedResult<PublicProductDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      productTypes,
      gender,
      season,
      minPrice,
      maxPrice,
      brandIds,
      status,
      isAvailable,
      inStock,
      sortBy = SortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = dto;

    const qb = this.productsRepository.createQueryBuilder('product');

    // Exclude soft-deleted products
    qb.andWhere('product.deletedAt IS NULL');

    // Always join with brand and productVariants tables
    qb.leftJoinAndSelect('product.brand', 'brand');
    qb.leftJoinAndSelect('product.productVariants', 'productVariants');

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
    if (category) qb.andWhere('product.subcategory = :category', { category });
    if (productTypes && productTypes.length > 0)
      qb.andWhere('product.productType IN (:...productTypes)', {
        productTypes,
      });
    if (gender) qb.andWhere('product.gender = :gender', { gender });
    if (season) qb.andWhere('product.season = :season', { season });
    if (minPrice) qb.andWhere('product.price >= :minPrice', { minPrice });
    if (maxPrice) qb.andWhere('product.price <= :maxPrice', { maxPrice });
    if (brandIds && brandIds.length > 0)
      qb.andWhere('product.brandId IN (:...brandIds)', { brandIds });

    // Role-based visibility logic
    const canSeeAll =
      currentUser &&
      (currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.BRAND_OWNER &&
          brandIds &&
          brandIds.length > 0 &&
          brandIds.some((id) => currentUser.brandIds?.includes(Number(id)))));

    if (!canSeeAll) {
      // If not admin/owner, only show PUBLISHED products
      qb.andWhere('product.status = :publishedStatus', {
        publishedStatus: ProductStatus.PUBLISHED,
      });
    } else if (status) {
      // If admin/owner and a specific status is requested, apply it
      qb.andWhere('product.status = :status', { status });
    }

    if (isAvailable !== undefined) {
      qb.andWhere('product.isAvailable = :isAvailable', { isAvailable });
    }

    if (inStock === true) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM product_variant pv WHERE pv."productId" = product.id AND pv.stock > 0)`,
      );
    } else if (inStock === false) {
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM product_variant pv WHERE pv."productId" = product.id AND pv.stock > 0)`,
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
      items: items.map((item) => this.mapToPublicDto(item)),
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
      .where('product.deletedAt IS NULL')
      .andWhere("product.subcategory IS NOT NULL AND product.subcategory != ''")
      .getRawMany();

    const categories = categoriesQuery.map((item) => item.category);

    return {
      categories,
      productTypes,
    };
  }

  async findOne(id: number, trackView = false): Promise<PublicProductDto> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['brand', 'brand.brandUsers', 'productVariants'],
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    // Increment view count in the background (fire-and-forget)
    if (trackView) {
      this.productsRepository
        .increment({ id }, 'viewCount', 1)
        .catch(() => {});
    }

    return this.mapToPublicDto(product);
  }

  async getTrending(limit = 10): Promise<PublicProductDto[]> {
    const products = await this.productsRepository.find({
      where: { status: ProductStatus.PUBLISHED, isAvailable: true },
      relations: ['brand', 'productVariants'],
      order: { viewCount: 'DESC', salesCount: 'DESC' },
      take: limit,
    });
    return products.map((p) => this.mapToPublicDto(p));
  }

  async getBestsellers(limit = 10): Promise<PublicProductDto[]> {
    const products = await this.productsRepository.find({
      where: { status: ProductStatus.PUBLISHED, isAvailable: true },
      relations: ['brand', 'productVariants'],
      order: { salesCount: 'DESC' },
      take: limit,
    });
    return products.map((p) => this.mapToPublicDto(p));
  }

  async getSimilar(id: number, limit = 10): Promise<PublicProductDto[]> {
    const product = await this.productsRepository.findOne({
      where: { id },
      select: ['id', 'brandId', 'subcategory', 'productType', 'gender'],
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.productVariants', 'productVariants')
      .where('product.deletedAt IS NULL')
      .andWhere('product.id != :id', { id })
      .andWhere('product.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('product.isAvailable = true');

    // Score similarity: same brand, same category, same type, same gender
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (product.brandId) {
      conditions.push('CASE WHEN product.brandId = :brandId THEN 3 ELSE 0 END');
      params.brandId = product.brandId;
    }
    if (product.subcategory) {
      conditions.push(
        "CASE WHEN product.subcategory = :subcategory THEN 2 ELSE 0 END",
      );
      params.subcategory = product.subcategory;
    }
    if (product.productType) {
      conditions.push(
        'CASE WHEN product.productType = :productType THEN 2 ELSE 0 END',
      );
      params.productType = product.productType;
    }
    if (product.gender) {
      conditions.push(
        'CASE WHEN product.gender = :gender THEN 1 ELSE 0 END',
      );
      params.gender = product.gender;
    }

    if (conditions.length > 0) {
      // Filter to at least one match
      const orConditions: string[] = [];
      if (product.brandId)
        orConditions.push('product.brandId = :brandId');
      if (product.subcategory)
        orConditions.push('product.subcategory = :subcategory');
      if (product.productType)
        orConditions.push('product.productType = :productType');
      if (product.gender)
        orConditions.push('product.gender = :gender');

      qb.andWhere(`(${orConditions.join(' OR ')})`, params);

      const scoreExpr = conditions.join(' + ');
      qb.addSelect(`(${scoreExpr})`, 'similarity_score');
      qb.orderBy('similarity_score', 'DESC');
    }

    qb.addOrderBy('product.salesCount', 'DESC');
    qb.take(limit);

    const products = await qb.getMany();
    return products.map((p) => this.mapToPublicDto(p));
  }

  private mapToPublicDto(product: Product): PublicProductDto {
    const pvs = product.productVariants || [];
    const hasVariants = pvs.length > 0;
    const totalStock = hasVariants
      ? pvs.reduce((sum, pv) => sum + (pv.stock || 0), 0)
      : product.stock || 0;

    const inStock = totalStock > 0;
    const isLowStock =
      inStock && totalStock <= (product.lowStockThreshold || 10);

    const mainImage = product.images?.[0] || '';

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      basePrice: product.basePrice ? Number(product.basePrice) : null,
      currency: product.currency,
      mainImage,
      images: product.images || [],
      color: product.color || null,
      brand: {
        id: product.brand?.id,
        name: product.brand?.name,
        logo: product.brand?.logo,
        slug: product.brand?.slug,
      },
      category: product.subcategory || 'Uncategorized',
      productType: product.productType,
      isAvailable: product.isAvailable,
      inStock,
      isLowStock,
      hasVariants,
      variants: pvs.map((pv) => ({
        id: pv.id,
        productId: pv.productId,
        size: pv.size,
        stock: pv.stock,
        isAvailable: pv.isAvailable,
      })),
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

    // Extract variants before saving (they go to ProductVariant table, not Product)
    const variantsInput = (productData as any).variants;
    delete (productData as any).variants;

    const savedProduct = await this.dataSource.transaction(async (manager) => {
      const product = this.productsRepository.create(productData);
      const saved = await manager.save(Product, product);

      // Create ProductVariant rows if variants provided (size + stock)
      if (variantsInput && Array.isArray(variantsInput) && variantsInput.length > 0) {
        const variantEntities = variantsInput.map((v: any) =>
          this.variantRepository.create({
            productId: saved.id,
            size: v.size,
            stock: v.stock || 0,
            isAvailable: true,
          }),
        );
        await manager.save(ProductVariant, variantEntities);
      }

      return saved;
    });

    const result = await this.findOne(savedProduct.id);

    // Notify followers when a product is published
    if (
      savedProduct.status === ProductStatus.PUBLISHED &&
      savedProduct.brandId
    ) {
      this.brandsService
        .notifyFollowers(
          savedProduct.brandId,
          NotificationType.NEW_PRODUCT,
          'New Arrival',
          `${result.brand?.name || 'A brand you follow'} just dropped "${result.name}"`,
          { productId: savedProduct.id, brandId: savedProduct.brandId },
        )
        .catch(() => {});
    }

    return result;
  }

  async update(
    id: number,
    updateData: Partial<Product>,
  ): Promise<PublicProductDto> {
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

    // Extract variants — they go to ProductVariant table, not Product columns
    const variantsInput = (updateData as any).variants;
    delete (updateData as any).variants;

    // Defensive check: TypeORM update() fails with empty object or object with only undefined values
    const updatePayload = { ...updateData };
    const hasUpdateValues = Object.values(updatePayload).some(
      (v) => v !== undefined,
    );

    if (!hasUpdateValues) {
      return this.findOne(id);
    }

    // Fetch current product state before update for comparison
    const currentProduct = await this.productsRepository.findOne({
      where: { id },
      select: ['id', 'status', 'salePrice', 'price', 'name', 'brandId'],
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Product, id, updatePayload);

      // Sync ProductVariant rows when variants are provided (size + stock)
      if (variantsInput && Array.isArray(variantsInput)) {
        await manager.delete(ProductVariant, { productId: id });
        const variantEntities = variantsInput.map((v: any) =>
          this.variantRepository.create({
            productId: id,
            size: v.size,
            stock: v.stock || 0,
            isAvailable: true,
          }),
        );
        await manager.save(ProductVariant, variantEntities);
      }
    });

    const result = await this.findOne(id);

    if (currentProduct?.brandId) {
      // Notify when product status changes to PUBLISHED
      if (
        currentProduct.status !== ProductStatus.PUBLISHED &&
        updateData.status === ProductStatus.PUBLISHED
      ) {
        this.brandsService
          .notifyFollowers(
            currentProduct.brandId,
            NotificationType.NEW_PRODUCT,
            'New Arrival',
            `${result.brand?.name || 'A brand you follow'} just dropped "${result.name}"`,
            { productId: id, brandId: currentProduct.brandId },
          )
          .catch(() => {});
      }

      // Notify when sale price is set or reduced
      if (
        updateData.salePrice &&
        (!currentProduct.salePrice ||
          Number(updateData.salePrice) < Number(currentProduct.salePrice))
      ) {
        const discount = Math.round(
          ((Number(currentProduct.price) - Number(updateData.salePrice)) /
            Number(currentProduct.price)) *
              100,
        );
        this.brandsService
          .notifyFollowers(
            currentProduct.brandId,
            NotificationType.PRICE_DROP,
            'Price Drop',
            `"${result.name}" is now ${discount}% off`,
            { productId: id, brandId: currentProduct.brandId },
          )
          .catch(() => {});
      }
    }

    return result;
  }

  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.softDelete(id);
    console.log(`[ProductsService] softDelete id=${id}, affected=${result.affected}`);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async batchCreate(
    productsData: CreateProductDto[],
  ): Promise<PublicProductDto[]> {
    console.log(
      `[ProductsService] Starting batchCreate for ${productsData.length} products`,
    );
    const products: Product[] = [];

    for (let i = 0; i < productsData.length; i++) {
      const data = productsData[i];
      console.log(
        `[ProductsService] Processing product ${i + 1}/${productsData.length}: ${data.name}`,
      );

      if (data.brandId) {
        const brand = await this.brandsRepository.findOne({
          where: { id: data.brandId },
          select: ['id', 'name'],
        });

        if (!brand) {
          console.error(
            `[ProductsService] Brand with id ${data.brandId} does not exist`,
          );
          throw new BadRequestException(
            `Brand with id ${data.brandId} does not exist`,
          );
        }
        console.log(
          `[ProductsService] Brand validation passed for product ${i + 1}`,
        );
      }

      // Extract variants — they go to ProductVariant table separately
      const variantsCopy = data.variants;
      const productData = { ...data } as any;
      delete productData.variants;

      const product = this.productsRepository.create(
        productData as any,
      ) as unknown as Product;
      products.push(product);
    }

    console.log(
      `[ProductsService] Saving ${products.length} products to database...`,
    );

    return this.dataSource.transaction(async (manager) => {
      const savedProducts = await manager.save(Product, products as any);
      console.log(
        `[ProductsService] Successfully saved ${savedProducts.length} products`,
      );

      // Create ProductVariant rows for each saved product
      for (let i = 0; i < savedProducts.length; i++) {
        const data = productsData[i];
        const savedProduct = savedProducts[i];
        if (data.variants && Array.isArray(data.variants)) {
          const variantEntities = (data.variants as any[]).map((v: any) =>
            this.variantRepository.create({
              productId: savedProduct.id,
              size: v.size,
              stock: v.stock || 0,
              isAvailable: true,
            }),
          );
          await manager.save(ProductVariant, variantEntities);
        }
      }

      return Promise.all(savedProducts.map((p) => this.findOne(p.id)));
    });
  }

  async deleteAll(): Promise<void> {
    await this.productsRepository.softDelete({});
  }
}
