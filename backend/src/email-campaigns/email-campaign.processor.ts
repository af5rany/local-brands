import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCampaign } from './email-campaign.entity';
import { MailService } from '../common/mail/mail.service';
import { User } from '../users/user.entity';

@Processor('email-campaign')
export class EmailCampaignProcessor extends WorkerHost {
  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepo: Repository<EmailCampaign>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<{ campaignId: number; userIds: number[] }>): Promise<void> {
    const { campaignId, userIds } = job.data;

    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: ['brand'],
    });
    if (!campaign) return;

    const users = await this.userRepo.find({
      where: userIds.map((id) => ({ id })),
      select: ['id', 'email', 'name'],
    });

    let sentCount = 0;
    for (const user of users) {
      if (!user.email) continue;
      await this.mailService.sendCampaignEmail(
        user.email,
        campaign.subject,
        campaign.body,
        campaign.brand?.name,
      );
      sentCount++;
    }

    await this.campaignRepo.update(campaignId, {
      sentCount: () => `sentCount + ${sentCount}`,
    });
  }
}
