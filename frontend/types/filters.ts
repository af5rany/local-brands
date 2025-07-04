import { Brand } from "./brand";

export interface PaginatedResult {
  items: Brand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Filters {
  location: string;
  ownerId: string;
}

export interface SortOptions {
  sortBy: "name" | "createdAt" | "updatedAt" | "location";
  sortOrder: "ASC" | "DESC";
}
