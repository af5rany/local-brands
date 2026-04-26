import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostProduct } from './entities/post-product.entity';
import { BrandFollow } from './entities/brand-follow.entity';
import { Brand } from '../brands/brand.entity';
import { Product } from '../products/product.entity';
import { BrandUser } from '../brands/brand-user.entity';
import { PostStatus } from '../common/enums/feed.enum';
import { UserRole } from '../common/enums/user.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(PostLike)
    private likeRepo: Repository<PostLike>,
    @InjectRepository(PostComment)
    private commentRepo: Repository<PostComment>,
    @InjectRepository(PostProduct)
    private postProductRepo: Repository<PostProduct>,
    @InjectRepository(BrandFollow)
    private followRepo: Repository<BrandFollow>,
    @InjectRepository(BrandUser)
    private brandUserRepo: Repository<BrandUser>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private notificationsService: NotificationsService,
  ) {}

  // ── Posts ──

  async createPost(dto: CreatePostDto, userId: number): Promise<Post> {
    await this.assertBrandOwnership(dto.brandId, userId);

    const brand = await this.brandRepo.findOne({ where: { id: dto.brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const post = this.postRepo.create({
      brandId: dto.brandId,
      authorId: userId,
      images: dto.images,
      caption: dto.caption,
    });
    const savedPost = await this.postRepo.save(post);

    // Tag products — support both legacy productIds[] and new products[] with x/y pins
    const taggedProducts: { productId: number; xPercent?: number; yPercent?: number }[] =
      (dto.products?.length ? dto.products : null) ??
      (dto.productIds || []).map((id) => ({ productId: id }));

    if (taggedProducts.length) {
      const productIds = taggedProducts.map((t) => t.productId);
      const products = await this.productRepo.find({
        where: { id: In(productIds), brandId: dto.brandId },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      const postProducts = taggedProducts
        .filter((t) => productMap.has(t.productId))
        .map((t) => {
          const pp = this.postProductRepo.create({ postId: savedPost.id, productId: t.productId });
          if (t.xPercent !== undefined) pp.xPercent = t.xPercent;
          if (t.yPercent !== undefined) pp.yPercent = t.yPercent;
          return pp;
        });
      await this.postProductRepo.save(postProducts);
    }

    // Notify followers (fire-and-forget)
    this.notifyFollowers(savedPost.id, dto.brandId, brand.name).catch(
      () => {},
    );

    return this.findPostById(savedPost.id);
  }

  async getFeed(
    query: FeedQueryDto,
    userId?: number,
  ): Promise<{ data: Post[]; pagination: any }> {
    const { page = 1, limit = 10, brandId, followedOnly } = query;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.brand', 'brand')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postProducts', 'postProducts')
      .leftJoinAndSelect('postProducts.product', 'product')
      .where('post.status = :status', { status: PostStatus.ACTIVE })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (brandId) {
      qb.andWhere('post.brandId = :brandId', { brandId });
    }

    if (followedOnly && userId) {
      qb.andWhere(
        'post.brandId IN (SELECT bf."brandId" FROM brand_follow bf WHERE bf."userId" = :userId)',
        { userId },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    // Attach liked status for authenticated users
    if (userId && data.length) {
      const postIds = data.map((p) => p.id);
      const likes = await this.likeRepo.find({
        where: { userId, postId: In(postIds) },
      });
      const likedSet = new Set(likes.map((l) => l.postId));
      data.forEach((p: any) => {
        p.isLiked = likedSet.has(p.id);
      });
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPostById(id: number, userId?: number): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id, status: PostStatus.ACTIVE },
      relations: ['brand', 'author', 'postProducts', 'postProducts.product'],
    });
    if (!post) throw new NotFoundException('Post not found');

    if (userId) {
      const liked = await this.likeRepo.findOne({
        where: { postId: id, userId },
      });
      (post as any).isLiked = !!liked;
    }

    return post;
  }

  async updatePost(
    id: number,
    dto: UpdatePostDto,
    userId: number,
  ): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    await this.assertBrandOwnership(post.brandId, userId);

    if (dto.caption !== undefined) {
      post.caption = dto.caption;
      await this.postRepo.save(post);
    }

    if (dto.productIds !== undefined || (dto as any).products !== undefined) {
      await this.postProductRepo.delete({ postId: id });
      const taggedProducts = (dto as any).products?.length
        ? (dto as any).products
        : (dto.productIds || []).map((pid: number) => ({ productId: pid }));
      if (taggedProducts.length) {
        const productIds = taggedProducts.map((t: any) => t.productId);
        const products = await this.productRepo.find({
          where: { id: In(productIds), brandId: post.brandId },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const postProducts = taggedProducts
          .filter((t: any) => productMap.has(t.productId))
          .map((t: any) => {
            const pp = this.postProductRepo.create({ postId: id, productId: t.productId });
            if (t.xPercent !== undefined) pp.xPercent = t.xPercent;
            if (t.yPercent !== undefined) pp.yPercent = t.yPercent;
            return pp;
          });
        await this.postProductRepo.save(postProducts);
      }
    }

    return this.findPostById(id);
  }

  async deletePost(
    id: number,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    if (userRole !== UserRole.ADMIN) {
      await this.assertBrandOwnership(post.brandId, userId);
    }

    await this.postRepo.softDelete(id);
  }

  // ── Likes ──

  async toggleLike(
    postId: number,
    userId: number,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.postRepo.findOne({
      where: { id: postId, status: PostStatus.ACTIVE },
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({
      where: { postId, userId },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likeCount', 1);
      const updated = await this.postRepo.findOne({ where: { id: postId } });
      return { liked: false, likeCount: updated?.likeCount ?? 0 };
    } else {
      await this.likeRepo.save(
        this.likeRepo.create({ postId, userId }),
      );
      await this.postRepo.increment({ id: postId }, 'likeCount', 1);
      const updated = await this.postRepo.findOne({ where: { id: postId } });
      return { liked: true, likeCount: updated?.likeCount ?? 0 };
    }
  }

  async isLiked(postId: number, userId: number): Promise<{ liked: boolean }> {
    const count = await this.likeRepo.count({ where: { postId, userId } });
    return { liked: count > 0 };
  }

  // ── Comments ──

  async getComments(
    postId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: PostComment[]; pagination: any }> {
    const [data, total] = await this.commentRepo.findAndCount({
      where: { postId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addComment(
    postId: number,
    dto: CreateCommentDto,
    userId: number,
  ): Promise<PostComment> {
    const post = await this.postRepo.findOne({
      where: { id: postId, status: PostStatus.ACTIVE },
    });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepo.create({
      postId,
      userId,
      text: dto.text,
    });
    const saved = await this.commentRepo.save(comment);
    await this.postRepo.increment({ id: postId }, 'commentCount', 1);

    return (await this.commentRepo.findOne({
      where: { id: saved.id },
    }))!;
  }

  async deleteComment(
    commentId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['post'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Allow: comment owner, brand owner of the post's brand, or admin
    if (userRole !== UserRole.ADMIN && comment.userId !== userId) {
      const brandUser = await this.brandUserRepo.findOne({
        where: { userId, brandId: comment.post.brandId },
      });
      if (!brandUser) {
        throw new ForbiddenException('Not allowed to delete this comment');
      }
    }

    await this.commentRepo.softDelete(commentId);
    await this.postRepo.decrement({ id: comment.postId }, 'commentCount', 1);
  }

  // ── Brand Follows ──

  async toggleFollow(
    brandId: number,
    userId: number,
  ): Promise<{ following: boolean }> {
    const brand = await this.brandRepo.findOne({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const existing = await this.followRepo.findOne({
      where: { brandId, userId },
    });

    if (existing) {
      await this.followRepo.remove(existing);
      return { following: false };
    } else {
      await this.followRepo.save(
        this.followRepo.create({ brandId, userId }),
      );
      return { following: true };
    }
  }

  async getFollowStatus(
    brandId: number,
    userId: number,
  ): Promise<{ following: boolean; notifyOnPost: boolean }> {
    const follow = await this.followRepo.findOne({
      where: { brandId, userId },
    });
    return {
      following: !!follow,
      notifyOnPost: follow?.notifyOnPost ?? false,
    };
  }

  async toggleNotify(
    brandId: number,
    userId: number,
  ): Promise<{ notifyOnPost: boolean }> {
    const follow = await this.followRepo.findOne({
      where: { brandId, userId },
    });
    if (!follow)
      throw new BadRequestException('You must follow this brand first');

    follow.notifyOnPost = !follow.notifyOnPost;
    await this.followRepo.save(follow);
    return { notifyOnPost: follow.notifyOnPost };
  }

  async getFollowedBrands(userId: number): Promise<BrandFollow[]> {
    return this.followRepo.find({
      where: { userId },
      relations: ['brand'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Helpers ──

  private async assertBrandOwnership(
    brandId: number,
    userId: number,
  ): Promise<void> {
    const brandUser = await this.brandUserRepo.findOne({
      where: { userId, brandId },
    });
    if (!brandUser) {
      throw new ForbiddenException('You do not own this brand');
    }
  }

  private async notifyFollowers(
    postId: number,
    brandId: number,
    brandName: string,
  ): Promise<void> {
    const followers = await this.followRepo.find({
      where: { brandId, notifyOnPost: true },
    });
    if (!followers.length) return;

    const userIds = followers.map((f) => f.userId);
    await this.notificationsService.createBulk(
      userIds,
      NotificationType.NEW_POST,
      `New from ${brandName}`,
      `${brandName} just shared a new post`,
      { postId, brandId },
    );
  }
}
