import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { useToast } from "@/context/ToastContext";
import AdminDashboard from "@/components/AdminDashboard";
import BrandOwnerDashboard from "@/components/BrandOwnerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { RefreshControl } from "react-native";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useThemeColors } from "@/hooks/useThemeColor";

const HomeScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, loading, user } = useAuth();
  const { selectedBrandId, isManagementMode, setIsManagementMode } = useBrand();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    brands: 0,
    products: 0,
    users: 0,
    myProducts: 0,
    orders: 0,
    revenue: 0,
    myOrders: 0,
    wishlist: 0,
    cartItems: 0,
  });
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
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
  const [filterLabels, setFilterLabels] = useState<{
    brands: Record<string, string>;
    sort?: string;
  }>({ brands: {} });

  // Get user role from JWT token
  const userRole = user?.role || user?.userRole || "customer";
  // console.log(JSON.stringify(user));
  // No longer redirecting to login automatically
  useEffect(() => {
    // We can still log if token changed, but no redirect
    console.log("[DEBUG] Token state:", token ? "Logged in" : "Guest");
  }, [token, loading]);

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

  // Fetch dashboard stats based on user role
  const fetchStats = async () => {
    if (!hasLoadedOnce.current) {
      setLoadingStats(true);
    }

    // Fetch Statistics (Only for authenticated users)
    const apiUrl = getApiUrl();
    // console.log('[DEBUG] GLOBAL API URL used in fetchStats (v2):', apiUrl);

    if (token) {
      try {
        const statsUrl =
          userRole === "brandOwner" && selectedBrandId
            ? `${apiUrl}/statistics?brandId=${selectedBrandId}`
            : `${apiUrl}/statistics`;

        const response = await fetch(statsUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
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

    // Build Brands Query Params (separate page state, no product-specific filters)
    const brandsParams = new URLSearchParams({
      limit: "12",
      page: brandsPage.toString(),
      ...(searchQuery && { search: searchQuery }),
      sortBy: "createdAt",
      sortOrder: activeFilters.sortOrder,
    }).toString();

    // Fetch Discovery Data (Products & Brands) - For Everyone
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
      } else {
        console.error(
          "[DEBUG] Products API Error:",
          productsRes.status,
          await productsRes.text(),
        );
      }
    } catch (error) {
      console.error("Error fetching discovery data:", error);
    } finally {
      hasLoadedOnce.current = true;
      setLoadingStats(false);
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

  const searchTimeout = React.useRef<any>(null);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Autocomplete Logic
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

    // Debounce API Call
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // fetchStats will be triggered by useEffect dependency on searchQuery
    }, 500);
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
  // Fetch when filters/pagination change (debounced for search)
  const isFirstMount = useRef(true);
  const hasLoadedOnce = useRef(false);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchStats(); // Full load on first mount
      return;
    }
    const timeout = setTimeout(
      () => {
        fetchStats();
      },
      searchQuery ? 300 : 0,
    );
    return () => clearTimeout(timeout);
  }, [searchQuery, activeFilters, page, brandsPage]);

  // Light refresh on focus — just wishlist + stats (cheap calls)
  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
      if (token) {
        const apiUrl = getApiUrl();
        const statsUrl =
          userRole === "brandOwner" && selectedBrandId
            ? `${apiUrl}/statistics?brandId=${selectedBrandId}`
            : `${apiUrl}/statistics`;
        fetch(statsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.ok && res.json())
          .then((data) => data && setStats((prev) => ({ ...prev, ...data })))
          .catch(console.error);
      }
    }, [token, userRole, selectedBrandId]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [token, userRole, selectedBrandId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#346beb" />
      </View>
    );
  }

  const navigateTo = (route: any) => {
    router.push(route);
  };

  const showComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is under development!");
  };

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
        {/* Header */}
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={userRole}
          isGuest={!token}
          onDashboardPress={() => {
            if (userRole === "admin" || userRole === "brandOwner") {
              setIsManagementMode(!isManagementMode);
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          suggestions={suggestions}
          onSuggestionPress={(text) => {
            setSearchQuery(text);
            handleSearchChange(text); // Trigger search
            setSuggestions([]);
          }}
        />

        {/* Role-based Dashboard */}
        {userRole === "admin" && isManagementMode ? (
          <AdminDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
            showComingSoon={showComingSoon}
            setIsManagementMode={setIsManagementMode}
          />
        ) : userRole === "brandOwner" && isManagementMode ? (
          <BrandOwnerDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
            showComingSoon={showComingSoon}
            setIsManagementMode={setIsManagementMode}
          />
        ) : (
          <CustomerDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
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
        )}

        {/* Recent Activity */}
        {/* <RecentActivity
          activities={getRecentActivity(userRole)}
          showComingSoon={showComingSoon}
        /> */}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    backgroundColor: "#f8fafc",
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
