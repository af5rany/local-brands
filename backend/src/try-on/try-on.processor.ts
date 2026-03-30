import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TryOnService } from './try-on.service';

@Processor('try-on')
export class TryOnProcessor extends WorkerHost {
  private readonly logger = new Logger(TryOnProcessor.name);

  constructor(private readonly tryOnService: TryOnService) {
    super();
  }

  async process(job: Job): Promise<{ resultUrl: string }> {
    this.logger.log(`Processing try-on job ${job.id} (attempt ${job.attemptsMade + 1})`);

    try {
      const result = await this.tryOnService.processJob(job.data);
      this.logger.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
