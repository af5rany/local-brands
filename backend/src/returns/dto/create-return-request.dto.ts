import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReturnReason } from '../../common/enums/return.enum';

export class CreateReturnRequestDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  orderId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  orderItemId?: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  brandId: number;

  @ApiProperty({ enum: ReturnReason })
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
