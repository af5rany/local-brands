import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductQuestion } from './product-question.entity';
import { ProductQuestionsService } from './product-questions.service';
import {
  ProductQuestionsController,
  QuestionActionsController,
} from './product-questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductQuestion])],
  controllers: [ProductQuestionsController, QuestionActionsController],
  providers: [ProductQuestionsService],
  exports: [ProductQuestionsService],
})
export class ProductQuestionsModule {}
