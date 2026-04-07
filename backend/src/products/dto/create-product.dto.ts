import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ProductType,
  Season,
  ProductStatus,
} from 'src/common/enums/product.enum';
import { Gender } from 'src/common/enums/user.enum';

export class CreateProductVariantDto {
  @IsString()
  size: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
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
  isAvailable?: boolean = true;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsBoolean()
  isFeatured: boolean;

  @IsNumber()
  brandId: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
