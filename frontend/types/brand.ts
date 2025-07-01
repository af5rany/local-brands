import { Product } from "./product"; // Import Product interface
import { User } from "./user"; // Import User interface

// Brand Interface matching the backend structure
export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  location?: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
  products: Product[];
}
