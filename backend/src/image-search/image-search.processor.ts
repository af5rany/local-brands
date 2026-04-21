import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ImageSearchService } from './image-search.service';

@Processor('image-embedding')
export class ImageEmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageEmbeddingProcessor.name);

  constructor(private readonly imageSearchService: ImageSearchService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { productId, imageUrl } = job.data;
    this.logger.log(
      `Processing embedding for product ${productId} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      const embedding =
        await this.imageSearchService.getEmbeddingFromUrl(imageUrl);
      const vectorStr = `[${embedding.join(',')}]`;
      await this.imageSearchService.upsertEmbedding(
        productId,
        imageUrl,
        vectorStr,
      );
      this.logger.log(`Embedding saved for product ${productId}`);
    } catch (error) {
      this.logger.error(
        `Embedding failed for product ${productId}: ${error.message}`,
      );
      throw error;
    }
  }
}
