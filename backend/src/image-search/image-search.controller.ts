import {
  Controller,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Public } from 'src/auth/public.decorator';
import { UserRole } from 'src/common/enums/user.enum';
import { ImageSearchService } from './image-search.service';
import { ImageSearchDto } from './dto/image-search.dto';
import { PublicProductDto } from '../products/dto/public-product.dto';
import { PaginatedResult } from '../common/types/pagination.type';

@UseGuards(JwtAuthGuard)
@Controller('image-search')
export class ImageSearchController {
  constructor(private readonly imageSearchService: ImageSearchService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchByImage(
    @UploadedFile() file: Express.Multer.File,
    @Query() dto: ImageSearchDto,
  ): Promise<PaginatedResult<PublicProductDto>> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.imageSearchService.searchByImage(
      file.buffer,
      file.originalname,
      dto,
    );
  }

  @Post('batch-embed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async batchEmbed(): Promise<{ queued: number }> {
    return this.imageSearchService.queueAllProducts();
  }
}
