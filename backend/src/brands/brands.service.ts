import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Brand } from './brand.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

  async findAll(dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;

    const qb = this.brandsRepository.createQueryBuilder('brand');

    // Add relations
    qb.leftJoinAndSelect('brand.owner', 'owner');

    // Search functionality
    if (search) {
      const searchTerm = `%${search}%`.toLowerCase();
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .where('LOWER(brand.name) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(brand.description) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('LOWER(brand.location) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(owner.name) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(owner.email) LIKE :searchTerm', { searchTerm });
        }),
      );
    }

    // Filters
    if (location) {
      qb.andWhere('LOWER(brand.location) LIKE :location', {
        location: `%${location.toLowerCase()}%`,
      });
    }

    if (ownerId) {
      qb.andWhere('brand.ownerId = :ownerId', { ownerId });
    }

    // Sorting
    const validSortFields = ['name', 'createdAt', 'updatedAt', 'location'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`brand.${sortField}`, sortOrder);

    // Pagination
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id },
      relations: ['products', 'owner'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }

    return brand;
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

  // Additional method to get brands with product count
  async findAllWithProductCount(
    dto: GetBrandsDto,
  ): Promise<PaginatedResult<Brand & { productCount: number }>> {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;

    const qb = this.brandsRepository.createQueryBuilder('brand');

    // Add relations and product count
    qb.leftJoinAndSelect('brand.owner', 'owner')
      .leftJoin('brand.products', 'product')
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('brand.id')
      .addGroupBy('owner.id');

    // Search functionality
    if (search) {
      const searchTerm = `%${search}%`.toLowerCase();
      qb.andWhere(
        new Brackets((qb1) => {
          qb1
            .where('LOWER(brand.name) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(brand.description) LIKE :searchTerm', {
              searchTerm,
            })
            .orWhere('LOWER(brand.location) LIKE :searchTerm', { searchTerm })
            .orWhere('LOWER(owner.name) LIKE :searchTerm', { searchTerm });
        }),
      );
    }

    // Filters
    if (location) {
      qb.andWhere('LOWER(brand.location) LIKE :location', {
        location: `%${location.toLowerCase()}%`,
      });
    }

    if (ownerId) {
      qb.andWhere('brand.ownerId = :ownerId', { ownerId });
    }

    // Sorting
    if (sortBy === 'productCount') {
      qb.orderBy('productCount', sortOrder);
    } else {
      const validSortFields = ['name', 'createdAt', 'updatedAt', 'location'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      qb.orderBy(`brand.${sortField}`, sortOrder);
    }

    // Get total count first
    const totalQuery = qb.clone();
    const totalResult = await totalQuery.getCount();

    // Apply pagination
    const results = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    // Merge raw results with entities to include product count
    const itemsWithCount = results.entities.map((entity, index) => ({
      ...entity,
      productCount: parseInt(String(results.raw[index].productCount)) || 0,
    }));

    const totalPages = Math.ceil(totalResult / limit);

    return {
      items: itemsWithCount,
      total: totalResult,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
