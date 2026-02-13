import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBrandDto } from './create-brand.dto';

export class BatchCreateBrandDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateBrandDto)
    brands: CreateBrandDto[];
}
