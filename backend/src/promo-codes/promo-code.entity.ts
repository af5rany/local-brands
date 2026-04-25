import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { PromoCodeType } from '../common/enums/promo-code.enum';

@Entity()
@Index(['code'])
@Index(['brandId', 'isActive'])
export class PromoCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: PromoCodeType })
  type: PromoCodeType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number;

  @Column({ nullable: true })
  maxUses: number;

  @Column({ default: 0 })
  usesCount: number;

  @Column({ default: 1 })
  maxUsesPerUser: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  expiryDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  brandId: number;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
