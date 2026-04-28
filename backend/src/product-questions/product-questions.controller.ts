import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { ProductQuestionsService } from './product-questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user.enum';

class AskQuestionDto {
  @IsString()
  @MinLength(3)
  question: string;
}

class AnswerQuestionDto {
  @IsString()
  @MinLength(1)
  answer: string;
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductQuestionsController {
  constructor(private readonly service: ProductQuestionsService) {}

  // Public — anyone can see answered Q&A
  @Public()
  @Get(':productId/questions')
  getForProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.getForProduct(productId);
  }

  // Authenticated — post a question
  @Post(':productId/questions')
  ask(
    @Param('productId', ParseIntPipe) productId: number,
    @Body(ValidationPipe) dto: AskQuestionDto,
    @Request() req,
  ) {
    return this.service.ask(productId, Number(req.user.id), dto.question);
  }

  // Brand owner or admin — answer a question
  @Put('questions/:questionId/answer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  answer(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body(ValidationPipe) dto: AnswerQuestionDto,
    @Request() req,
  ) {
    return this.service.answer(
      questionId,
      dto.answer,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }

  // Brand owner — get pending (unanswered) questions for their brand
  @Get('brand/:brandId/questions/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND_OWNER, UserRole.ADMIN)
  getPending(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.service.getPendingForBrand(brandId);
  }
}

// Separate controller for question-level ops (delete)
@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionActionsController {
  constructor(private readonly service: ProductQuestionsService) {}

  @Delete(':questionId')
  deleteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @Request() req,
  ) {
    return this.service.deleteQuestion(
      questionId,
      Number(req.user.id),
      req.user.role as UserRole,
    );
  }
}
