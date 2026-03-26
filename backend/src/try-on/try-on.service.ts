import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TryOnDto } from './dto/try-on.dto';

const FAL_MODEL = 'fal-ai/cat-vton';
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
        human_image_url: dto.personImageUrl,
        garment_image_url: dto.garmentImageUrl,
        cloth_type: dto.clothType || 'upper',
      }),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      throw new InternalServerErrorException(`fal.ai submit failed (${submitRes.status}): ${text}`);
    }

    const { request_id } = (await submitRes.json()) as { request_id: string };
    const statusUrl = `${FAL_QUEUE_URL}/requests/${request_id}`;

    // 2. Poll for completion (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(statusUrl, { headers });
      if (!statusRes.ok) continue;

      const status = (await statusRes.json()) as any;

      if (status.status === 'COMPLETED') {
        const resultUrl =
          status.output?.image?.url || status.output?.images?.[0]?.url;
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
