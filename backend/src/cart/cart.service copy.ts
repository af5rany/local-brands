// // src/cart/cart.service.ts
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, IsNull } from 'typeorm';
// import { Cart } from './cart.entity';
// import { CartItem } from './cart-item.entity';
// import { Product } from '../products/product.entity';
// import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';

// @Injectable()
// export class CartService {
//   constructor(
//     @InjectRepository(Cart)
//     private cartRepository: Repository<Cart>,
//     @InjectRepository(CartItem)
//     private cartItemRepository: Repository<CartItem>,
//     @InjectRepository(Product)
//     private productRepository: Repository<Product>,
//   ) {}

//   async getOrCreateCart(userId: number): Promise<Cart> {
//     let cart = await this.cartRepository.findOne({
//       where: { userId },
//       relations: ['cartItems', 'cartItems.product'],
//     });

//     if (!cart) {
//       cart = this.cartRepository.create({
//         userId,
//         totalAmount: 0,
//         totalItems: 0,
//       });
//       cart = await this.cartRepository.save(cart);
//     }

//     return cart;
//   }

//   async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
//     const { productId, quantity, selectedColor, selectedSize } = addToCartDto;

//     // Verify product exists
//     const product = await this.productRepository.findOneBy({ id: productId });
//     if (!product) {
//       throw new NotFoundException(`Product #${productId} not found`);
//     }

//     // Check if product is active
//     if (!product.isActive) {
//       throw new BadRequestException('Product is not available');
//     }

//     // Get or create cart
//     const cart = await this.getOrCreateCart(userId);

//     // Check if item already exists in cart with same specifications

//     const existingCartItem = await this.cartItemRepository.findOne({
//       where: {
//         cartId: cart.id,
//         productId,
//         selectedColor: selectedColor !== undefined ? selectedColor : IsNull(),
//         selectedSize: selectedSize !== undefined ? selectedSize : IsNull(),
//       },
//     });

//     const unitPrice = product.salePrice || product.price;

//     if (existingCartItem) {
//       // Update quantity
//       existingCartItem.quantity += quantity;
//       existingCartItem.totalPrice = existingCartItem.quantity * unitPrice;
//       await this.cartItemRepository.save(existingCartItem);
//     } else {
//       // Create new cart item
//       const cartItem = this.cartItemRepository.create({
//         cartId: cart.id,
//         productId,
//         quantity,
//         selectedColor,
//         selectedSize,
//         unitPrice,
//         totalPrice: quantity * unitPrice,
//       });
//       await this.cartItemRepository.save(cartItem);
//     }

//     // Update cart totals
//     await this.updateCartTotals(cart.id);

//     return this.getCartWithItems(cart.id);
//   }

//   async updateCartItem(
//     userId: number,
//     cartItemId: number,
//     updateDto: UpdateCartItemDto,
//   ): Promise<Cart> {
//     const cartItem = await this.cartItemRepository.findOne({
//       where: { id: cartItemId },
//       relations: ['cart', 'product'],
//     });

//     if (!cartItem) {
//       throw new NotFoundException(`Cart item #${cartItemId} not found`);
//     }

//     // Verify ownership
//     if (cartItem.cart.userId !== userId) {
//       throw new BadRequestException('Unauthorized to modify this cart item');
//     }

//     // Update cart item
//     if (updateDto.quantity !== undefined) {
//       cartItem.quantity = updateDto.quantity;
//       cartItem.totalPrice = cartItem.quantity * cartItem.unitPrice;
//     }

//     if (updateDto.selectedColor !== undefined) {
//       cartItem.selectedColor = updateDto.selectedColor;
//     }

//     if (updateDto.selectedSize !== undefined) {
//       cartItem.selectedSize = updateDto.selectedSize;
//     }

//     await this.cartItemRepository.save(cartItem);

//     // Update cart totals
//     await this.updateCartTotals(cartItem.cartId);

//     return this.getCartWithItems(cartItem.cartId);
//   }

//   async removeFromCart(userId: number, cartItemId: number): Promise<Cart> {
//     const cartItem = await this.cartItemRepository.findOne({
//       where: { id: cartItemId },
//       relations: ['cart'],
//     });

//     if (!cartItem) {
//       throw new NotFoundException(`Cart item #${cartItemId} not found`);
//     }

//     // Verify ownership
//     if (cartItem.cart.userId !== userId) {
//       throw new BadRequestException('Unauthorized to modify this cart item');
//     }

//     const cartId = cartItem.cartId;
//     await this.cartItemRepository.remove(cartItem);

//     // Update cart totals
//     await this.updateCartTotals(cartId);

//     return this.getCartWithItems(cartId);
//   }

//   async clearCart(userId: number): Promise<void> {
//     const cart = await this.cartRepository.findOne({
//       where: { userId },
//     });

//     if (cart) {
//       await this.cartItemRepository.delete({ cartId: cart.id });
//       await this.updateCartTotals(cart.id);
//     }
//   }

//   async getCart(userId: number): Promise<Cart> {
//     return this.getOrCreateCart(userId);
//   }

//   private async updateCartTotals(cartId: number): Promise<void> {
//     const cartItems = await this.cartItemRepository.find({
//       where: { cartId },
//     });

//     const totalAmount = cartItems.reduce(
//       (sum, item) => sum + Number(item.totalPrice),
//       0,
//     );
//     const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

//     await this.cartRepository.update(cartId, {
//       totalAmount,
//       totalItems,
//     });
//   }

//   private async getCartWithItems(cartId: number): Promise<Cart> {
//     const cart = await this.cartRepository.findOne({
//       where: { id: cartId },
//       relations: ['cartItems', 'cartItems.product'],
//     });
//     if (!cart) {
//       throw new NotFoundException(`Cart #${cartId} not found`);
//     }
//     return cart;
//   }
// }
