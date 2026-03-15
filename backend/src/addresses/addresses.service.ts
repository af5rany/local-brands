import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(userId: number, dto: CreateAddressDto): Promise<Address> {
    // If this address is set as default, unset any existing defaults
    if (dto.isDefault) {
      await this.clearDefaults(userId);
    }

    const address = this.addressRepository.create({
      ...dto,
      user: { id: userId },
    });

    return this.addressRepository.save(address);
  }

  async findAllByUser(userId: number): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException(`Address #${id} not found`);
    }

    return address;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    if (dto.isDefault) {
      await this.clearDefaults(userId);
    }

    Object.assign(address, dto);
    return this.addressRepository.save(address);
  }

  async remove(id: number, userId: number): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepository.remove(address);
  }

  async setDefault(id: number, userId: number): Promise<Address> {
    await this.clearDefaults(userId);
    const address = await this.findOne(id, userId);
    address.isDefault = true;
    return this.addressRepository.save(address);
  }

  private async clearDefaults(userId: number): Promise<void> {
    await this.addressRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );
  }
}
