import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  DISCOUNT = 'discount',
  REFERRAL = 'referral',
  STOCK_ALERT = 'stock_alert',
  GENERAL = 'general',
  NEW_PRODUCT = 'new_product',
  NEW_BRAND = 'new_brand',
  PRICE_DROP = 'price_drop',
}

@Entity()
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
