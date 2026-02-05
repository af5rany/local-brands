import { Product } from "./product";
import { User, BrandUser } from "./user";
import { BrandStatus } from "./enums";

// Brand Interface matching the backend structure
export interface Brand {
  id: number;
  name: string;
  description?: string;
  status: BrandStatus;
  logo?: string;
  location?: string;
  brandUsers: BrandUser[];
  createdAt: string;
  updatedAt: string;
  products: Product[];
  productCount?: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}
