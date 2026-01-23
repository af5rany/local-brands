import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductType, Season } from 'src/common/enums/product.enum';
import { Gender } from 'src/common/enums/user.enum';

export class CreateProductVariantDto {
  @IsString()
  color: string;

  @IsArray()
  @IsUrl({}, { each: true })
  variantImages: string[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

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

  @IsNumber()
  stock: number;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  isFeatured: boolean;

  @IsNumber()
  brand: number; // This will be mapped to brandId

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];
}
