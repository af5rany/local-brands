import { IsString, IsOptional, IsNumber, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSizeGuideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  brandId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  headers: string[];

  @ApiProperty()
  @IsArray()
  rows: { label: string; values: Record<string, string> }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['in', 'cm'])
  unit?: string;
}
