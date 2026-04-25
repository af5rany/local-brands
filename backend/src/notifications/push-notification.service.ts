import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PushToken } from './push-token.entity';
import { User } from '../users/user.entity';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private expo = new Expo();
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectRepository(PushToken)
    private pushTokenRepository: Repository<PushToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async registerToken(
    userId: number,
    token: string,
    platform: string,
  ): Promise<PushToken> {
    const existing = await this.pushTokenRepository.findOne({
      where: { token },
    });

    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      existing.isActive = true;
      return this.pushTokenRepository.save(existing);
    }

    const pushToken = this.pushTokenRepository.create({
      userId,
      token,
      platform,
      isActive: true,
    });
    return this.pushTokenRepository.save(pushToken);
  }

  async unregisterToken(userId: number, token: string): Promise<void> {
    await this.pushTokenRepository.update(
      { userId, token },
      { isActive: false },
    );
  }

  async sendPush(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    // Respect notification preferences
    const prefs = (user as any).notificationPreferences || {};
    if (prefs.push === false) return;

    const tokens = await this.pushTokenRepository.find({
      where: { userId, isActive: true },
    });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title,
        body,
        data: data || {},
        sound: 'default' as const,
      }));

    this.sendMessages(messages).catch((err) =>
      this.logger.error('Push send error', err),
    );
  }

  async sendPushToMany(
    userIds: number[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const tokens = await this.pushTokenRepository.find({
      where: { userId: In(userIds), isActive: true },
    });

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => Expo.isExpoPushToken(t.token))
      .map((t) => ({
        to: t.token,
        title,
        body,
        data: data || {},
        sound: 'default' as const,
      }));

    this.sendMessages(messages).catch((err) =>
      this.logger.error('Bulk push send error', err),
    );
  }

  private async sendMessages(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (err) {
        this.logger.error('Chunk send error', err);
      }
    }

    // Mark invalid tokens as inactive
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error') {
        if (
          ticket.details?.error === 'DeviceNotRegistered' &&
          messages[i]?.to
        ) {
          await this.pushTokenRepository.update(
            { token: messages[i].to as string },
            { isActive: false },
          ).catch(() => {});
        }
      }
    }
  }
}
