// ProductType Enum (Product Types)
export enum ProductType {
  SHOES = "Shoes",
  HOODIES = "Hoodies",
  SHIRTS = "Shirts",
  ACCESSORIES = "Accessories",
  PANTS = "Pants",
  JACKETS = "Jackets",
  BAGS = "Bags",
  HATS = "Hats",
}

// Gender Enum
export enum Gender {
  MEN = "men",
  WOMEN = "women",
  UNISEX = "unisex",
  KIDS = "kids",
  BOYS = "boys",
  GIRLS = "girls",
}

// Season Enum
export enum Season {
  SPRING = "Spring",
  SUMMER = "Summer",
  FALL = "Fall",
  WINTER = "Winter",
  ALL_SEASON = "All Season",
}

// UserRole Enum
export enum UserRole {
  CUSTOMER = "customer",
  BRAND_OWNER = "brandOwner",
  ADMIN = "admin",
  GUEST = "guest",
}

// UserStatus Enum
export enum UserStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  ACTIVE = "active",
}

// BrandRole Enum
export enum BrandRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
  VIEWER = "viewer",
}

export enum BrandStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

export enum ProductStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}
