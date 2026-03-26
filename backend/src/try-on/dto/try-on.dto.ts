import { IsString, IsNotEmpty, IsOptional, IsUrl, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TryOnDto {
  @ApiProperty({ description: 'URL of the person image (e.g. from Cloudinary)' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  personImageUrl: string;

  @ApiProperty({ description: 'URL of the garment/product image' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  garmentImageUrl: string;

  @ApiPropertyOptional({ enum: ['upper', 'lower', 'overall', 'inner', 'outer'], default: 'upper' })
  @IsString()
  @IsOptional()
  @IsIn(['upper', 'lower', 'overall', 'inner', 'outer'])
  clothType?: 'upper' | 'lower' | 'overall' | 'inner' | 'outer';
}
