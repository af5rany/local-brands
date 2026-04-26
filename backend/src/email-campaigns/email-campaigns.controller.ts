import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailCampaignsService } from './email-campaigns.service';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { BrandAccessGuard } from '../auth/brand-access.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user.enum';

@ApiTags('email-campaigns')
@Controller('brands/:id/email-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.BRAND_OWNER)
@UseGuards(BrandAccessGuard)
export class EmailCampaignsController {
  constructor(private service: EmailCampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns for brand' })
  findAll(@Param('id', ParseIntPipe) brandId: number) {
    return this.service.findAllByBrand(brandId);
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create draft campaign' })
  create(
    @Param('id', ParseIntPipe) brandId: number,
    @Body() dto: CreateEmailCampaignDto,
  ) {
    return this.service.create(brandId, dto);
  }

  @Put(':campaignId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update campaign' })
  update(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body() dto: CreateEmailCampaignDto,
  ) {
    return this.service.update(campaignId, dto);
  }

  @Post(':campaignId/send')
  @ApiOperation({ summary: 'Send campaign to all brand followers' })
  send(@Param('campaignId', ParseIntPipe) campaignId: number) {
    return this.service.send(campaignId);
  }

  @Post(':campaignId/schedule')
  @ApiOperation({ summary: 'Schedule campaign' })
  schedule(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.service.schedule(campaignId, new Date(scheduledAt));
  }

  @Delete(':campaignId')
  @ApiOperation({ summary: 'Delete campaign' })
  remove(@Param('campaignId', ParseIntPipe) campaignId: number) {
    return this.service.remove(campaignId);
  }
}
