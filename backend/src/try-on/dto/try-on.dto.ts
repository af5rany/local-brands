import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TryOnDto {
  @ApiProperty({ description: 'URL of the person image (e.g. from Cloudinary)' })
  @IsString()
  @IsNotEmpty()
  personImageUrl: string;

  @ApiProperty({ description: 'URL of the garment/product image' })
  @IsString()
  @IsNotEmpty()
  garmentImageUrl: string;

  @ApiPropertyOptional({ enum: ['upper', 'lower', 'overall', 'inner', 'outer'], default: 'upper' })
  @IsString()
  @IsOptional()
  clothType?: 'upper' | 'lower' | 'overall' | 'inner' | 'outer';
}
