import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('my-code')
  async getMyReferralCode(@Request() req) {
    return this.referralsService.getOrCreateReferralCode(req.user.id);
  }

  @Post('apply')
  async applyCode(@Request() req, @Body('code') code: string) {
    return this.referralsService.applyReferralCode(code, req.user.id);
  }

  @Get('my-referrals')
  async getMyReferrals(@Request() req) {
    return this.referralsService.getMyReferrals(req.user.id);
  }
}
