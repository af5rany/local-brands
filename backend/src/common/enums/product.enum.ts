// Season Enum
export enum Season {
  SPRING = 'Spring',
  SUMMER = 'Summer',
  FALL = 'Fall',
  WINTER = 'Winter',
  ALL_SEASON = 'All Season',
}

// ProductType Enum (Product Types)
export enum ProductType {
  SHOES = 'Shoes',
  HOODIES = 'Hoodies',
  SHIRTS = 'Shirts',
  ACCESSORIES = 'Accessories',
  PANTS = 'Pants',
  JACKETS = 'Jackets',
  BAGS = 'Bags',
  HATS = 'Hats',
}
// Interface for variant data (timestamps optional for input)
export interface ProductVariantData {
  color: string;
  size?: string;
  variantImages: string[];
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum SortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  BRAND_NAME = 'brandName',
  POPULARITY = 'popularity',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
