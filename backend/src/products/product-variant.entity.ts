// src/products/product-variant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
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
  size: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
