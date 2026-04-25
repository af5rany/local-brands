import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';
import { ShippingRate } from './shipping-rate.entity';

@Entity()
@Index(['brandId', 'isActive'])
export class ShippingZone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('simple-array')
  countries: string[];

  @Column('simple-array', { nullable: true })
  regions: string[];

  @Column()
  brandId: number;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => ShippingRate, (rate) => rate.zone, { cascade: true })
  rates: ShippingRate[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
