import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Brand } from '../brands/brand.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { ReturnStatus, ReturnReason } from '../common/enums/return.enum';

@Entity()
@Index(['userId'])
@Index(['brandId', 'status'])
@Index(['orderId'])
export class ReturnRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderItemId: number;

  @ManyToOne(() => OrderItem, { nullable: true })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  brandId: number;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ type: 'enum', enum: ReturnReason })
  reason: ReturnReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ nullable: true })
  returnTrackingNumber: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
