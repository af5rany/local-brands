// // src/cart/cart.controller.ts
// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Delete,
//   Body,
//   Param,
//   ParseIntPipe,
//   UseGuards,
//   Req,
// } from '@nestjs/common';
// import { CartService } from './cart.service';
// import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';

// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { User } from '../users/user.entity';

// @Controller('cart')
// @UseGuards(JwtAuthGuard) // Require authentication for all cart operations
// export class CartController {
//   constructor(private cartService: CartService) {}

//   @Get()
//   getCart(@Req() req: { user: User }) {
//     return this.cartService.getCart(req.user.id);
//   }

//   @Post('add')
//   async addToCart(
//     @Req() req: { user: User },
//     @Body() addToCartDto: AddToCartDto,
//   ) {
//     const { productId, quantity, selectedColor, selectedSize } = addToCartDto;
//     return this.cartService.addToCart(
//       req.user.id,
//       productId,
//       quantity,
//       selectedColor,
//       selectedSize,
//     );
//   }

//   @Put('items/:id')
//   async updateCartItem(
//     @Req() req: { user: User },
//     @Param('id', ParseIntPipe) cartItemId: number,
//     @Body() updateDto: UpdateCartItemDto,
//   ) {
//     return this.cartService.updateCartItem(req.user.id, cartItemId, updateDto);
//   }

//   @Delete('items/:id')
//   async removeFromCart(
//     @Req() req: { user: User },
//     @Param('id', ParseIntPipe) cartItemId: number,
//   ) {
//     return this.cartService.removeFromCart(req.user.id, cartItemId);
//   }

//   @Delete('clear')
//   async clearCart(@Req() req: { user: User }) {
//     await this.cartService.clearCart(req.user.id);
//     return { message: 'Cart cleared successfully' };
//   }
// }
