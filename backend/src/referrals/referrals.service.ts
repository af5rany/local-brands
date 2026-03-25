import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus } from './referral.entity';
import { User } from '../users/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getOrCreateReferralCode(userId: number): Promise<{ referralCode: string; referrals: Referral[] }> {
    let existing = await this.referralRepo.findOne({
      where: { referrerId: userId, referredUserId: null as any },
    });

    if (!existing) {
      const code = uuidv4().slice(0, 8).toUpperCase();
      existing = this.referralRepo.create({
        referrer: { id: userId } as User,
        referralCode: code,
        status: ReferralStatus.PENDING,
      });
      await this.referralRepo.save(existing);
    }

    const referrals = await this.referralRepo.find({
      where: { referrerId: userId },
      relations: ['referredUser'],
      order: { createdAt: 'DESC' },
    });

    return { referralCode: existing.referralCode, referrals };
  }

  async applyReferralCode(code: string, newUserId: number): Promise<Referral> {
    const referral = await this.referralRepo.findOne({
      where: { referralCode: code },
    });

    if (!referral) throw new NotFoundException('Invalid referral code');
    if (referral.referrerId === newUserId) throw new BadRequestException('Cannot use your own referral code');

    const newReferral = this.referralRepo.create({
      referrer: { id: referral.referrerId } as User,
      referredUser: { id: newUserId } as User,
      referralCode: code + '-' + uuidv4().slice(0, 4).toUpperCase(),
      status: ReferralStatus.SIGNED_UP,
      discountPercentage: referral.discountPercentage,
    });

    return this.referralRepo.save(newReferral);
  }

  async markOrderPlaced(userId: number): Promise<void> {
    await this.referralRepo.update(
      { referredUserId: userId, status: ReferralStatus.SIGNED_UP },
      { status: ReferralStatus.ORDER_PLACED },
    );
  }

  async completeReferral(userId: number): Promise<void> {
    const referral = await this.referralRepo.findOne({
      where: { referredUserId: userId, status: ReferralStatus.ORDER_PLACED },
    });

    if (referral) {
      referral.status = ReferralStatus.COMPLETED;
      referral.discountCode = 'REF-' + uuidv4().slice(0, 6).toUpperCase();
      await this.referralRepo.save(referral);
    }
  }

  async getMyReferrals(userId: number): Promise<Referral[]> {
    return this.referralRepo.find({
      where: { referrerId: userId },
      relations: ['referredUser'],
      order: { createdAt: 'DESC' },
    });
  }
}
