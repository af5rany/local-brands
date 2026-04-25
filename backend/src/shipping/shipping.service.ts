import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingRate } from './shipping-rate.entity';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingZone)
    private zoneRepository: Repository<ShippingZone>,
    @InjectRepository(ShippingRate)
    private rateRepository: Repository<ShippingRate>,
  ) {}

  // ── Zones ────────────────────────────────────────────────────────────────────

  async createZone(brandId: number, dto: CreateShippingZoneDto): Promise<ShippingZone> {
    const zone = this.zoneRepository.create({
      ...dto,
      brandId,
      isActive: dto.isActive ?? true,
    });
    return this.zoneRepository.save(zone);
  }

  async getZonesByBrand(brandId: number): Promise<ShippingZone[]> {
    return this.zoneRepository.find({
      where: { brandId },
      relations: ['rates'],
      order: { createdAt: 'ASC' },
    });
  }

  async findZone(id: number): Promise<ShippingZone> {
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['rates'],
    });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async updateZone(
    id: number,
    dto: Partial<CreateShippingZoneDto>,
  ): Promise<ShippingZone> {
    const zone = await this.findZone(id);
    Object.assign(zone, dto);
    return this.zoneRepository.save(zone);
  }

  async deleteZone(id: number): Promise<void> {
    await this.findZone(id);
    await this.zoneRepository.delete(id);
  }

  // ── Rates ─────────────────────────────────────────────────────────────────────

  async createRate(zoneId: number, dto: CreateShippingRateDto): Promise<ShippingRate> {
    await this.findZone(zoneId);
    const rate = this.rateRepository.create({
      ...dto,
      zoneId,
      isActive: dto.isActive ?? true,
    });
    return this.rateRepository.save(rate);
  }

  async getRatesByZone(zoneId: number): Promise<ShippingRate[]> {
    return this.rateRepository.find({
      where: { zoneId, isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findRate(id: number): Promise<ShippingRate> {
    const rate = await this.rateRepository.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return rate;
  }

  async updateRate(
    id: number,
    dto: Partial<CreateShippingRateDto>,
  ): Promise<ShippingRate> {
    const rate = await this.findRate(id);
    Object.assign(rate, dto);
    return this.rateRepository.save(rate);
  }

  async deleteRate(id: number): Promise<void> {
    await this.findRate(id);
    await this.rateRepository.delete(id);
  }

  // ── Calculate ────────────────────────────────────────────────────────────────

  async calculateShipping(
    brandId: number,
    countryCode: string,
    totalWeight?: number,
  ): Promise<{ zone: ShippingZone | null; rates: ShippingRate[] }> {
    const zones = await this.zoneRepository.find({
      where: { brandId, isActive: true },
      relations: ['rates'],
    });

    // Find first zone that includes this country
    const matchingZone = zones.find((z) =>
      z.countries
        .map((c) => c.toUpperCase())
        .includes(countryCode.toUpperCase()),
    );

    if (!matchingZone) {
      return { zone: null, rates: [] };
    }

    // Filter rates by weight if provided
    let rates = matchingZone.rates.filter((r) => r.isActive);
    if (totalWeight !== undefined) {
      rates = rates.filter((r) => {
        const minOk = Number(r.minWeight) <= totalWeight;
        const maxOk = r.maxWeight === null || Number(r.maxWeight) >= totalWeight;
        return minOk && maxOk;
      });
    }

    rates.sort((a, b) => Number(a.price) - Number(b.price));

    return { zone: matchingZone, rates };
  }
}
