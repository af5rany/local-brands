import { Controller, Get, Post, Delete, Patch, Param, ParseIntPipe, UseGuards, Request, Query, Body, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushNotificationService: PushNotificationService,
  ) {}

  @Get()
  async getMyNotifications(@Request() req, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.notificationsService.getByUser(req.user.id, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Post('notify-me/:productId')
  async subscribeStockAlert(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.subscribeToStock(req.user.id, productId);
  }

  @Delete('notify-me/:productId')
  async unsubscribeStockAlert(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.unsubscribeFromStock(req.user.id, productId);
  }

  @Get('notify-me/check/:productId')
  async checkStockSubscription(@Param('productId', ParseIntPipe) productId: number, @Request() req) {
    return this.notificationsService.isSubscribedToStock(req.user.id, productId);
  }

  @Post('push-token')
  async registerPushToken(
    @Body() body: { token: string; platform: string },
    @Request() req,
  ) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      body.token,
      body.platform || 'unknown',
    );
  }

  @Delete('push-token')
  async unregisterPushToken(
    @Body() body: { token: string },
    @Request() req,
  ) {
    await this.pushNotificationService.unregisterToken(req.user.id, body.token);
    return { success: true };
  }
}
