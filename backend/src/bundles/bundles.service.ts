import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bundle } from './bundle.entity';
import { CreateBundleDto } from './dto/create-bundle.dto';

@Injectable()
export class BundlesService {
  constructor(
    @InjectRepository(Bundle)
    private repo: Repository<Bundle>,
  ) {}

  async create(brandId: number, dto: CreateBundleDto): Promise<Bundle> {
    const bundle = this.repo.create({ brandId, ...dto });
    return this.repo.save(bundle);
  }

  async findAllByBrand(brandId: number): Promise<Bundle[]> {
    return this.repo.find({ where: { brandId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Bundle> {
    const bundle = await this.repo.findOne({ where: { id } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return bundle;
  }

  async update(id: number, dto: Partial<CreateBundleDto>): Promise<Bundle> {
    const bundle = await this.findOne(id);
    Object.assign(bundle, dto);
    return this.repo.save(bundle);
  }

  async remove(id: number): Promise<void> {
    const bundle = await this.findOne(id);
    await this.repo.remove(bundle);
  }

  async toggleActive(id: number): Promise<Bundle> {
    const bundle = await this.findOne(id);
    bundle.isActive = !bundle.isActive;
    return this.repo.save(bundle);
  }

  /**
   * Check if any active bundle applies to the given product IDs.
   * Returns the best discount found (highest discount value).
   */
  async checkBundleDiscount(
    cartProductIds: number[],
    brandId: number,
  ): Promise<{ bundleId: number; name: string; discountType: string; discountValue: number } | null> {
    const now = new Date();
    const bundles = await this.repo.find({
      where: { brandId, isActive: true },
    });

    let bestBundle: Bundle | null = null;
    for (const bundle of bundles) {
      // Check dates
      if (bundle.startDate && new Date(bundle.startDate) > now) continue;
      if (bundle.endDate && new Date(bundle.endDate) < now) continue;

      // Check if all bundle products are in cart
      const bundleProductIds = bundle.productIds.map(Number);
      const matchCount = bundleProductIds.filter((id) => cartProductIds.includes(id)).length;
      if (matchCount < bundle.minQuantity) continue;

      if (!bestBundle || Number(bundle.discountValue) > Number(bestBundle.discountValue)) {
        bestBundle = bundle;
      }
    }

    if (!bestBundle) return null;
    return {
      bundleId: bestBundle.id,
      name: bestBundle.name,
      discountType: bestBundle.discountType,
      discountValue: Number(bestBundle.discountValue),
    };
  }
}
