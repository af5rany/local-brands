import { Controller, Get, Post, Delete, Patch, Param, ParseIntPipe, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.notificationsService.getByUser(req.user.userId, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.notificationsService.markAsRead(id, req.user.userId);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { success: true };
  }

  @Post('notify-me/:productId')
  async subscribeStockAlert(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.subscribeToStock(req.user.userId, productId);
  }

  @Delete('notify-me/:productId')
  async unsubscribeStockAlert(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.unsubscribeFromStock(req.user.userId, productId);
  }

  @Get('notify-me/check/:productId')
  async checkStockSubscription(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.isSubscribedToStock(req.user.userId, productId);
  }
}
