import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) { }

  async findAll(dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    const { page = 1, limit = 10, search } = dto;

    const queryBuilder = this.brandsRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.owner', 'owner')
      .leftJoinAndSelect('brand.products', 'products')
      .select([
        'brand.id',
        'brand.name',
        'brand.description',
        'brand.logo',
        'brand.location',
        'brand.createdAt',
        'brand.updatedAt',
        'owner.id',
        'owner.name',
        'owner.email',
        'products.id',
      ]);

    if (search) {
      queryBuilder.where('brand.name ILIKE :search', { search: `%${search}%` });
    }

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
      relations: ['owner'],
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
    return brand;
  }

  // Find brands owned by a specific user
  async findByOwner(ownerId: number): Promise<Brand[]> {
    return this.brandsRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
  }

  async create(brandData: Partial<Brand>): Promise<Brand> {
    const brand = this.brandsRepository.create(brandData);
    return this.brandsRepository.save(brand);
  }

  async update(id: number, updateData: Partial<Brand>): Promise<Brand> {
    const result = await this.brandsRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.brandsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
  }
}
