import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PromoCode } from './promo-code.entity';
import { PromoCodeUsage } from './promo-code-usage.entity';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoCodeType } from '../common/enums/promo-code.enum';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode)
    private promoCodeRepository: Repository<PromoCode>,
    @InjectRepository(PromoCodeUsage)
    private usageRepository: Repository<PromoCodeUsage>,
    private dataSource: DataSource,
  ) {}

  async create(brandId: number, dto: CreatePromoCodeDto): Promise<PromoCode> {
    const existing = await this.promoCodeRepository.findOne({
      where: { code: dto.code.toUpperCase() },
      withDeleted: true,
    });
    if (existing) {
      throw new BadRequestException(`Promo code "${dto.code}" already exists`);
    }

    const promoCode = this.promoCodeRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
      brandId,
      startDate: new Date(dto.startDate),
      expiryDate: new Date(dto.expiryDate),
      isActive: dto.isActive ?? true,
    });

    return this.promoCodeRepository.save(promoCode);
  }

  async findAllByBrand(
    brandId: number,
    query: { page?: number; limit?: number; isActive?: boolean },
  ) {
    const { page = 1, limit = 20, isActive } = query;
    const qb = this.promoCodeRepository
      .createQueryBuilder('pc')
      .where('pc.brandId = :brandId', { brandId });

    if (isActive !== undefined) {
      qb.andWhere('pc.isActive = :isActive', { isActive });
    }

    const [items, total] = await qb
      .orderBy('pc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<PromoCode> {
    const pc = await this.promoCodeRepository.findOne({ where: { id } });
    if (!pc) throw new NotFoundException('Promo code not found');
    return pc;
  }

  async update(id: number, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const pc = await this.findOne(id);
    if (dto.code) dto.code = dto.code.toUpperCase();
    Object.assign(pc, dto);
    return this.promoCodeRepository.save(pc);
  }

  async toggleActive(id: number): Promise<PromoCode> {
    const pc = await this.findOne(id);
    pc.isActive = !pc.isActive;
    return this.promoCodeRepository.save(pc);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.promoCodeRepository.softDelete(id);
  }

  async validate(
    code: string,
    cartTotal: number,
    userId: number,
    brandId?: number,
  ): Promise<{ discountAmount: number; promoCode: PromoCode }> {
    const now = new Date();
    const pc = await this.promoCodeRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
    });

    if (!pc) throw new BadRequestException('Invalid promo code');
    if (now < pc.startDate) throw new BadRequestException('Promo code not yet active');
    if (now > pc.expiryDate) throw new BadRequestException('Promo code has expired');

    // Brand-scoped: only valid for specified brand
    if (pc.brandId && brandId && pc.brandId !== brandId) {
      throw new BadRequestException('Promo code not valid for this brand');
    }

    // Min order amount check
    if (pc.minOrderAmount && cartTotal < Number(pc.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of $${pc.minOrderAmount} required`,
      );
    }

    // Global usage limit
    if (pc.maxUses !== null && pc.maxUses !== undefined && pc.usesCount >= pc.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    // Per-user usage limit
    const userUsageCount = await this.usageRepository.count({
      where: { promoCodeId: pc.id, userId },
    });
    if (userUsageCount >= pc.maxUsesPerUser) {
      throw new BadRequestException('You have already used this promo code');
    }

    let discountAmount: number;
    if (pc.type === PromoCodeType.PERCENTAGE) {
      discountAmount = (cartTotal * Number(pc.value)) / 100;
      if (pc.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(pc.maxDiscountAmount));
      }
    } else {
      discountAmount = Math.min(Number(pc.value), cartTotal);
    }

    return { discountAmount: Math.round(discountAmount * 100) / 100, promoCode: pc };
  }

  async applyPromo(
    code: string,
    userId: number,
    orderId: number,
    discountApplied: number,
  ): Promise<void> {
    const pc = await this.promoCodeRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!pc) return;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(PromoCodeUsage, {
        promoCodeId: pc.id,
        userId,
        orderId,
        discountApplied,
      });
      await manager.increment(PromoCode, { id: pc.id }, 'usesCount', 1);
    });
  }

  async getUsageStats(promoCodeId: number) {
    const pc = await this.findOne(promoCodeId);
    const usages = await this.usageRepository.find({
      where: { promoCodeId },
      order: { createdAt: 'DESC' },
    });

    const totalDiscountGiven = usages.reduce(
      (sum, u) => sum + Number(u.discountApplied),
      0,
    );

    return {
      promoCode: pc,
      totalUses: usages.length,
      totalDiscountGiven,
      usages,
    };
  }
}
