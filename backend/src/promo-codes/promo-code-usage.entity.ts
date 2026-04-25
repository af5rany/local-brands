import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { PromoCode } from './promo-code.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';

@Entity()
@Unique(['promoCodeId', 'userId', 'orderId'])
@Index(['promoCodeId'])
@Index(['userId'])
export class PromoCodeUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  promoCodeId: number;

  @ManyToOne(() => PromoCode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promoCodeId' })
  promoCode: PromoCode;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('decimal', { precision: 10, scale: 2 })
  discountApplied: number;

  @CreateDateColumn()
  createdAt: Date;
}
