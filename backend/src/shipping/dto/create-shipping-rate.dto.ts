import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethod } from '../../common/enums/shipping.enum';

export class CreateShippingRateDto {
  @ApiProperty()
  @IsString()
  methodName: string;

  @ApiProperty({ enum: ShippingMethod })
  @IsEnum(ShippingMethod)
  method: ShippingMethod;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Estimated delivery days' })
  @IsNumber()
  @Min(0)
  estimatedDays: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
