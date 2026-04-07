import { ProductType, Gender, Season, ProductStatus } from "./enums"; // Import enums from enums.ts
import { Brand } from "./brand"; // Import Brand interface

export interface ProductVariant {
  id: number;
  productId: number;
  size?: string;
  stock: number;
  isAvailable: boolean;
}

// Product Interface
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  productType?: ProductType;
  subcategory?: string;
  gender?: Gender;
  season?: Season;
  tags?: string[];
  material?: string;
  careInstructions?: string;
  origin?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  color?: string;
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  isNewArrival?: boolean;
  hasVariants: boolean;
  brandId: number;
  brand: Brand;
  variants: ProductVariant[];
  mainImage?: string;
  images?: string[];
  averageRating?: number;
  reviewCount?: number;
  viewCount?: number;
  salesCount?: number;
  inStock?: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
  brandName?: string;
}
