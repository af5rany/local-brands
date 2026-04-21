import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ImageSearchController } from './image-search.controller';
import { ImageSearchService } from './image-search.service';
import { ImageEmbeddingProcessor } from './image-search.processor';
import { ProductEmbedding } from './product-embedding.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEmbedding, Product]),
    BullModule.registerQueue({ name: 'image-embedding' }),
  ],
  controllers: [ImageSearchController],
  providers: [ImageSearchService, ImageEmbeddingProcessor],
  exports: [ImageSearchService],
})
export class ImageSearchModule {}
