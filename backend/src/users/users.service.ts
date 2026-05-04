import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(excludeGuests?: boolean): Promise<User[]> {
    return this.usersRepository.find({
      where: excludeGuests ? { isGuest: false } : undefined,
      relations: ['brandUsers', 'brandUsers.brand'],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        isGuest: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        brandUsers: {
          id: true,
          role: true,
          brandId: true,
          brand: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['brandUsers', 'brandUsers.brand'],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        isGuest: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        brandUsers: {
          id: true,
          role: true,
          brandId: true,
          brand: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  // findByEmailVerificationToken(token: string): Promise<User | null> {
  //   return this.usersRepository.findOne({
  //     where: { emailVerificationToken: token },
  //   });
  // }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    if (
      !updateData ||
      !Object.values(updateData).some((v) => v !== undefined)
    ) {
      return this.findOne(id);
    }
    const result = await this.usersRepository.update(id, updateData);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async removeStaleGuests(olderThanHours = 24): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const stale = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.isGuest = :isGuest', { isGuest: true })
      .andWhere('user.updatedAt < :cutoff', { cutoff })
      .andWhere('user.deletedAt IS NULL')
      .andWhere(
        `user.id NOT IN (SELECT o."userId" FROM "order" o WHERE o."userId" IS NOT NULL)`,
      )
      .getMany();

    if (stale.length === 0) return 0;
    await this.usersRepository.softDelete(stale.map((u) => u.id));
    return stale.length;
  }

  async updateNotificationPreferences(
    userId: number,
    prefs: Record<string, boolean>,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      notificationPreferences: prefs,
    } as any);
  }
}
