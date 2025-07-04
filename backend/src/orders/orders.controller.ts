// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderStatus } from 'src/common/enums/order.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/get-orders.dto';

// DTOs for request validation
export class UpdateOrderStatusDto {
  status: OrderStatus;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ✅ Create new order
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.create(createOrderDto, Number(req.user.id));
  }

  // ✅ Get all orders (Admin only) with pagination and filtering
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getOrders(@Query(ValidationPipe) query: OrderQueryDto, @Request() req) {
    return this.ordersService.findAll(
      query,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }

  // ✅ Get current user's orders
  @Get('my-orders')
  async getMyOrders(
    @Request() req,
    @Query(ValidationPipe) query: OrderQueryDto,
  ) {
    return this.ordersService.findAll(
      query,
      Number(req.user.id),
      UserRole.CUSTOMER,
    );
  }

  // ✅ Get order statistics
  @Get('stats')
  async getOrderStats(@Request() req) {
    // For customers, only show their stats. For admins, show all stats
    const userId =
      req.user.role === UserRole.CUSTOMER ? Number(req.user.id) : undefined;
    return this.ordersService.getOrderStats(userId);
  }

  // ✅ Get single order by ID
  @Get(':id')
  async getOrderById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.findOne(
      id,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }

  // ✅ Update order (Admin only, or customer for limited fields)
  @Put(':id')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.update(
      id,
      updateOrderDto,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }

  // ✅ Update order status (Admin only)
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ): Promise<Order> {
    const updateDto: UpdateOrderDto = {
      status: updateOrderStatusDto.status,
    };
    return this.ordersService.update(
      id,
      updateDto,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }

  // ✅ Cancel order (Customer can cancel their own orders, Admin can cancel any)
  @Put(':id/cancel')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Order> {
    return this.ordersService.cancel(
      id,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }
}
