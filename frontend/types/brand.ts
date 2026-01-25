import { Product } from "./product";
import { User, BrandUser } from "./user";

// Brand Interface matching the backend structure
export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  location?: string;
  brandUsers: BrandUser[];
  createdAt: string;
  updatedAt: string;
  products: Product[];
}
