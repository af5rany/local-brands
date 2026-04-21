import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { ProductEmbedding } from './product-embedding.entity';
import { Product } from '../products/product.entity';
import { ImageSearchDto } from './dto/image-search.dto';
import { PublicProductDto } from '../products/dto/public-product.dto';
import { PaginatedResult } from '../common/types/pagination.type';
import { ProductStatus } from 'src/common/enums/product.enum';

@Injectable()
export class ImageSearchService implements OnModuleInit {
  private readonly logger = new Logger(ImageSearchService.name);

  constructor(
    @InjectRepository(ProductEmbedding)
    private embeddingRepo: Repository<ProductEmbedding>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
    @InjectQueue('image-embedding')
    private embeddingQueue: Queue,
  ) {}

  async onModuleInit() {
    const qr = this.dataSource.createQueryRunner();
    try {
      await qr.query('CREATE EXTENSION IF NOT EXISTS vector');
      this.logger.log('pgvector extension enabled');

      await qr.query(`
        DO $$ BEGIN
          ALTER TABLE product_embedding
          ADD COLUMN IF NOT EXISTS embedding vector(512);
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
      `);
      this.logger.log('Vector column ensured on product_embedding');

      // IVFFlat index — good for <100K products, lower memory than HNSW
      await qr.query(`
        CREATE INDEX IF NOT EXISTS idx_product_embedding_vector
        ON product_embedding
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
      this.logger.log('IVFFlat vector index ensured');
    } catch (error) {
      this.logger.warn(
        `pgvector setup warning (non-fatal): ${error.message}`,
      );
    } finally {
      await qr.release();
    }
  }

  private get clipUrl(): string {
    return process.env.CLIP_SERVICE_URL || 'http://localhost:8100';
  }

  async getEmbeddingFromFile(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<number[]> {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(fileBuffer)], { type: 'image/jpeg' }),
      filename,
    );

    const response = await fetch(`${this.clipUrl}/embed/image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok)
      throw new Error(`CLIP embed/image failed: ${response.status}`);
    const data = await response.json();
    return data.embedding;
  }

  async getEmbeddingFromUrl(imageUrl: string): Promise<number[]> {
    const response = await fetch(`${this.clipUrl}/embed/image-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    });
    if (!response.ok)
      throw new Error(`CLIP embed/image-url failed: ${response.status}`);
    const data = await response.json();
    return data.embedding;
  }

  async searchByImage(
    fileBuffer: Buffer,
    filename: string,
    dto: ImageSearchDto,
  ): Promise<PaginatedResult<PublicProductDto>> {
    const embedding = await this.getEmbeddingFromFile(fileBuffer, filename);
    const { page = 1, limit = 20, threshold = 0.8 } = dto;
    const offset = (page - 1) * limit;
    const vectorStr = `[${embedding.join(',')}]`;

    // Build optional filter conditions
    const conditions: string[] = [
      'p."deletedAt" IS NULL',
      "p.status = 'published'",
      'p."isAvailable" = true',
      `(pe.embedding <=> $1::vector) < $2`,
    ];
    const params: any[] = [vectorStr, threshold, limit, offset];

    if (dto.gender) {
      params.push(dto.gender);
      conditions.push(`p.gender = $${params.length}`);
    }

    if (dto.productTypes?.length) {
      params.push(dto.productTypes);
      conditions.push(`p."productType" = ANY($${params.length})`);
    }

    const whereClause = conditions.join(' AND ');

    const results = await this.dataSource.query(
      `
      SELECT
        pe."productId",
        (pe.embedding <=> $1::vector) as distance
      FROM product_embedding pe
      JOIN product p ON p.id = pe."productId"
      WHERE ${whereClause}
      ORDER BY pe.embedding <=> $1::vector
      LIMIT $3 OFFSET $4
      `,
      params,
    );

    // Get total count for pagination
    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as count
      FROM product_embedding pe
      JOIN product p ON p.id = pe."productId"
      WHERE ${whereClause}
      `,
      params.slice(0, params.length - 2), // exclude limit and offset
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    if (results.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    // Fetch full product details
    const productIds = results.map((r: any) => r.productId);
    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.productVariants', 'productVariants')
      .whereInIds(productIds)
      .getMany();

    // Preserve similarity order
    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderedProducts = productIds
      .map((id: number) => productMap.get(id))
      .filter(Boolean);

    const items = orderedProducts.map((p) => this.mapToPublicDto(p));
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

  async queueEmbedding(productId: number, imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    await this.embeddingQueue.add(
      'embed-product',
      { productId, imageUrl },
      {
        jobId: `embed-${productId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 7200 },
      },
    );
    this.logger.log(`Queued embedding for product ${productId}`);
  }

  async upsertEmbedding(
    productId: number,
    imageUrl: string,
    vectorStr: string,
  ): Promise<void> {
    const existing = await this.embeddingRepo.findOne({
      where: { productId },
    });

    if (existing) {
      await this.dataSource.query(
        `UPDATE product_embedding SET embedding = $1::vector, "imageUrl" = $2, "updatedAt" = NOW() WHERE "productId" = $3`,
        [vectorStr, imageUrl, productId],
      );
    } else {
      // Insert the row via TypeORM first (so it creates id, timestamps)
      const row = await this.embeddingRepo.save({ productId, imageUrl });
      // Then set the vector column via raw SQL
      await this.dataSource.query(
        `UPDATE product_embedding SET embedding = $1::vector WHERE id = $2`,
        [vectorStr, row.id],
      );
    }
  }

  async queueAllProducts(): Promise<{ queued: number }> {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.images'])
      .where('p.deletedAt IS NULL')
      .andWhere('p.status = :status', { status: ProductStatus.PUBLISHED })
      .andWhere('p.images IS NOT NULL')
      .getMany();

    let queued = 0;
    for (const product of products) {
      const imageUrl = product.images?.[0];
      if (!imageUrl) continue;

      // Skip if already embedded with the same image (and vector is populated)
      const existing = await this.dataSource.query(
        `SELECT id FROM product_embedding WHERE "productId" = $1 AND "imageUrl" = $2 AND embedding IS NOT NULL`,
        [product.id, imageUrl],
      );
      if (existing.length > 0) continue;

      await this.embeddingQueue.add(
        'embed-product',
        { productId: product.id, imageUrl },
        {
          jobId: `embed-${product.id}`,
          delay: queued * 200, // Stagger: ~5 per second
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
      queued++;
    }

    this.logger.log(`Batch: queued ${queued} products for embedding`);
    return { queued };
  }

  // Listen for product lifecycle events
  @OnEvent('product.created')
  handleProductCreated(payload: {
    productId: number;
    imageUrl?: string;
  }): void {
    if (payload.imageUrl) {
      this.queueEmbedding(payload.productId, payload.imageUrl).catch(
        (err) =>
          this.logger.error(
            `Failed to queue embedding for new product ${payload.productId}: ${err.message}`,
          ),
      );
    }
  }

  @OnEvent('product.updated')
  handleProductUpdated(payload: {
    productId: number;
    imageUrl?: string;
  }): void {
    if (payload.imageUrl) {
      this.queueEmbedding(payload.productId, payload.imageUrl).catch(
        (err) =>
          this.logger.error(
            `Failed to queue embedding for updated product ${payload.productId}: ${err.message}`,
          ),
      );
    }
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
}
