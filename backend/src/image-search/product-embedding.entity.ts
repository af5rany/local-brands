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
import { Product } from '../products/product.entity';

@Entity('product_embedding')
export class ProductEmbedding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  // The vector(512) column is managed via raw SQL in ImageSearchService.onModuleInit()
  // because TypeORM does not support the pgvector 'vector' type.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
