import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { BrandUser } from './brand-user.entity';
import { GetBrandsDto } from './dto/get-brands.dto';
import { PaginatedResult } from 'src/common/types/pagination.type';
import { BrandUserRole } from 'src/common/enums/brand-user-role.enum';
import { BrandStatus } from 'src/common/enums/brand.enum';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(BrandUser)
    private brandUsersRepository: Repository<BrandUser>,
  ) { }

  async findAll(dto: GetBrandsDto): Promise<PaginatedResult<Brand>> {
    const { page = 1, limit = 10, search, status } = dto;

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
      queryBuilder.andWhere('brand.status = :status', { status });
    } else {
      // Default to ACTIVE for public browsing
      queryBuilder.andWhere('brand.status = :defaultStatus', {
        defaultStatus: BrandStatus.ACTIVE,
      });
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
      relations: ['brandUsers', 'brandUsers.user'],
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        location: true,
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

  async getMembership(brandId: number, userId: number): Promise<BrandUser | null> {
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

  async update(id: number, updateData: Partial<Brand>): Promise<Brand> {
    const result = await this.brandsRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.brandsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Brand with id ${id} not found`);
    }
  }
}
