import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { EmailCampaign } from './email-campaign.entity';
import { EmailCampaignsService } from './email-campaigns.service';
import { EmailCampaignsController } from './email-campaigns.controller';
import { EmailCampaignProcessor } from './email-campaign.processor';
import { BrandsModule } from '../brands/brands.module';
import { MailModule } from '../common/mail/mail.module';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailCampaign, User]),
    BullModule.registerQueue({ name: 'email-campaign' }),
    BrandsModule,
    MailModule,
  ],
  controllers: [EmailCampaignsController],
  providers: [EmailCampaignsService, EmailCampaignProcessor],
  exports: [EmailCampaignsService],
})
export class EmailCampaignsModule {}
