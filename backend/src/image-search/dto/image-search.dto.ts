import { IsOptional, IsEnum, IsString, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Gender } from 'src/common/enums/user.enum';

export class ImageSearchDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(2)
  threshold?: number = 0.8;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  productTypes?: string[];
}
