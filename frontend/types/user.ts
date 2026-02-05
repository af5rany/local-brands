import { UserRole, UserStatus, BrandRole } from "./enums";
import { Address } from "./address";

export interface BrandUser {
  id: number;
  role: BrandRole;
  brandId: number;
  brand?: {
    id: number;
    name: string;
  };
}

// User Interface
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  isGuest: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  brandUsers?: BrandUser[];
  defaultShippingAddress?: Address;
  defaultBillingAddress?: Address;
}
