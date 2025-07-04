// src/orders/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';

@Entity()
@Index(['order', 'product'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn()
  product: Product;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  // ✅ Store product snapshot at time of order (unchanged)
  @Column()
  productName: string;

  @Column({ nullable: true })
  productColor: string;

  @Column({ nullable: true })
  productSize: string;

  @Column({ nullable: true })
  productImage: string;

  // ✅ Add brand snapshot for better reporting
  @Column({ nullable: true })
  brandName: string;

  @Column({ nullable: true })
  productSku: string;
}
