import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';

@Entity()
export class ReturnPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  brandId: number;

  @OneToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ default: 30 })
  returnWindowDays: number;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ default: false })
  requiresImages: boolean;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  restockingFeePercent: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
