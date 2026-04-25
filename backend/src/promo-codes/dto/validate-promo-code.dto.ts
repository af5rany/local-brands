import { IsNumber, IsOptional, IsString, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  cartTotal: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  brandId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];
}
