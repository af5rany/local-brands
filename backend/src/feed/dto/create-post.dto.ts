import {
  IsArray,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaggedProductDto {
  @IsInt()
  productId: number;

  @IsOptional()
  @IsNumber()
  xPercent?: number;

  @IsOptional()
  @IsNumber()
  yPercent?: number;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Brand ID the post belongs to' })
  @IsInt()
  brandId: number;

  @ApiProperty({
    description: 'Array of image URLs (1-10)',
    example: ['https://res.cloudinary.com/...'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  images: string[];

  @ApiPropertyOptional({ description: 'Post caption (max 2000 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Array of product IDs to tag (legacy — use products instead)',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  productIds?: number[];

  @ApiPropertyOptional({
    description: 'Tagged products with optional pin position',
    type: [TaggedProductDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaggedProductDto)
  products?: TaggedProductDto[];
}
