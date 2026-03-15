import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductReview, ReviewStatus } from './review.entity';
import { Product } from '../products/product.entity';
import { OrderItem } from '../orders/order-item.entity';
import { OrderStatus } from 'src/common/enums/order.enum';

@Injectable()
export class ReviewsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(
    userId: number,
    productId: number,
    rating: number,
    comment?: string,
    orderItemId?: number,
  ): Promise<ProductReview> {
    // 1. Basic Validation
    if (rating < 1 || rating > 5)
      throw new BadRequestException('Rating must be between 1 and 5');

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    // 2. Verified Purchase Check
    let isVerifiedPurchase = false;
    if (orderItemId) {
      const orderItem = await this.orderItemRepository.findOne({
        where: { id: orderItemId, productId },
        relations: ['order', 'order.user'],
      });

      if (!orderItem) throw new BadRequestException('Invalid order item');

      const order = orderItem.order;
      if (order.user.id !== userId)
        throw new ForbiddenException('You did not purchase this item');
      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException(
          'You can only review items from delivered orders',
        );
      }
      isVerifiedPurchase = true;
    }

    // 3. Create Review (Pending by default)
    const review = this.reviewRepository.create({
      userId,
      productId,
      orderItemId,
      rating,
      comment,
      isVerifiedPurchase,
      status: ReviewStatus.PENDING,
    });

    return this.reviewRepository.save(review);
  }

  async findByProduct(productId: number, page = 1, limit = 10) {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { productId, status: ReviewStatus.APPROVED },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: reviews,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async approve(reviewId: number, adminId: number): Promise<ProductReview> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['product'],
    });
    if (!review) throw new NotFoundException('Review not found');

    if (review.status === ReviewStatus.APPROVED) return review;

    return await this.dataSource.transaction(async (manager) => {
      review.status = ReviewStatus.APPROVED;
      const savedReview = await manager.save(ProductReview, review);

      // Update Product Aggregates
      const product = review.product;
      const ratingSum = Number(product.ratingSum || 0) + review.rating;
      const reviewCount = Number(product.reviewCount || 0) + 1;
      const averageRating = ratingSum / reviewCount;

      await manager.update(Product, product.id, {
        ratingSum,
        reviewCount,
        averageRating,
      });

      return savedReview;
    });
  }

  async reject(reviewId: number, adminId: number): Promise<ProductReview> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    review.status = ReviewStatus.REJECTED;
    return this.reviewRepository.save(review);
  }
}
