import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductQuestion } from './product-question.entity';
import { UserRole } from '../common/enums/user.enum';

@Injectable()
export class ProductQuestionsService {
  constructor(
    @InjectRepository(ProductQuestion)
    private readonly questionRepository: Repository<ProductQuestion>,
  ) {}

  async getForProduct(productId: number): Promise<ProductQuestion[]> {
    return this.questionRepository.find({
      where: { productId, isHidden: false },
      relations: ['user', 'answeredBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async ask(
    productId: number,
    userId: number,
    question: string,
  ): Promise<ProductQuestion> {
    if (!question || question.trim().length < 3) {
      throw new BadRequestException('Question must be at least 3 characters');
    }
    const q = this.questionRepository.create({
      productId,
      userId,
      question: question.trim(),
    });
    return this.questionRepository.save(q);
  }

  async answer(
    questionId: number,
    answerText: string,
    userId: number,
    userRole: UserRole,
  ): Promise<ProductQuestion> {
    const q = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['product', 'product.brand', 'product.brand.brandUsers'],
    });
    if (!q) throw new NotFoundException('Question not found');

    // Only admin or a brand owner of the product's brand can answer
    if (userRole !== UserRole.ADMIN) {
      const isBrandOwner = q.product.brand.brandUsers?.some(
        (bu) => bu.userId === userId,
      );
      if (!isBrandOwner)
        throw new ForbiddenException('Only the brand owner can answer this question');
    }

    q.answer = answerText.trim();
    q.answeredByUserId = userId;
    q.answeredAt = new Date();
    return this.questionRepository.save(q);
  }

  async getPendingForBrand(brandId: number): Promise<ProductQuestion[]> {
    return this.questionRepository
      .createQueryBuilder('q')
      .innerJoin('q.product', 'product', 'product.brandId = :brandId', { brandId })
      .leftJoinAndSelect('q.user', 'user')
      .where('q.answer IS NULL')
      .andWhere('q.isHidden = false')
      .orderBy('q.createdAt', 'ASC')
      .getMany();
  }

  async deleteQuestion(
    questionId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<void> {
    const q = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question not found');
    if (userRole !== UserRole.ADMIN && q.userId !== userId) {
      throw new ForbiddenException('Cannot delete this question');
    }
    await this.questionRepository.remove(q);
  }
}
