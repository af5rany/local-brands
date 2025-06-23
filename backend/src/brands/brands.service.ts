import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

  findAll(): Promise<Brand[]> {
    return this.brandsRepository.find();
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!brand) {
      throw new Error(`Brand with id ${id} not found`);
    }
    return brand;
  }

  async create(brandData: Partial<Brand>): Promise<Brand> {
    const brand = this.brandsRepository.create(brandData);
    return this.brandsRepository.save(brand);
  }

  async update(id: number, updateData: Partial<Brand>): Promise<Brand> {
    await this.brandsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.brandsRepository.delete(id);
  }
}
