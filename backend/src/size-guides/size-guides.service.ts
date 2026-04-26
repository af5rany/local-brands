import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SizeGuide } from './size-guide.entity';
import { CreateSizeGuideDto } from './dto/create-size-guide.dto';
import { UpdateSizeGuideDto } from './dto/update-size-guide.dto';

@Injectable()
export class SizeGuidesService {
  constructor(
    @InjectRepository(SizeGuide)
    private repo: Repository<SizeGuide>,
  ) {}

  async findByProduct(productId: number): Promise<SizeGuide | null> {
    // Product-level guide takes precedence over brand-level
    const productGuide = await this.repo.findOne({ where: { productId } });
    if (productGuide) return productGuide;
    return null;
  }

  async findByBrand(brandId: number): Promise<SizeGuide[]> {
    return this.repo.find({ where: { brandId } });
  }

  async findForProduct(productId: number, brandId: number): Promise<SizeGuide | null> {
    const productGuide = await this.repo.findOne({ where: { productId } });
    if (productGuide) return productGuide;
    const brandGuide = await this.repo.findOne({ where: { brandId, productId: IsNull() } });
    return brandGuide;
  }

  async create(dto: CreateSizeGuideDto): Promise<SizeGuide> {
    const guide = this.repo.create(dto);
    return this.repo.save(guide);
  }

  async update(id: number, dto: UpdateSizeGuideDto): Promise<SizeGuide> {
    const guide = await this.repo.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Size guide not found');
    Object.assign(guide, dto);
    return this.repo.save(guide);
  }

  async remove(id: number): Promise<void> {
    const guide = await this.repo.findOne({ where: { id } });
    if (!guide) throw new NotFoundException('Size guide not found');
    await this.repo.remove(guide);
  }
}
