import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('try_on_results')
export class TryOnResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  cacheKey: string;

  @Column({ type: 'text' })
  resultUrl: string;

  @Column({ type: 'text' })
  personImageUrl: string;

  @Column({ type: 'text' })
  garmentImageUrl: string;

  @Column({ type: 'varchar', length: 20, default: 'auto' })
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}
