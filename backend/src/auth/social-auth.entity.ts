// src/auth/social-auth.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
}

@Entity()
@Unique(['provider', 'providerId'])
@Index(['user', 'provider'])
export class SocialAuth {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: SocialProvider,
  })
  provider: SocialProvider;

  @Column()
  providerId: string;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  tokenExpiry: Date;

  @Column({ type: 'json', nullable: true })
  profile: {
    email?: string;
    name?: string;
    avatar?: string;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
