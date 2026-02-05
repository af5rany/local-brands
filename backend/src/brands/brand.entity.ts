// src/brands/brand.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { BrandUser } from './brand-user.entity';
import { BrandStatus } from 'src/common/enums/brand.enum';

@Entity()
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: BrandStatus,
    default: BrandStatus.DRAFT,
  })
  status: BrandStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  location: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @OneToMany(() => BrandUser, (brandUser) => brandUser.brand)
  brandUsers: BrandUser[];

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
