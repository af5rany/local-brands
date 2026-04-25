import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertReturnPolicyDto {
  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  returnWindowDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresImages?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  restockingFeePercent?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
