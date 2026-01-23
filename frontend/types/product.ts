import { ProductType, Gender, Season } from "./enums"; // Import enums from enums.ts
import { Brand } from "./brand"; // Import Brand interface

export interface ProductVariant {
  color: string;
  colorHex?: string;
  variantImages: string[]; // Added field for variant-specific image
  createdAt?: string; // Using string for date representation (ISO format)
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
  isActive: boolean;
  isFeatured: boolean;
  brandId: number;
  brand: Brand;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  brandName?: string;
}
