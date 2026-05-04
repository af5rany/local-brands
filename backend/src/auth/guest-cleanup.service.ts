import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';

@Injectable()
export class GuestCleanupService {
  private readonly logger = new Logger(GuestCleanupService.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async removeStaleGuests(): Promise<void> {
    const deleted = await this.usersService.removeStaleGuests(24);
    this.logger.log(`Soft-deleted ${deleted} stale guest user(s)`);
  }
}
