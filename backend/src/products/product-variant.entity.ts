// src/products/product-variant.entity.ts
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
import { Product } from './product.entity';

@Entity()
@Index(['sku'], { unique: true, where: '"sku" IS NOT NULL' })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'productId' })
  productId: number;

  @ManyToOne(() => Product, (product) => product.productVariants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: {
    color?: string;
    size?: string;
    [key: string]: any;
  };

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceOverride: number;

  @Column({ default: 0 })
  stock: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
