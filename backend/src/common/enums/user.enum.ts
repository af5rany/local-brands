// src/common/enums/user.enum.ts
export enum UserRole {
  CUSTOMER = 'customer',
  BRAND_OWNER = 'brandOwner',
  ADMIN = 'admin',
  GUEST = 'guest',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

// Gender Enum
export enum Gender {
  MEN = 'men',
  WOMEN = 'women',
  UNISEX = 'unisex',
  KIDS = 'kids',
}
