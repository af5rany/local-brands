import {
  IsArray,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Updated caption' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @ApiPropertyOptional({ description: 'Updated product IDs to tag' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  productIds?: number[];
}
