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
import { ShippingZone } from './shipping-zone.entity';
import { ShippingMethod } from '../common/enums/shipping.enum';

@Entity()
@Index(['zoneId', 'isActive'])
export class ShippingRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  zoneId: number;

  @ManyToOne(() => ShippingZone, (zone) => zone.rates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: ShippingZone;

  @Column()
  methodName: string;

  @Column({ type: 'enum', enum: ShippingMethod })
  method: ShippingMethod;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  minWeight: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maxWeight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  estimatedDays: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
