import { UserRole, UserStatus, BrandRole } from "./enums";

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
  role: UserRole;
  status: UserStatus;
  isGuest: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  brandUsers?: BrandUser[];
}
