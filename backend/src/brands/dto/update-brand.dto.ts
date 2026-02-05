import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BrandStatus } from 'src/common/enums/brand.enum';

export class UpdateBrandDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    logo?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsEnum(BrandStatus)
    status?: BrandStatus;
}
