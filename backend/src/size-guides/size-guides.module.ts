import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SizeGuide } from './size-guide.entity';
import { SizeGuidesService } from './size-guides.service';
import { SizeGuidesController } from './size-guides.controller';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [TypeOrmModule.forFeature([SizeGuide]), BrandsModule],
  controllers: [SizeGuidesController],
  providers: [SizeGuidesService],
  exports: [SizeGuidesService],
})
export class SizeGuidesModule {}
