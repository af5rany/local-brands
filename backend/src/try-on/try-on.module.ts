import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TryOnController } from './try-on.controller';
import { TryOnService } from './try-on.service';
import { TryOnProcessor } from './try-on.processor';
import { TryOnResult } from './try-on-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TryOnResult]),
    BullModule.registerQueue({ name: 'try-on' }),
  ],
  controllers: [TryOnController],
  providers: [TryOnService, TryOnProcessor],
})
export class TryOnModule {}
