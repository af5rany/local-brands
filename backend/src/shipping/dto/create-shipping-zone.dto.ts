import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingZoneDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [String], description: 'ISO country codes e.g. ["US","CA"]' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  countries: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
