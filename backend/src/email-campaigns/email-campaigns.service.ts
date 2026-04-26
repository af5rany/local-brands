import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailCampaign } from './email-campaign.entity';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { BrandsService } from '../brands/brands.service';
import { User } from '../users/user.entity';

@Injectable()
export class EmailCampaignsService {
  constructor(
    @InjectRepository(EmailCampaign)
    private campaignRepo: Repository<EmailCampaign>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectQueue('email-campaign')
    private emailQueue: Queue,
    private brandsService: BrandsService,
  ) {}

  async create(brandId: number, dto: CreateEmailCampaignDto): Promise<EmailCampaign> {
    const campaign = this.campaignRepo.create({ brandId, ...dto });
    if (dto.scheduledAt) campaign.status = 'scheduled';
    return this.campaignRepo.save(campaign);
  }

  async update(id: number, dto: Partial<CreateEmailCampaignDto>): Promise<EmailCampaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, dto);
    return this.campaignRepo.save(campaign);
  }

  async findOne(id: number): Promise<EmailCampaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async findAllByBrand(brandId: number): Promise<EmailCampaign[]> {
    return this.campaignRepo.find({ where: { brandId }, order: { createdAt: 'DESC' } });
  }

  async send(campaignId: number): Promise<EmailCampaign> {
    const campaign = await this.findOne(campaignId);
    const followerIds = await this.brandsService.getFollowerIds(campaign.brandId);

    if (followerIds.length === 0) {
      campaign.status = 'sent';
      campaign.sentAt = new Date();
      return this.campaignRepo.save(campaign);
    }

    campaign.status = 'sending';
    campaign.recipientCount = followerIds.length;
    await this.campaignRepo.save(campaign);

    // Chunk into batches of 50
    const batchSize = 50;
    for (let i = 0; i < followerIds.length; i += batchSize) {
      const chunk = followerIds.slice(i, i + batchSize);
      await this.emailQueue.add('send-batch', {
        campaignId,
        userIds: chunk,
      });
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    return this.campaignRepo.save(campaign);
  }

  async schedule(campaignId: number, scheduledAt: Date): Promise<EmailCampaign> {
    const campaign = await this.findOne(campaignId);
    campaign.scheduledAt = scheduledAt;
    campaign.status = 'scheduled';
    await this.campaignRepo.save(campaign);

    const delay = scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      const followerIds = await this.brandsService.getFollowerIds(campaign.brandId);
      await this.emailQueue.add(
        'send-batch',
        { campaignId, userIds: followerIds },
        { delay },
      );
    }

    return campaign;
  }

  async remove(id: number): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepo.remove(campaign);
  }
}
