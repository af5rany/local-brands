// src/wishlist/wishlist.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'Item added to wishlist successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User or Product not found' })
  @ApiResponse({ status: 409, description: 'Item already in wishlist' })
  async create(
    @Body() createWishlistDto: CreateWishlistDto,
    @Request() req,
  ): Promise<Wishlist> {
    const userId = req.user.id; // Extract current user ID from the JWT payload
    if (createWishlistDto.userId !== userId) {
      throw new ForbiddenException(
        "You can't add items to other user's wishlist.",
      );
    }
    return this.wishlistService.create(createWishlistDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wishlist items' })
  @ApiResponse({
    status: 200,
    description: 'All wishlist items retrieved successfully',
  })
  findAll(): Promise<Wishlist[]> {
    return this.wishlistService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get wishlist item by ID' })
  @ApiParam({ name: 'id', description: 'Wishlist item ID' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist item retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Wishlist> {
    return this.wishlistService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get wishlist items by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User wishlist items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ): Promise<Wishlist[]> {
    const currentUser = req.user;
    if (currentUser.id !== userId) {
      throw new ForbiddenException("You can't access another user's wishlist.");
    }
    return this.wishlistService.findByUser(userId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get wishlist items by product ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product wishlist items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<Wishlist[]> {
    return this.wishlistService.findByProduct(productId);
  }

  @Get('check/:userId/:productId')
  @ApiOperation({ summary: "Check if product is in user's wishlist" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Check result returned successfully',
  })
  async checkWishlist(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req,
  ): Promise<{ inWishlist: boolean }> {
    const currentUser = req.user;
    if (currentUser.id !== userId) {
      throw new ForbiddenException("You can't check another user's wishlist.");
    }
    const inWishlist = await this.wishlistService.isProductInUserWishlist(
      userId,
      productId,
    );
    return { inWishlist };
  }

  @Get('count/:userId')
  @ApiOperation({ summary: 'Get wishlist count for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist count retrieved successfully',
  })
  async getWishlistCount(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ): Promise<{ count: number }> {
    const currentUser = req.user;
    if (currentUser.id !== userId) {
      throw new ForbiddenException(
        "You can't access another user's wishlist count.",
      );
    }
    const count = await this.wishlistService.getWishlistCount(userId);
    return { count };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update wishlist item' })
  @ApiParam({ name: 'id', description: 'Wishlist item ID' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ): Promise<Wishlist> {
    return this.wishlistService.update(id, updateWishlistDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove wishlist item by ID' })
  @ApiParam({ name: 'id', description: 'Wishlist item ID' })
  @ApiResponse({
    status: 204,
    description: 'Wishlist item removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.wishlistService.remove(id);
  }

  @Delete('user/:userId/product/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove item from user's wishlist" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 204,
    description: 'Item removed from wishlist successfully',
  })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  removeByUserAndProduct(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req,
  ): Promise<void> {
    const currentUser = req.user;
    if (currentUser.id !== userId) {
      throw new ForbiddenException(
        "You can't remove items from another user's wishlist.",
      );
    }
    return this.wishlistService.removeByUserAndProduct(userId, productId);
  }
}
