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
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Brand } from '../../brands/brand.entity';
import { PostLike } from './post-like.entity';
import { PostComment } from './post-comment.entity';
import { PostProduct } from './post-product.entity';
import { PostStatus } from '../../common/enums/feed.enum';

@Entity()
@Index(['brandId', 'createdAt'])
@Index(['authorId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brandId: number;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column()
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('simple-array')
  images: string[];

  @Column('text', { nullable: true })
  caption: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @OneToMany(() => PostProduct, (pp) => pp.post, { cascade: true })
  postProducts: PostProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
