// src/wishlist/wishlist.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    const { userId, productId, notes } = createWishlistDto;

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if wishlist item already exists
    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existingWishlistItem) {
      throw new ConflictException("Product is already in user's wishlist");
    }

    const wishlistItem = this.wishlistRepository.create({
      user,
      product,
      notes,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async findAll(): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      relations: ['user', 'product'],
    });
  }

  async findOne(id: number): Promise<Wishlist> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return wishlistItem;
  }

  async findByUser(userId: number): Promise<Wishlist[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: number): Promise<Wishlist[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.wishlistRepository.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<Wishlist> {
    const wishlistItem = await this.findOne(id);

    if (updateWishlistDto.notes !== undefined) {
      wishlistItem.notes = updateWishlistDto.notes;
    }

    return this.wishlistRepository.save(wishlistItem);
  }

  async remove(id: number): Promise<void> {
    const wishlistItem = await this.findOne(id);
    await this.wishlistRepository.remove(wishlistItem);
  }

  async removeByUserAndProduct(
    userId: number,
    productId: number,
  ): Promise<void> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!wishlistItem) {
      throw new NotFoundException(
        `Wishlist item not found for user ${userId} and product ${productId}`,
      );
    }

    await this.wishlistRepository.remove(wishlistItem);
  }

  async isProductInUserWishlist(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    return !!wishlistItem;
  }

  async getWishlistCount(userId: number): Promise<number> {
    return this.wishlistRepository.count({
      where: { user: { id: userId } },
    });
  }
}
