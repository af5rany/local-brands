import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { fal } from '@fal-ai/client';

import { TryOnDto } from './dto/try-on.dto';
import { TryOnResult } from './try-on-result.entity';

const FAL_MODEL = 'fal-ai/fashn/tryon/v1.6';

@Injectable()
export class TryOnService {
  private readonly logger = new Logger(TryOnService.name);

  constructor(
    @InjectRepository(TryOnResult)
    private readonly resultRepo: Repository<TryOnResult>,
    @InjectQueue('try-on')
    private readonly tryOnQueue: Queue,
  ) {}

  private get falKey(): string {
    const k = process.env.FAL_KEY;
    if (!k) throw new InternalServerErrorException('FAL_KEY is not configured');
    return k;
  }

  private generateCacheKey(
    personUrl: string,
    garmentUrl: string,
    category: string,
  ): string {
    return crypto
      .createHash('md5')
      .update(`${personUrl}|${garmentUrl}|${category}`)
      .digest('hex');
  }

  /**
   * Submit a try-on job
   */
  async submit(
    dto: TryOnDto,
  ): Promise<{ jobId: string; resultUrl?: string; cached: boolean }> {
    const category = dto.category || 'auto';
    const cacheKey = this.generateCacheKey(
      dto.personImageUrl,
      dto.garmentImageUrl,
      category,
    );
    this.logger.log('📥 Incoming try-on request');
    this.logger.log(`Person: ${dto.personImageUrl}`);
    this.logger.log(`Garment: ${dto.garmentImageUrl}`);
    this.logger.log(`Category: ${category}`);
    // ✅ Check cache
    const cached = await this.resultRepo.findOne({ where: { cacheKey } });
    if (cached) {
      this.logger.log(`Cache hit for key ${cacheKey}`);
      return {
        jobId: cacheKey,
        resultUrl: cached.resultUrl,
        cached: true,
      };
    }

    // ✅ Queue job
    const job = await this.tryOnQueue.add(
      'generate',
      {
        personImageUrl: dto.personImageUrl,
        garmentImageUrl: dto.garmentImageUrl,
        category,
        cacheKey,
      },
      {
        jobId: cacheKey,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 7200 },
      },
    );

    this.logger.log(`Queued try-on job ${job.id}`);
    return { jobId: job.id!, cached: false };
  }

  /**
   * Get job status
   */
  async getStatus(jobId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
  }> {
    this.logger.log(`🔍 Checking job status: ${jobId}`);
    // ✅ Check cache first
    const cached = await this.resultRepo.findOne({
      where: { cacheKey: jobId },
    });
    if (cached) {
      return { status: 'completed', resultUrl: cached.resultUrl };
    }

    const job = await this.tryOnQueue.getJob(jobId);
    if (!job) {
      return { status: 'failed', error: 'Job not found' };
    }

    const state = await job.getState();
    this.logger.log(`📊 Job state: ${state}`);
    if (state === 'completed') {
      const result = job.returnvalue as { resultUrl: string } | undefined;
      return { status: 'completed', resultUrl: result?.resultUrl };
    }

    if (state === 'failed') {
      return {
        status: 'failed',
        error: job.failedReason || 'Generation failed',
      };
    }

    if (state === 'active') {
      return { status: 'processing' };
    }

    return { status: 'queued' };
  }

  /**
   * Worker processing (FIXED VERSION)
   */
  async processJob(data: {
    personImageUrl: string;
    garmentImageUrl: string;
    category: 'auto' | 'tops' | 'bottoms' | 'one-pieces' | undefined;
    cacheKey: string;
  }): Promise<{ resultUrl: string }> {
    this.logger.log('⚡ Calling FAL AI...');
    // ✅ Configure fal
    fal.config({
      credentials: this.falKey,
    });

    try {
      const result = await fal.subscribe(FAL_MODEL, {
        input: {
          model_image: data.personImageUrl,
          garment_image: data.garmentImageUrl,
          category: data.category ?? 'auto',
          mode: 'quality',
          output_format: 'jpeg',
          // num_samples: 2,           // generate 2 images and pick best
          seed: Math.floor(Math.random() * 1e6), // helps avoid same bad artifacts
        },
        logs: true,
      });
      this.logger.log('📸 FAL result:', JSON.stringify(result));
      const resultUrl = result.data?.images?.[0]?.url;

      if (!resultUrl) {
        this.logger.error('❌ No image returned from FAL');
        this.logger.error('Full response:', JSON.stringify(result));
        throw new Error('No result image returned from fal');
      }

      // ✅ Save result (cache)
      await this.resultRepo.save({
        cacheKey: data.cacheKey,
        resultUrl,
        personImageUrl: data.personImageUrl,
        garmentImageUrl: data.garmentImageUrl,
        category: data.category,
      });

      this.logger.log(`Try-on completed and cached: ${data.cacheKey}`);

      return { resultUrl };
    } catch (error) {
      this.logger.error(`Try-on failed: ${error.message}`);
      throw new Error('Try-on generation failed');
    }
  }
}
