import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReturnRequest } from './return-request.entity';
import { ReturnPolicy } from './return-policy.entity';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpsertReturnPolicyDto } from './dto/upsert-return-policy.dto';
import { ReturnStatus } from '../common/enums/return.enum';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { OrderStatus } from '../common/enums/order.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRequestRepository: Repository<ReturnRequest>,
    @InjectRepository(ReturnPolicy)
    private returnPolicyRepository: Repository<ReturnPolicy>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async createReturnRequest(
    userId: number,
    dto: CreateReturnRequestDto,
  ): Promise<ReturnRequest> {
    // Validate order ownership
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, user: { id: userId } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    // Check return window
    const policy = await this.getReturnPolicy(dto.brandId);
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const windowMs = policy.returnWindowDays * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveredAt.getTime() > windowMs) {
      throw new BadRequestException(
        `Return window of ${policy.returnWindowDays} days has passed`,
      );
    }

    // Check if return already exists for this order+brand
    const existing = await this.returnRequestRepository.findOne({
      where: {
        orderId: dto.orderId,
        brandId: dto.brandId,
        userId,
      },
    });
    if (existing) {
      throw new BadRequestException('A return request already exists for this order');
    }

    const returnRequest = this.returnRequestRepository.create({
      orderId: dto.orderId,
      orderItemId: dto.orderItemId,
      userId,
      brandId: dto.brandId,
      reason: dto.reason,
      description: dto.description,
      images: dto.images,
      status: ReturnStatus.REQUESTED,
    });

    const saved = await this.returnRequestRepository.save(returnRequest);

    // Notify brand owner — find brand owner user IDs
    // (fire-and-forget)
    this.notificationsService
      .create(
        userId,
        NotificationType.RETURN_UPDATE,
        'Return Request Submitted',
        `Your return request #${saved.id} has been submitted and is awaiting review.`,
        { returnId: saved.id, orderId: dto.orderId },
      )
      .catch(() => {});

    return saved;
  }

  async getReturnsByUser(
    userId: number,
    query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 10 } = query;
    const [items, total] = await this.returnRequestRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['order'],
    });
    return { items, total, page, limit };
  }

  async getReturnsByBrand(
    brandId: number,
    query: { page?: number; limit?: number; status?: ReturnStatus },
  ) {
    const { page = 1, limit = 10, status } = query;
    const where: any = { brandId };
    if (status) where.status = status;

    const [items, total] = await this.returnRequestRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['order', 'user'],
    });
    return { items, total, page, limit };
  }

  async getReturnById(id: number): Promise<ReturnRequest> {
    const r = await this.returnRequestRepository.findOne({
      where: { id },
      relations: ['order', 'orderItem', 'user', 'brand'],
    });
    if (!r) throw new NotFoundException('Return request not found');
    return r;
  }

  async approveReturn(
    id: number,
    notes?: string,
  ): Promise<ReturnRequest> {
    const r = await this.getReturnById(id);
    if (r.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED returns can be approved');
    }

    r.status = ReturnStatus.APPROVED;
    if (notes) r.adminNotes = notes;
    const saved = await this.returnRequestRepository.save(r);

    this.notificationsService
      .create(
        r.userId,
        NotificationType.RETURN_UPDATE,
        'Return Approved',
        `Your return request #${id} has been approved. Please ship the item back.`,
        { returnId: id },
      )
      .catch(() => {});

    return saved;
  }

  async rejectReturn(
    id: number,
    notes: string,
  ): Promise<ReturnRequest> {
    if (!notes) throw new BadRequestException('Notes required when rejecting');
    const r = await this.getReturnById(id);
    if (r.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED returns can be rejected');
    }

    r.status = ReturnStatus.REJECTED;
    r.adminNotes = notes;
    r.resolvedAt = new Date();
    const saved = await this.returnRequestRepository.save(r);

    this.notificationsService
      .create(
        r.userId,
        NotificationType.RETURN_UPDATE,
        'Return Request Rejected',
        `Your return request #${id} was rejected. Reason: ${notes}`,
        { returnId: id },
      )
      .catch(() => {});

    return saved;
  }

  async markShippedBack(id: number, userId: number, trackingNumber?: string): Promise<ReturnRequest> {
    const r = await this.getReturnById(id);
    if (r.userId !== userId) throw new ForbiddenException('Not your return');
    if (r.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Return must be APPROVED before marking as shipped');
    }

    r.status = ReturnStatus.SHIPPED_BACK;
    if (trackingNumber) r.returnTrackingNumber = trackingNumber;
    return this.returnRequestRepository.save(r);
  }

  async markReceived(id: number): Promise<ReturnRequest> {
    const r = await this.getReturnById(id);
    if (r.status !== ReturnStatus.SHIPPED_BACK) {
      throw new BadRequestException('Return must be SHIPPED_BACK before marking as received');
    }

    r.status = ReturnStatus.RECEIVED;
    return this.returnRequestRepository.save(r);
  }

  async completeRefund(id: number): Promise<ReturnRequest> {
    const r = await this.getReturnById(id);
    if (r.status !== ReturnStatus.RECEIVED) {
      throw new BadRequestException('Return must be RECEIVED before processing refund');
    }

    const policy = await this.getReturnPolicy(r.brandId);

    return await this.dataSource.transaction(async (manager) => {
      // Restore stock
      if (r.orderItemId) {
        const item = await manager.findOne(OrderItem, { where: { id: r.orderItemId } });
        if (item) {
          if (item.variantId) {
            await manager.increment(ProductVariant, { id: item.variantId }, 'stock', item.quantity);
          } else {
            await manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
          }
          // Calculate refund (minus restocking fee)
          const fee = (Number(item.totalPrice) * Number(policy.restockingFeePercent)) / 100;
          r.refundAmount = Number(item.totalPrice) - fee;
        }
      }

      r.status = ReturnStatus.REFUNDED;
      r.resolvedAt = new Date();
      const saved = await manager.save(ReturnRequest, r);

      this.notificationsService
        .create(
          r.userId,
          NotificationType.RETURN_UPDATE,
          'Refund Processed',
          `Your refund of $${r.refundAmount?.toFixed(2)} for return #${id} has been processed.`,
          { returnId: id, refundAmount: r.refundAmount },
        )
        .catch(() => {});

      return saved;
    });
  }

  async getReturnPolicy(brandId: number): Promise<ReturnPolicy> {
    const policy = await this.returnPolicyRepository.findOne({
      where: { brandId },
    });
    if (!policy) {
      // Return default policy
      return this.returnPolicyRepository.create({
        brandId,
        returnWindowDays: 30,
        restockingFeePercent: 0,
        requiresImages: false,
        isActive: true,
      });
    }
    return policy;
  }

  async upsertReturnPolicy(
    brandId: number,
    dto: UpsertReturnPolicyDto,
  ): Promise<ReturnPolicy> {
    let policy = await this.returnPolicyRepository.findOne({ where: { brandId } });
    if (!policy) {
      policy = this.returnPolicyRepository.create({ brandId });
    }
    Object.assign(policy, dto);
    return this.returnPolicyRepository.save(policy);
  }

  async getPendingReturnsCount(brandId: number): Promise<number> {
    return this.returnRequestRepository.count({
      where: { brandId, status: ReturnStatus.REQUESTED },
    });
  }
}
