export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Filters {
  location?: string;
  ownerId?: string;
  brandId?: number | string;
  gender?: string;
  productType?: string;
}

export interface SortOptions {
  sortBy: "name" | "createdAt" | "updatedAt" | "location" | "price" | "brandName";
  sortOrder: "ASC" | "DESC";
}
