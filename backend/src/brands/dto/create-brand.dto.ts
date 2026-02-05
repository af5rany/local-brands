import { IsString, IsOptional, IsEnum } from 'class-validator';
import { BrandStatus } from 'src/common/enums/brand.enum';

export class CreateBrandDto {
    @IsString()
    name: string;

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
    status?: BrandStatus = BrandStatus.DRAFT;
}
