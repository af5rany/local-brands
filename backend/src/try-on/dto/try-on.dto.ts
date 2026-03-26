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

  @ApiPropertyOptional({
    enum: ['auto', 'tops', 'bottoms', 'one-pieces'],
    default: 'auto',
    description: 'Garment category. Defaults to auto-detection.',
  })
  @IsString()
  @IsOptional()
  @IsIn(['auto', 'tops', 'bottoms', 'one-pieces'])
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
}
