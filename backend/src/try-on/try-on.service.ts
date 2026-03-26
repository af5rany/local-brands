import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TryOnDto } from './dto/try-on.dto';

const FAL_MODEL = 'fal-ai/fashn/tryon/v1.6';
const FAL_QUEUE_URL = `https://queue.fal.run/${FAL_MODEL}`;

@Injectable()
export class TryOnService {
  private get key(): string {
    const k = process.env.FAL_KEY;
    if (!k) throw new InternalServerErrorException('FAL_KEY is not configured');
    return k;
  }

  async tryon(dto: TryOnDto): Promise<{ resultUrl: string }> {
    const headers = {
      Authorization: `Key ${this.key}`,
      'Content-Type': 'application/json',
    };

    // 1. Submit job
    const submitRes = await fetch(FAL_QUEUE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model_image: dto.personImageUrl,
        garment_image: dto.garmentImageUrl,
        category: dto.category || 'auto',
        mode: 'balanced',
        output_format: 'jpeg',
      }),
    });

    if (!submitRes.ok) {
      if (submitRes.status === 403) {
        throw new InternalServerErrorException('Try-on is temporarily unavailable. Please try again later.');
      }
      throw new InternalServerErrorException('Failed to start try-on generation');
    }

    const { request_id } = (await submitRes.json()) as { request_id: string };
    const statusUrl = `${FAL_QUEUE_URL}/requests/${request_id}/status`;

    // 2. Poll for completion (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(statusUrl, { headers });
      if (!statusRes.ok) continue;

      const status = (await statusRes.json()) as any;

      if (status.status === 'COMPLETED') {
        // Fetch the actual result from the response endpoint
        const resultRes = await fetch(
          `${FAL_QUEUE_URL}/requests/${request_id}`,
          { headers },
        );
        if (!resultRes.ok) {
          throw new InternalServerErrorException('Failed to fetch try-on result');
        }
        const result = (await resultRes.json()) as any;
        const resultUrl = result.images?.[0]?.url;
        if (!resultUrl) {
          throw new InternalServerErrorException('No result image in response');
        }
        return { resultUrl };
      }

      if (status.status === 'FAILED') {
        throw new InternalServerErrorException(
          'Try-on model failed: ' + (status.error || 'unknown error'),
        );
      }
    }

    throw new InternalServerErrorException('Try-on timed out after 60 seconds');
  }
}
