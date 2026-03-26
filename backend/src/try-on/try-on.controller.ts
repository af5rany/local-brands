import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Submit a virtual try-on job (returns cached result or queues generation)' })
  @ApiResponse({ status: 201, description: 'Returns jobId and optionally cached resultUrl' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  submit(@Body() dto: TryOnDto) {
    return this.tryOnService.submit(dto);
  }

  @Get(':jobId/status')
  @ApiOperation({ summary: 'Check the status of a try-on job' })
  @ApiResponse({ status: 200, description: 'Returns job status and resultUrl when completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatus(@Param('jobId') jobId: string) {
    return this.tryOnService.getStatus(jobId);
  }
}
