import {
  ProductType,
  ProductStatus,
} from 'src/common/enums/product.enum';

export class PublicBrandDto {
  id: number;
  name: string;
  logo: string;
  slug?: string;
}

export class PublicVariantDto {
  id?: number;
  productId?: number;
  size?: string;
  stock: number;
  isAvailable?: boolean;
}

export class PublicProductDto {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  basePrice: number | null;
  currency: string;
  mainImage: string;
  images: string[];
  color: string | null;
  brand: PublicBrandDto;
  category: string; // Mapping from subcategory
  productType: ProductType;
  isAvailable: boolean;
  inStock: boolean;
  isLowStock: boolean;
  hasVariants: boolean;
  variants: PublicVariantDto[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  status: ProductStatus;
  gender?: string;
  season?: string;
  tags?: string[];
  material?: string;
  careInstructions?: string;
  origin?: string;
  stock: number;
}
