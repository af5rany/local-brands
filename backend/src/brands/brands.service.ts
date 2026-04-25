import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Brand } from './brand.entity';
import { BrandUser } from './brand-user.entity';
import { BrandFollow } from './brand-follow.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { BrandUserRole } from 'src/common/enums/brand-user-role.enum';
import { BrandStatus } from 'src/common/enums/brand.enum';
import { UserRole } from 'src/common/enums/user.enum';
import { OrderStatus } from 'src/common/enums/order.enum';
import { ProductStatus } from 'src/common/enums/product.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(BrandUser)
    private brandUsersRepository: Repository<BrandUser>,
    @InjectRepository(BrandFollow)
    private brandFollowRepository: Repository<BrandFollow>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private pushService: PushNotificationService,
    private dataSource: DataSource,
  ) {}

  async findAll(
    dto: GetBrandsDto,
    isAdmin: boolean = false,
  ): Promise<PaginatedResult<Brand>> {
    const { page = 1, limit = 10, search, status, isSponsored, isNew, isFeatured, sortBy = 'createdAt', sortOrder = 'DESC' } = dto;

    const queryBuilder = this.brandsRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.brandUsers', 'brandUsers')
      .leftJoinAndSelect('brandUsers.user', 'user')
      .leftJoinAndSelect('brand.products', 'products')
      .select([
        'brand.id',
        'brand.name',
        'brand.description',
        'brand.logo',
        'brand.location',
        'brand.status',
        'brand.isSponsored',
        'brand.isNew',
        'brand.isFeatured',
        'brand.createdAt',
        'brand.updatedAt',
        'brandUsers.id',
        'brandUsers.role',
        'user.id',
        'user.name',
        'user.email',
        'products.id',
      ]);

    if (search) {
      queryBuilder.where('brand.name ILIKE :search', { search: `%${search}%` });
    }

    if (status) {
      if (search) {
        queryBuilder.andWhere('brand.status = :status', { status });
      } else {
        queryBuilder.where('brand.status = :status', { status });
      }
    } else if (!isAdmin) {
      // Default to ACTIVE for public browsing
      const condition = search
        ? queryBuilder.andWhere.bind(queryBuilder)
        : queryBuilder.where.bind(queryBuilder);
      condition('brand.status = :defaultStatus', {
        defaultStatus: BrandStatus.ACTIVE,
      });
    }

    if (isSponsored !== undefined) {
      queryBuilder.andWhere('brand.isSponsored = :isSponsored', { isSponsored });
    }

    if (isNew !== undefined) {
      queryBuilder.andWhere('brand.isNew = :isNew', { isNew });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('brand.isFeatured = :isFeatured', { isFeatured });
    }

    // Apply sorting
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    if (sortBy === 'productCount') {
      // For product count sorting, get sorted brand IDs via a raw query,
      // then load entities in that order to avoid DISTINCT + ORDER BY conflict.
      const filterQueryBuilder = this.brandsRepository
        .createQueryBuilder('b')
        .select('b.id', 'id')
        .addSelect('COUNT(p.id)', 'cnt')
        .leftJoin('b.products', 'p')
        .groupBy('b.id')
        .orderBy('cnt', order);

      // Apply same filters to the ID query
      if (search) {
        filterQueryBuilder.where('b.name ILIKE :search', { search: `%${search}%` });
      }
      if (status) {
        filterQueryBuilder.andWhere('b.status = :status', { status });
      } else if (!isAdmin) {
        filterQueryBuilder.andWhere('b.status = :defaultStatus', { defaultStatus: BrandStatus.ACTIVE });
      }
      if (isSponsored !== undefined) {
        filterQueryBuilder.andWhere('b.isSponsored = :isSponsored', { isSponsored });
      }
      if (isNew !== undefined) {
        filterQueryBuilder.andWhere('b.isNew = :isNew', { isNew });
      }
      if (isFeatured !== undefined) {
        filterQueryBuilder.andWhere('b.isFeatured = :isFeatured', { isFeatured });
      }

      const allSorted = await filterQueryBuilder.getRawMany();
      const total = allSorted.length;
      const pagedIds = allSorted.slice((page - 1) * limit, page * limit).map((r) => r.id);

      let items: Brand[] = [];
      if (pagedIds.length > 0) {
        items = await queryBuilder
          .andWhereInIds(pagedIds)
          .getMany();
        // Preserve the sorted order
        const idOrder = new Map(pagedIds.map((id, i) => [id, i]));
        items.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
      }

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: total > page * limit,
        hasPreviousPage: page > 1,
      };
    }

    // Standard column sorting
    const allowedColumns = ['name', 'createdAt', 'updatedAt', 'location'];
    const column = allowedColumns.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`brand.${column}`, order);

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: total > page * limit,
      hasPreviousPage: page > 1,
    };
  }

  // async findAllWithProductCount(
  //   dto: GetBrandsDto,
  // ): Promise<PaginatedResult<Brand & { productCount: number }>> {
  //   const { page = 1, limit = 10, search } = dto;

  //   const queryBuilder = this.brandsRepository
  //     .createQueryBuilder('brand')
  //     .leftJoinAndSelect('brand.owner', 'owner')
  //     .leftJoinAndSelect('brand.products', 'products')
  //     .select([
  //       'brand.id',
  //       'brand.name',
  //       'brand.description',
  //       'brand.logo',
  //       'brand.location',
  //       'brand.createdAt',
  //       'brand.updatedAt',
  //       'owner.id',
  //       'owner.name',
  //       'owner.email',
  //     ])
  //     .addSelect('COUNT(products.id)', 'productCount')
  //     .groupBy('brand.id')
  //     .addGroupBy('owner.id');

  //   if (search) {
  //     queryBuilder.where('brand.name ILIKE :search', { search: `%${search}%` });
  //   }

  //   const [items, total] = await queryBuilder
  //     .skip((page - 1) * limit)
  //     .take(limit)
  //     .getRawAndEntities();

  //   const brandsWithCount = items.map(
  //     (brand, index) =>
  //       ({
  //         ...brand,
  //         productCount: items[index].productCount || 0,
  //       }) as Brand & { productCount: number },
  //   );

  //   return {
  //     items: brandsWithCount,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //     hasNextPage: total > page * limit,
  //     hasPreviousPage: page > 1,
  //   };
  // }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id },
      relations: ['brandUsers', 'brandUsers.user'],
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        brandUsers: {
          id: true,
          role: true,
          user: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
    return brand;
  }

  // Find brands owned by a specific user with product count
  async findByOwner(userId: number): Promise<any[]> {
    const queryBuilder = this.brandsRepository
      .createQueryBuilder('brand')
      .innerJoin('brand.brandUsers', 'brandUser')
      .leftJoin('brand.products', 'product')
      .where('brandUser.userId = :userId', { userId })
      .select([
        'brand.id',
        'brand.name',
        'brand.description',
        'brand.logo',
        'brand.location',
        'brand.createdAt',
        'brand.updatedAt',
      ])
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('brand.id');

    const result = await queryBuilder.getRawAndEntities();

    return result.entities.map((brand, index) => {
      // Find the raw result for this brand to get the productCount
      const raw = result.raw.find((r) => r.brand_id === brand.id);
      return {
        ...brand,
        productCount: raw ? parseInt(raw.productCount, 10) : 0,
      };
    });
  }

  async checkMembership(brandId: number, userId: number): Promise<boolean> {
    const count = await this.brandUsersRepository.count({
      where: { brandId, userId },
    });
    return count > 0;
  }

  async getMembership(
    brandId: number,
    userId: number,
  ): Promise<BrandUser | null> {
    return this.brandUsersRepository.findOne({
      where: { brandId, userId },
    });
  }

  async assignUserToBrand(
    brandId: number,
    userId: number,
    role: BrandUserRole = BrandUserRole.STAFF,
  ): Promise<BrandUser> {
    // Check if already assigned
    let brandUser = await this.brandUsersRepository.findOne({
      where: { brandId, userId },
    });

    if (brandUser) {
      brandUser.role = role;
    } else {
      brandUser = this.brandUsersRepository.create({
        brandId,
        userId,
        role,
      });
    }

    return this.brandUsersRepository.save(brandUser);
  }

  async removeUserFromBrand(brandId: number, userId: number): Promise<void> {
    // Constraint: A brand must have at least one owner
    const brandUser = await this.brandUsersRepository.findOne({
      where: { brandId, userId },
    });

    if (brandUser?.role === BrandUserRole.OWNER) {
      const ownerCount = await this.brandUsersRepository.count({
        where: { brandId, role: BrandUserRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('A brand must have at least one owner');
      }
    }

    await this.brandUsersRepository.delete({ brandId, userId });
  }

  async create(brandData: Partial<Brand>): Promise<Brand> {
    const brand = this.brandsRepository.create(brandData);
    return this.brandsRepository.save(brand);
  }

  async createWithOwner(
    brandData: Partial<Brand>,
    ownerId: number,
  ): Promise<Brand> {
    const brand = this.brandsRepository.create(brandData);
    const savedBrand = await this.brandsRepository.save(brand);

    // Automatically assign the owner as OWNER role
    await this.assignUserToBrand(
      savedBrand.id,
      ownerId,
      BrandUserRole.OWNER,
    );

    // Auto-promote user to brandOwner if they are a customer
    const user = await this.usersRepository.findOne({ where: { id: ownerId } });
    if (user && user.role === UserRole.CUSTOMER) {
      user.role = UserRole.BRAND_OWNER;
      await this.usersRepository.save(user);
    }

    return this.findOne(savedBrand.id);
  }

  async update(id: number, updateData: Partial<Brand>): Promise<Brand> {
    if (
      !updateData ||
      !Object.values(updateData).some((v) => v !== undefined)
    ) {
      return this.findOne(id);
    }

    // Check current status before update for notification trigger
    const currentBrand = await this.brandsRepository.findOne({
      where: { id },
      select: ['id', 'name', 'status'],
    });

    const result = await this.brandsRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    const updatedBrand = await this.findOne(id);

    // Notify all customers when a new brand goes ACTIVE
    if (
      currentBrand &&
      currentBrand.status !== BrandStatus.ACTIVE &&
      updateData.status === BrandStatus.ACTIVE
    ) {
      this.notifyAllCustomers(
        NotificationType.NEW_BRAND,
        'New Brand',
        `${updatedBrand.name} just joined the platform. Check out their collection!`,
        { brandId: id },
      ).catch(() => {});
    }

    return updatedBrand;
  }

  private async notifyAllCustomers(
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const userRepo = this.dataSource.getRepository(User);
    const customers = await userRepo.find({
      where: { role: UserRole.CUSTOMER },
      select: ['id'],
    });
    const userIds = customers.map((u) => u.id);
    if (userIds.length > 0) {
      await this.notificationsService.createBulk(
        userIds,
        type,
        title,
        message,
        data,
      );
    }
  }

  async batchCreate(brandsData: Partial<Brand>[]): Promise<Brand[]> {
    const brands = this.brandsRepository.create(brandsData);
    return this.brandsRepository.save(brands);
  }

  async remove(id: number): Promise<void> {
    const result = await this.brandsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
  }

  // ── Brand Follow ──

  async followBrand(
    userId: number,
    brandId: number,
  ): Promise<{ followed: boolean }> {
    const brand = await this.brandsRepository.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException('Brand not found');

    const existing = await this.brandFollowRepository.findOne({
      where: { userId, brandId },
    });
    if (existing) return { followed: true };

    const follow = this.brandFollowRepository.create({ userId, brandId });
    await this.brandFollowRepository.save(follow);
    return { followed: true };
  }

  async unfollowBrand(
    userId: number,
    brandId: number,
  ): Promise<{ followed: boolean }> {
    await this.brandFollowRepository.delete({ userId, brandId });
    return { followed: false };
  }

  async isFollowing(
    userId: number,
    brandId: number,
  ): Promise<{ following: boolean }> {
    const count = await this.brandFollowRepository.count({
      where: { userId, brandId },
    });
    return { following: count > 0 };
  }

  async getFollowedBrands(userId: number): Promise<any[]> {
    const follows = await this.brandFollowRepository.find({
      where: { userId },
      relations: ['brand', 'brand.products'],
      order: { createdAt: 'DESC' },
    });

    return follows
      .filter((f) => f.brand && !f.brand.deletedAt)
      .map((f) => ({
        id: f.brand.id,
        name: f.brand.name,
        logo: f.brand.logo,
        description: f.brand.description,
        location: f.brand.location,
        productCount: f.brand.products?.length || 0,
        followedAt: f.createdAt,
      }));
  }

  async getFollowerCount(brandId: number): Promise<number> {
    return this.brandFollowRepository.count({ where: { brandId } });
  }

  async getFollowerIds(brandId: number): Promise<number[]> {
    const follows = await this.brandFollowRepository.find({
      where: { brandId },
      select: ['userId'],
    });
    return follows.map((f) => f.userId);
  }

  async notifyFollowers(
    brandId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const followerIds = await this.getFollowerIds(brandId);
    const promises = followerIds.map((userId) =>
      this.notificationsService.create(userId, type, title, message, data),
    );
    await Promise.allSettled(promises);
  }

  // ── Brand Analytics (Dashboard) ──

  async getBrandAnalytics(brandId: number): Promise<any> {
    const productRepo = this.dataSource.getRepository(Product);
    const orderItemRepo = this.dataSource.getRepository(OrderItem);

    // Products stats
    const totalProducts = await productRepo.count({
      where: { brandId, status: ProductStatus.PUBLISHED },
    });

    // Top products by sales
    const topProducts = await productRepo.find({
      where: { brandId, status: ProductStatus.PUBLISHED },
      order: { salesCount: 'DESC' },
      take: 5,
      select: ['id', 'name', 'price', 'salePrice', 'salesCount', 'viewCount', 'averageRating', 'images'],
    });

    // Revenue and order count
    const revenueData = await orderItemRepo
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .where('product.brandId = :brandId', { brandId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .select('SUM(orderItem.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT orderItem.orderId)', 'totalOrders')
      .addSelect('SUM(orderItem.quantity)', 'totalUnitsSold')
      .getRawOne();

    // Pending orders count
    const pendingOrders = await orderItemRepo
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .where('product.brandId = :brandId', { brandId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
      })
      .select('COUNT(DISTINCT orderItem.orderId)', 'count')
      .getRawOne();

    // Follower count
    const followerCount = await this.getFollowerCount(brandId);

    // Total views across all products
    const viewsData = await productRepo
      .createQueryBuilder('product')
      .where('product.brandId = :brandId', { brandId })
      .select('SUM(product.viewCount)', 'totalViews')
      .getRawOne();

    // Recent orders (last 10)
    const recentOrders = await orderItemRepo
      .createQueryBuilder('orderItem')
      .leftJoinAndSelect('orderItem.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('orderItem.product', 'product')
      .where('product.brandId = :brandId', { brandId })
      .orderBy('order.createdAt', 'DESC')
      .take(10)
      .getMany();

    const formattedRecentOrders = recentOrders.map((oi) => ({
      orderId: oi.order?.id,
      orderStatus: oi.order?.status,
      customerName: oi.order?.user?.name || 'Unknown',
      productName: oi.product?.name,
      quantity: oi.quantity,
      totalPrice: Number(oi.totalPrice),
      createdAt: oi.order?.createdAt,
    }));

    // Active promo codes count
    const activePromoResult = await this.dataSource.query(
      `SELECT COUNT(*) AS count FROM promo_code
       WHERE "brandId" = $1
         AND is_active = true
         AND deleted_at IS NULL
         AND (expiry_date IS NULL OR expiry_date > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)`,
      [brandId],
    );

    // Pending returns count
    const pendingReturnsResult = await this.dataSource.query(
      `SELECT COUNT(*) AS count FROM return_request
       WHERE "brandId" = $1 AND status = 'requested'`,
      [brandId],
    );

    // Total discount given via promo codes
    const discountResult = await this.dataSource.query(
      `SELECT COALESCE(SUM(pcu.discount_applied), 0) AS total
       FROM promo_code_usage pcu
       INNER JOIN promo_code pc ON pc.id = pcu."promoCodeId"
       WHERE pc."brandId" = $1`,
      [brandId],
    );

    return {
      totalProducts,
      totalRevenue: parseFloat(revenueData?.totalRevenue || '0'),
      totalOrders: parseInt(revenueData?.totalOrders || '0', 10),
      totalUnitsSold: parseInt(revenueData?.totalUnitsSold || '0', 10),
      pendingOrders: parseInt(pendingOrders?.count || '0', 10),
      followerCount,
      totalViews: parseInt(viewsData?.totalViews || '0', 10),
      activePromoCodes: parseInt(activePromoResult?.[0]?.count || '0', 10),
      pendingReturns: parseInt(pendingReturnsResult?.[0]?.count || '0', 10),
      totalDiscountGiven: parseFloat(discountResult?.[0]?.total || '0'),
      topProducts: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        salesCount: p.salesCount,
        viewCount: p.viewCount,
        averageRating: Number(p.averageRating),
        image: p.images?.[0] || '',
      })),
      recentOrders: formattedRecentOrders,
    };
  }

  async sendNotificationToFollowers(
    brandId: number,
    title: string,
    message: string,
  ): Promise<{ sent: number }> {
    const followerIds = await this.getFollowerIds(brandId);
    if (followerIds.length === 0) return { sent: 0 };

    // In-app notifications
    const inAppPromises = followerIds.map((userId) =>
      this.notificationsService.create(
        userId,
        NotificationType.GENERAL,
        title,
        message,
        { brandId },
      ),
    );
    await Promise.allSettled(inAppPromises);

    // Push notifications
    await this.pushService.sendPushToMany(followerIds, title, message, { brandId });

    return { sent: followerIds.length };
  }
}
