import { useState, useCallback, useEffect } from "react";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { BrandStatus, ProductStatus } from "@/types/enums";
import { ProductFilters } from "@/components/ProductFilterModal";

interface PaginatedResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export enum SortBy {
  NAME = "name",
  PRICE = "price",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  BRAND_NAME = "brandName",
  POPULARITY = "popularity",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface SortOption {
  key: string;
  label: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export const sortOptions: SortOption[] = [
  { key: "newest", label: "Newest", sortBy: SortBy.CREATED_AT, sortOrder: SortOrder.DESC },
  { key: "oldest", label: "Oldest", sortBy: SortBy.CREATED_AT, sortOrder: SortOrder.ASC },
  { key: "price_asc", label: "Price: Low to High", sortBy: SortBy.PRICE, sortOrder: SortOrder.ASC },
  { key: "price_desc", label: "Price: High to Low", sortBy: SortBy.PRICE, sortOrder: SortOrder.DESC },
  { key: "name_asc", label: "Name: A-Z", sortBy: SortBy.NAME, sortOrder: SortOrder.ASC },
  { key: "name_desc", label: "Name: Z-A", sortBy: SortBy.NAME, sortOrder: SortOrder.DESC },
  { key: "popularity", label: "Most Popular", sortBy: SortBy.POPULARITY, sortOrder: SortOrder.DESC },
];

export const useBrandDetails = (
  brandId: string | string[] | undefined,
  token?: string | null,
  user?: any
) => {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination & Filtering
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState<ProductFilters>({ search: "" });
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.CREATED_AT);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(sortOptions[0]);

  // Following
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnerOrAdmin =
    user?.role === "admin" ||
    user?.userRole === "admin" ||
    (user?.id && brand?.owner?.id && user.id === brand.owner.id);

  const fetchBrandDetails = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch brand details");
      const data = await response.json();
      setBrand(data);

      const statusMap: Record<string, ProductStatus> = {
        [BrandStatus.ACTIVE]: ProductStatus.PUBLISHED,
        [BrandStatus.DRAFT]: ProductStatus.DRAFT,
        [BrandStatus.ARCHIVED]: ProductStatus.ARCHIVED,
      };
      const mappedStatus = statusMap[data.status];
      const isOwner =
        user?.role === "admin" ||
        user?.userRole === "admin" ||
        (user?.id && data?.owner?.id && user.id === data.owner.id);
      if (mappedStatus && isOwner) {
        setFilters((prev) => ({ ...prev, status: mappedStatus }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId, token]);

  const fetchFollowState = useCallback(async () => {
    if (!token || !brandId) return;
    try {
      const [followRes, countRes] = await Promise.all([
        fetch(`${getApiUrl()}/brands/follow/${brandId}/check`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/brands/follow/${brandId}/count`),
      ]);
      if (followRes.ok) {
        const data = await followRes.json();
        setIsFollowing(data.following);
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setFollowerCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching follow state:", err);
    }
  }, [brandId, token]);

  const toggleFollow = async () => {
    if (!token || !brandId) return false;
    setFollowLoading(true);
    let success = false;
    try {
      const response = await fetch(`${getApiUrl()}/brands/follow/${brandId}`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
        success = true;
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading(false);
    }
    return success;
  };

  const fetchProducts = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (!brandId) return;
      if (reset) {
        setProductsLoading(true);
        if (page === 1) setProducts([]); // Clear optimistically
      }

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          brandIds: brandId as string,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        if (filters.search) queryParams.append("search", filters.search);
        if (filters.productType) queryParams.append("productTypes", filters.productType);
        if (filters.gender) queryParams.append("gender", filters.gender);
        if (filters.season) queryParams.append("season", filters.season);
        if (filters.minPrice) queryParams.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());
        
        // Enforce status constraint client-side
        if (isOwnerOrAdmin && filters.status) {
          queryParams.append("status", filters.status);
        } else if (!isOwnerOrAdmin) {
          queryParams.append("status", ProductStatus.PUBLISHED);
        }

        const response = await fetch(`${getApiUrl()}/products?${queryParams.toString()}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch products");
        const data: PaginatedResponse = await response.json();

        if (reset || page === 1) {
          setProducts(data.items);
        } else {
          setProducts((prev) => {
            // Deduplicate items to prevent double-rendering bugs if pagination is slow
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = data.items.filter(p => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        }
        
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProductsLoading(false);
        setRefreshing(false);
      }
    },
    [brandId, token, filters, sortBy, sortOrder, pagination.limit, isOwnerOrAdmin]
  );

  // Patch brand name into products when brand loads
  useEffect(() => {
    if (!brand?.name) return;
    setProducts((prev) => {
      if (prev.length === 0) return prev;
      const needsUpdate = prev.some((p) => p.brandName !== brand.name);
      return needsUpdate ? prev.map((p) => ({ ...p, brandName: brand.name })) : prev;
    });
  }, [brand?.name]); // functional updater always receives latest products — no need for products in deps

  return {
    brand,
    products,
    loading,
    productsLoading,
    error,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedSortOption,
    setSelectedSortOption,
    pagination,
    isFollowing,
    setIsFollowing,
    followerCount,
    setFollowerCount,
    followLoading,
    refreshing,
    setRefreshing,
    fetchBrandDetails,
    fetchProducts,
    fetchFollowState,
    toggleFollow,
    setBrand,
  };
};
