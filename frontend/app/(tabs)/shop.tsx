import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CustomerDashboard from "@/components/CustomerDashboard";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useThemeColors } from "@/hooks/useThemeColor";

const ShopScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, loading, user } = useAuth();
  const { showToast } = useToast();

  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    brandIds: [] as string[],
    sortBy: "createdAt",
    sortOrder: "DESC" as "ASC" | "DESC",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brandsPage, setBrandsPage] = useState(1);
  const [brandsTotalPages, setBrandsTotalPages] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    productTypes: [] as string[],
  });
  const [suggestions, setSuggestions] = useState<
    { text: string; type: "Product" | "Brand" }[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
  const [filterLabels, setFilterLabels] = useState<{
    brands: Record<string, string>;
    sort?: string;
  }>({ brands: {} });

  // Fetch Filter Options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/products/filters`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilters();
  }, []);

  const fetchData = async () => {
    if (!hasLoadedOnce.current) {
      setLoadingData(true);
    }

    // Build Products Query Params
    const productsParams = new URLSearchParams();
    productsParams.set("limit", "12");
    productsParams.set("page", page.toString());
    productsParams.set("status", "published");
    if (searchQuery) productsParams.set("search", searchQuery);
    activeFilters.categories.forEach((c) =>
      productsParams.append("productTypes", c),
    );
    activeFilters.brandIds.forEach((id) =>
      productsParams.append("brandIds", id),
    );
    productsParams.set("sortBy", activeFilters.sortBy);
    productsParams.set("sortOrder", activeFilters.sortOrder);

    // Build Brands Query Params
    const brandsParams = new URLSearchParams({
      limit: "12",
      page: brandsPage.toString(),
      ...(searchQuery && { search: searchQuery }),
      sortBy: "createdAt",
      sortOrder: activeFilters.sortOrder,
    }).toString();

    try {
      const [brandsRes, productsRes] = await Promise.all([
        fetch(`${getApiUrl()}/brands?${brandsParams}`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        }),
        fetch(`${getApiUrl()}/products?${productsParams.toString()}`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        }),
      ]);

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setFeaturedBrands(brandsData.items || []);
        setBrandsTotalPages(brandsData.totalPages || 1);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setNewArrivals(productsData.items || []);
        setTotalPages(productsData.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      hasLoadedOnce.current = true;
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlistProductIds([]);
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlistProductIds(data.map((item: any) => item.product.id));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }, [token]);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!token) return;
      try {
        const response = await fetch(
          `${getApiUrl()}/wishlist/toggle/${productId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (response.ok) {
          setWishlistProductIds((prev) =>
            prev.includes(productId)
              ? prev.filter((id) => id !== productId)
              : [...prev, productId],
          );
        }
      } catch (error) {
        console.error("Error toggling wishlist:", error);
      }
    },
    [token],
  );

  const addToCart = useCallback(
    async (productId: number) => {
      if (!token) return;
      try {
        const response = await fetch(`${getApiUrl()}/cart/add`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to add to cart");
        }
        showToast("Added to cart", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to add to cart", "error");
      }
    },
    [token],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (text.length > 1) {
      const productSuggestions = newArrivals
        .filter((p) => p.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 3)
        .map((p) => ({ text: p.name, type: "Product" }));

      const brandSuggestions = featuredBrands
        .filter((b) => b.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 2)
        .map((b) => ({ text: b.name, type: "Brand" }));

      setSuggestions([...productSuggestions, ...brandSuggestions] as any);
    } else {
      setSuggestions([]);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleBrandsPageChange = (newPage: number) => {
    setBrandsPage(newPage);
  };

  const handleFilterPress = (
    type: string,
    values: string[],
    labels?: string[],
  ) => {
    setPage(1);
    if (type === "category") {
      setActiveFilters((prev) => ({ ...prev, categories: values }));
    } else if (type === "brand") {
      setActiveFilters((prev) => ({ ...prev, brandIds: values }));
      const map: Record<string, string> = {};
      values.forEach((id, i) => {
        map[id] = labels?.[i] ?? id;
      });
      setFilterLabels((l) => ({ ...l, brands: map }));
    } else if (type === "sort") {
      setActiveFilters((prev) => ({
        ...prev,
        sortOrder: (values[0] as "ASC" | "DESC") || "DESC",
      }));
      setFilterLabels((l) => ({ ...l, sort: labels?.[0] }));
    }
  };

  const isFirstMount = useRef(true);
  const hasLoadedOnce = useRef(false);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchData();
      return;
    }
    const timeout = setTimeout(
      () => {
        fetchData();
      },
      searchQuery ? 300 : 0,
    );
    return () => clearTimeout(timeout);
  }, [searchQuery, activeFilters, page, brandsPage]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [token]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [token]);

  const navigateTo = (route: any) => {
    router.push(route);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={user?.role || user?.userRole || "customer"}
          isGuest={!token}
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          suggestions={suggestions}
          onSuggestionPress={(text) => {
            setSearchQuery(text);
            handleSearchChange(text);
            setSuggestions([]);
          }}
        />

        <CustomerDashboard
          navigateTo={navigateTo}
          stats={{ brands: 0, products: 0, users: 0 }}
          loadingStats={loadingData}
          isGuest={!token}
          featuredBrands={featuredBrands}
          newArrivals={newArrivals}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeFilters={{
            categories: activeFilters.categories,
            brands: activeFilters.brandIds,
            sort: activeFilters.sortOrder,
          }}
          onFilterPress={handleFilterPress}
          filterLabels={filterLabels}
          filterOptions={filterOptions}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          brandsCurrentPage={brandsPage}
          brandsTotalPages={brandsTotalPages}
          onBrandsPageChange={handleBrandsPageChange}
          wishlistProductIds={wishlistProductIds}
          onToggleWishlist={toggleWishlist}
          onAddToCart={addToCart}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ShopScreen;
