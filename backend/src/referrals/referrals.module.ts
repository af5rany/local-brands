import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './referral.entity';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User])],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
