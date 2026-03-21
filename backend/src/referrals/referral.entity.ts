import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  SIGNED_UP = 'signed_up',
  ORDER_PLACED = 'order_placed',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity()
@Index(['referralCode'], { unique: true })
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrerId' })
  referrer: User;

  @Column()
  referrerId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referredUserId' })
  referredUser: User;

  @Column({ nullable: true })
  referredUserId: number;

  @Column({ unique: true })
  referralCode: string;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Column('decimal', { precision: 5, scale: 2, default: 10 })
  discountPercentage: number;

  @Column({ nullable: true })
  discountCode: string;

  @Column({ default: false })
  rewardClaimed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
