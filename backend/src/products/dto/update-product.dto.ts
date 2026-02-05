import { IsString, IsNumber, IsEnum, IsBoolean, IsArray, IsOptional, ValidateNested, ArrayMinSize, ArrayMaxSize, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductType, Season, ProductStatus } from 'src/common/enums/product.enum';
import { Gender } from 'src/common/enums/user.enum';
import { CreateProductVariantDto } from './create-product.dto';

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsNumber()
    salePrice?: number;

    @IsOptional()
    @IsEnum(ProductType)
    productType?: ProductType;

    @IsOptional()
    @IsString()
    subcategory?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsEnum(Season)
    season?: Season;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }): string[] => (value === null ? [] : value))
    tags?: string[];

    @IsOptional()
    @IsString()
    material?: string;

    @IsOptional()
    @IsString()
    careInstructions?: string;

    @IsOptional()
    @IsString()
    origin?: string;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsNumber()
    length?: number;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsNumber()
    basePrice?: number;

    @IsOptional()
    @IsNumber()
    lowStockThreshold?: number;

    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsNumber()
    brandId?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductVariantDto)
    variants?: CreateProductVariantDto[];
}
