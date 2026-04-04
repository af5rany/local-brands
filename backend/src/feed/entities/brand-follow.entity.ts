import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Brand } from '../../brands/brand.entity';

@Entity()
@Unique(['userId', 'brandId'])
@Index(['brandId'])
export class BrandFollow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  brandId: number;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ default: true })
  notifyOnPost: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
