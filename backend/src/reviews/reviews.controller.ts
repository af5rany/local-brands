import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a product review' })
  async create(
    @Request() req,
    @Body()
    body: {
      productId: number;
      rating: number;
      comment?: string;
      orderItemId?: number;
    },
  ) {
    return this.reviewsService.create(
      req.user.id,
      body.productId,
      body.rating,
      body.comment,
      body.orderItemId,
    );
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get approved reviews for a product' })
  async findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.reviewsService.findByProduct(productId, page, limit);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a review (Admin only)' })
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.reviewsService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a review (Admin only)' })
  async reject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.reviewsService.reject(id, req.user.id);
  }
}
