import { ProductType, Gender, Season, ProductStatus } from "./enums"; // Import enums from enums.ts
import { Brand } from "./brand"; // Import Brand interface

export interface ProductVariant {
  id: number;
  productId: number;
  sku?: string;
  attributes: Record<string, string>;
  priceOverride?: number;
  stock: number;
  images: string[];
  variantImages?: string[];
  color?: string;
  colorHex?: string;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  brandId: number;
  brand: Brand;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  brandName?: string;
}
