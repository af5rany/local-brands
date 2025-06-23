import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../brands/brand.entity';

export enum ProductType {
  SHOES = 'Shoes',
  HOODIES = 'Hoodies',
  SHIRTS = 'Shirts',
  ACCESSORIES = 'Accessories',
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductType,
    nullable: true,
  })
  productType: ProductType;

  @Column({ nullable: true })
  subcategory: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @ManyToOne(() => Brand, { eager: true })
  brand: Brand;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
