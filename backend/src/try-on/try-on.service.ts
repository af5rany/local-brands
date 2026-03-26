import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { TryOnDto } from './dto/try-on.dto';
import { TryOnResult } from './try-on-result.entity';

const FAL_MODEL = 'fal-ai/fashn/tryon/v1.6';
const FAL_QUEUE_URL = `https://queue.fal.run/${FAL_MODEL}`;

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

  private generateCacheKey(personUrl: string, garmentUrl: string, category: string): string {
    return crypto
      .createHash('md5')
      .update(`${personUrl}|${garmentUrl}|${category}`)
      .digest('hex');
  }

  /**
   * Submit a try-on job. Returns cached result instantly or queues a new job.
   */
  async submit(dto: TryOnDto): Promise<{ jobId: string; resultUrl?: string; cached: boolean }> {
    const category = dto.category || 'auto';
    const cacheKey = this.generateCacheKey(dto.personImageUrl, dto.garmentImageUrl, category);

    // Check cache first
    const cached = await this.resultRepo.findOne({ where: { cacheKey } });
    if (cached) {
      this.logger.log(`Cache hit for key ${cacheKey}`);
      return { jobId: cacheKey, resultUrl: cached.resultUrl, cached: true };
    }

    // Queue the job with retry
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
   * Check the status of a try-on job.
   */
  async getStatus(jobId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
  }> {
    // Check cache first (job may have completed and been cleaned up)
    const cached = await this.resultRepo.findOne({ where: { cacheKey: jobId } });
    if (cached) {
      return { status: 'completed', resultUrl: cached.resultUrl };
    }

    const job = await this.tryOnQueue.getJob(jobId);
    if (!job) {
      return { status: 'failed', error: 'Job not found' };
    }

    const state = await job.getState();

    if (state === 'completed') {
      const result = job.returnvalue as { resultUrl: string } | undefined;
      return { status: 'completed', resultUrl: result?.resultUrl };
    }

    if (state === 'failed') {
      return { status: 'failed', error: job.failedReason || 'Generation failed' };
    }

    if (state === 'active') {
      return { status: 'processing' };
    }

    return { status: 'queued' };
  }

  /**
   * Called by the worker to actually run the fal.ai generation.
   */
  async processJob(data: {
    personImageUrl: string;
    garmentImageUrl: string;
    category: string;
    cacheKey: string;
  }): Promise<{ resultUrl: string }> {
    const headers = {
      Authorization: `Key ${this.falKey}`,
      'Content-Type': 'application/json',
    };

    // 1. Submit to fal.ai
    const submitRes = await fetch(FAL_QUEUE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_image: data.personImageUrl,
        garment_image: data.garmentImageUrl,
        category: data.category,
        mode: 'balanced',
        output_format: 'jpeg',
      }),
    });

    if (!submitRes.ok) {
      throw new Error(`fal.ai submit failed (${submitRes.status})`);
    }

    const { request_id } = (await submitRes.json()) as { request_id: string };

    // 2. Poll for completion (max 120s)
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(
        `${FAL_QUEUE_URL}/requests/${request_id}/status`,
        { headers },
      );
      if (!statusRes.ok) continue;

      const status = (await statusRes.json()) as any;

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `${FAL_QUEUE_URL}/requests/${request_id}`,
          { headers },
        );
        if (!resultRes.ok) throw new Error('Failed to fetch try-on result');

        const result = (await resultRes.json()) as any;
        const resultUrl = result.images?.[0]?.url;
        if (!resultUrl) throw new Error('No result image in response');

        // Save to cache
        await this.resultRepo.save({
          cacheKey: data.cacheKey,
          resultUrl,
          personImageUrl: data.personImageUrl,
          garmentImageUrl: data.garmentImageUrl,
          category: data.category,
        });

        this.logger.log(`Try-on completed and cached: ${data.cacheKey}`);
        return { resultUrl };
      }

      if (status.status === 'FAILED') {
        throw new Error(status.error || 'Try-on generation failed');
      }
    }

    throw new Error('Try-on timed out after 120 seconds');
  }
}
