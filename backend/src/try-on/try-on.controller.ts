import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TryOnService } from './try-on.service';
import { TryOnDto } from './dto/try-on.dto';

@ApiTags('try-on')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('try-on')
export class TryOnController {
  constructor(private readonly tryOnService: TryOnService) {}

  @Post()
  @ApiOperation({ summary: 'Virtual try-on: overlay a garment on a person image' })
  @ApiResponse({ status: 201, description: 'Returns resultUrl of the generated image' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  tryon(@Body() dto: TryOnDto): Promise<{ resultUrl: string }> {
    return this.tryOnService.tryon(dto);
  }
}
