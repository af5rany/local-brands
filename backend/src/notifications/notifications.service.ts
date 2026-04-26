import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { StockNotification } from './stock-notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(StockNotification)
    private stockNotificationRepo: Repository<StockNotification>,
  ) {}

  async create(userId: number, type: NotificationType, title: string, message: string, data?: Record<string, any>): Promise<Notification> {
    const notification = this.notificationRepo.create({ userId, type, title, message, data });
    return this.notificationRepo.save(notification);
  }

  async getByUser(userId: number, limit = 50, offset = 0): Promise<{ items: Notification[]; unreadCount: number }> {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    const unreadCount = await this.notificationRepo.count({ where: { userId, isRead: false } });
    return { items, unreadCount };
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }

  async subscribeToStock(userId: number, productId: number): Promise<StockNotification> {
    const existing = await this.stockNotificationRepo.findOne({ where: { userId, productId } });
    if (existing) return existing;
    const sub = this.stockNotificationRepo.create({ userId, productId });
    return this.stockNotificationRepo.save(sub);
  }

  async unsubscribeFromStock(userId: number, productId: number): Promise<void> {
    await this.stockNotificationRepo.delete({ userId, productId });
  }

  async isSubscribedToStock(userId: number, productId: number): Promise<{ subscribed: boolean }> {
    const count = await this.stockNotificationRepo.count({ where: { userId, productId } });
    return { subscribed: count > 0 };
  }

  async getStockSubscriberIds(productId: number): Promise<number[]> {
    const subs = await this.stockNotificationRepo.find({
      where: { productId, notified: false },
      select: ['userId'],
    });
    return subs.map((s) => s.userId);
  }

  async markStockSubscribersNotified(productId: number): Promise<void> {
    await this.stockNotificationRepo.update({ productId, notified: false }, { notified: true });
  }

  async createBulk(
    userIds: number[],
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepo.create({ userId, type, title, message, data }),
    );
    await this.notificationRepo.save(notifications);
  }
}
