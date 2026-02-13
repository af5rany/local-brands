import React, { useCallback, useEffect, useState } from "react";
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
import AdminDashboard from "@/components/AdminDashboard";
import BrandOwnerDashboard from "@/components/BrandOwnerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { RefreshControl } from "react-native";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";

const HomeScreen = () => {
  const router = useRouter();
  const { token, loading, user } = useAuth();
  const { selectedBrandId, isManagementMode, setIsManagementMode } = useBrand();
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
    category: "",
    productType: "",
    brandId: "",
    sortBy: "createdAt",
    sortOrder: "DESC" as "ASC" | "DESC"
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    productTypes: [] as string[],
  });
  const [suggestions, setSuggestions] = useState<{ text: string; type: "Product" | "Brand" }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user role from JWT token
  const userRole = user?.role || user?.userRole || "customer";
  // console.log(JSON.stringify(user));
  // No longer redirecting to login automatically
  useEffect(() => {
    // We can still log if token changed, but no redirect
    console.log('[DEBUG] Token state:', token ? 'Logged in' : 'Guest');
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
    setLoadingStats(true);

    // Fetch Statistics (Only for authenticated users)
    const apiUrl = getApiUrl();
    // console.log('[DEBUG] GLOBAL API URL used in fetchStats (v2):', apiUrl);

    if (token) {
      try {
        const statsUrl = userRole === "brandOwner" && selectedBrandId
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

    // Build Discovery Query Params
    const queryParams = new URLSearchParams({
      limit: "12",
      page: page.toString(),
      ...(searchQuery && { search: searchQuery }),
      ...(activeFilters.category && { category: activeFilters.category }),
      ...(activeFilters.productType && { type: activeFilters.productType }),
      ...(activeFilters.brandId && { brandId: activeFilters.brandId }),
      sortBy: activeFilters.sortBy,
      sortOrder: activeFilters.sortOrder,
    }).toString();

    // Fetch Discovery Data (Products & Brands) - For Everyone
    try {
      const [brandsRes, productsRes] = await Promise.all([
        fetch(`${getApiUrl()}/brands?${queryParams}`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        }),
        fetch(`${getApiUrl()}/products?${queryParams}`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) }
        })
      ]);

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setFeaturedBrands(brandsData.items || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setNewArrivals(productsData.items || []);

        // Update pagination from meta if available
        if (productsData.meta) {
          setTotalPages(productsData.meta.totalPages || 1);
        }
      } else {
        console.error('[DEBUG] Products API Error:', productsRes.status, await productsRes.text());
      }
    } catch (error) {
      console.error("Error fetching discovery data:", error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  const searchTimeout = React.useRef<any>(null);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Autocomplete Logic
    if (text.length > 1) {
      const productSuggestions = newArrivals
        .filter(p => p.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 3)
        .map(p => ({ text: p.name, type: "Product" }));

      const brandSuggestions = featuredBrands
        .filter(b => b.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 2)
        .map(b => ({ text: b.name, type: "Brand" }));

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

  const handleFilterPress = (type: string, value?: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      // Reset page on filter change
      setPage(1);
      if (type === "category") {
        next.category = value || "";
      } else if (type === "type") {
        next.productType = value || "";
      } else if (type === "brand") {
        next.brandId = value || "";
      } else if (type === "sort") {
        next.sortOrder = (value as "ASC" | "DESC") || "DESC";
      }
      return next;
    });
  };

  useEffect(() => {
    fetchStats();
  }, [token, userRole, searchQuery, activeFilters, selectedBrandId, page]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [token, userRole, selectedBrandId])
  )

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
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
              category: activeFilters.category,
              type: activeFilters.productType,
              brand: activeFilters.brandId,
              sort: activeFilters.sortOrder
            }}
            onFilterPress={handleFilterPress}
            filterOptions={filterOptions}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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
