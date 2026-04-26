import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SizeGuide {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  brandId: number;

  @Column({ nullable: true })
  productId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Column headers e.g. ['Size', 'Chest', 'Waist']
  @Column('simple-array')
  headers: string[];

  // Rows as JSON: [{label: 'S', values: {Chest: '34"', Waist: '28"'}}]
  @Column({ type: 'json' })
  rows: { label: string; values: Record<string, string> }[];

  @Column({ default: 'in' })
  unit: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
