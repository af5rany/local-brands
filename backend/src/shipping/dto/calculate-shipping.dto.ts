import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateShippingDto {
  @ApiProperty()
  @IsNumber()
  brandId: number;

  @ApiProperty({ description: 'ISO 2-letter country code' })
  @IsString()
  countryCode: string;

  @ApiPropertyOptional({ description: 'Total weight in kg' })
  @IsOptional()
  @IsNumber()
  totalWeight?: number;
}
