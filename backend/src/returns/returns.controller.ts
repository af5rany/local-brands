import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpsertReturnPolicyDto } from './dto/upsert-return-policy.dto';
import { ReturnStatus } from '../common/enums/return.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';

@ApiTags('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // ── Customer endpoints ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Submit a return request' })
  @Post('returns')
  createReturn(
    @Body(ValidationPipe) dto: CreateReturnRequestDto,
    @Request() req,
  ) {
    return this.returnsService.createReturnRequest(req.user.id, dto);
  }

  @ApiOperation({ summary: "List customer's return requests" })
  @Get('returns/my-returns')
  getMyReturns(
    @Request() req,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.returnsService.getReturnsByUser(req.user.id, query);
  }

  @ApiOperation({ summary: 'Get a return request detail' })
  @Get('returns/:id')
  getReturn(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.getReturnById(id);
  }

  @ApiOperation({ summary: 'Customer marks return as shipped back' })
  @Put('returns/:id/ship')
  markShipped(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trackingNumber?: string },
    @Request() req,
  ) {
    return this.returnsService.markShippedBack(id, req.user.id, body.trackingNumber);
  }

  // ── Brand owner endpoints ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List returns for a brand' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/returns')
  getBrandReturns(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Query() query: { page?: number; limit?: number; status?: ReturnStatus },
  ) {
    return this.returnsService.getReturnsByBrand(brandId, query);
  }

  @ApiOperation({ summary: 'Get return detail for brand owner' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/returns/:id')
  getBrandReturn(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.getReturnById(id);
  }

  @ApiOperation({ summary: 'Approve a return request' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/returns/:id/approve')
  approveReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes?: string },
  ) {
    return this.returnsService.approveReturn(id, body.notes);
  }

  @ApiOperation({ summary: 'Reject a return request' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/returns/:id/reject')
  rejectReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes: string },
  ) {
    return this.returnsService.rejectReturn(id, body.notes);
  }

  @ApiOperation({ summary: 'Mark return as received' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/returns/:id/received')
  markReceived(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.markReceived(id);
  }

  @ApiOperation({ summary: 'Process refund and restore stock' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/returns/:id/refund')
  processRefund(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.completeRefund(id);
  }

  // ── Return policy endpoints ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get return policy for a brand' })
  @UseGuards(BrandAccessGuard)
  @Get('brands/:brandId/return-policy')
  getPolicy(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.returnsService.getReturnPolicy(brandId);
  }

  @ApiOperation({ summary: 'Create or update return policy for a brand' })
  @UseGuards(BrandAccessGuard)
  @Put('brands/:brandId/return-policy')
  upsertPolicy(
    @Param('brandId', ParseIntPipe) brandId: number,
    @Body(ValidationPipe) dto: UpsertReturnPolicyDto,
  ) {
    return this.returnsService.upsertReturnPolicy(brandId, dto);
  }
}
