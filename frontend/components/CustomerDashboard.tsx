import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import RecommendationCard from "./RecommendationCard";
import FilterChips from "./FilterChips";
import FilterPanel, { PanelFilters } from "./FilterPanel";
import { Ionicons } from "@expo/vector-icons";
import Pagination from "./Pagination";
import { useThemeColors } from "@/hooks/useThemeColor";

type CustomerDashboardProps = {
  navigateTo: (path: string) => void;
  stats: any;
  loadingStats: boolean;
  featuredBrands?: Brand[];
  newArrivals?: Product[];
  isGuest?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  activeFilters?: {
    categories?: string[];
    brands?: string[];
    sort?: string;
    sortBy?: string;
    priceMin?: number;
    priceMax?: number;
  };
  onFilterPress?: (type: string, values: string[], labels?: string[]) => void;
  onFiltersApply?: (
    filters: { categories: string[]; brandIds: string[]; sortOrder: "ASC" | "DESC" },
    brandLabels: Record<string, string>,
  ) => void;
  filterLabels?: { brands?: Record<string, string>; sort?: string };
  filterOptions?: {
    categories: string[];
    productTypes: string[];
  };
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  brandsCurrentPage?: number;
  brandsTotalPages?: number;
  onBrandsPageChange?: (page: number) => void;
  wishlistProductIds?: number[];
  onToggleWishlist?: (productId: number) => void;
  onAddToCart?: (productId: number) => Promise<void>;
};

const CustomerDashboard = ({
  navigateTo,
  stats,
  loadingStats,
  featuredBrands = [],
  newArrivals = [],
  isGuest = false,
  searchQuery,
  onSearchChange,
  activeFilters = {},
  onFilterPress,
  onFiltersApply,
  filterLabels = {},
  filterOptions = { categories: [], productTypes: [] },
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  brandsCurrentPage = 1,
  brandsTotalPages = 1,
  onBrandsPageChange = () => {},
  wishlistProductIds = [],
  onToggleWishlist,
  onAddToCart,
}: CustomerDashboardProps) => {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = React.useState<"products" | "brands">(
    "products",
  );
  const [isPanelVisible, setIsPanelVisible] = React.useState(false);

  const panelActiveFilters: PanelFilters = {
    categories: activeFilters.categories ?? [],
    brands: activeFilters.brands ?? [],
    sortBy: activeFilters.sortBy ?? "createdAt",
    sortOrder: (activeFilters.sort ?? "DESC") as "ASC" | "DESC",
    priceMin: activeFilters.priceMin ?? 0,
    priceMax: activeFilters.priceMax ?? 500,
  };

  const handlePanelApply = (filters: PanelFilters) => {
    // Call onFilterPress for each type — React batches these state updates
    onFilterPress?.("category", filters.categories, filters.categories);

    const brandLabels = filters.brands.map((id) => {
      const brand = featuredBrands.find((b) => b.id.toString() === id);
      return brand?.name ?? id;
    });
    onFilterPress?.("brand", filters.brands, brandLabels);

    const sortLabel =
      filters.sortOrder === "DESC" ? "Newest First" : "Oldest First";
    onFilterPress?.("sort", [filters.sortOrder], [sortLabel]);
  };

  const handleClearFilter = (type: "category" | "brand" | "sort") => {
    if (type === "sort") {
      onFilterPress?.("sort", [], []);
    } else if (type === "category") {
      onFilterPress?.("category", [], []);
    } else {
      onFilterPress?.("brand", [], []);
    }
  };

  // Responsive grid
  const numColumns = 2;
  const cardGap = 12;

  const renderProductItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => (
    <View
      style={[
        styles.gridItem,
        index % 2 === 0
          ? { marginRight: cardGap / 2 }
          : { marginLeft: cardGap / 2 },
      ]}
    >
      <RecommendationCard
        product={{
          id: item.id.toString(),
          name: item.name,
          price: item.salePrice ?? item.price,
          image: item.variants?.[0]?.images?.[0] || "",
          brand: item.brand?.name || "Local Brand",
          rating: 4.8,
          originalPrice: item.salePrice ? item.price : undefined,
        }}
        onPress={() => navigateTo(`/products/${item.id}`)}
        onAddToWishlist={() => {
          if (isGuest) {
            navigateTo("/auth/login");
          } else {
            onToggleWishlist?.(item.id);
          }
        }}
        onAddToCart={() => {
          if (isGuest) {
            navigateTo("/auth/login");
            return Promise.resolve();
          }
          return onAddToCart?.(item.id) ?? Promise.resolve();
        }}
        isInWishlist={!isGuest && wishlistProductIds.includes(item.id)}
        style={{ width: "100%", marginRight: 0, marginBottom: 0 }}
      />
    </View>
  );

  const renderBrandItem = ({ item, index }: { item: Brand; index: number }) => (
    <View
      style={[
        styles.gridItem,
        index % 2 === 0
          ? { marginRight: cardGap / 2 }
          : { marginLeft: cardGap / 2 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.brandCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
        onPress={() => navigateTo(`/brands/${item.id}`)}
        activeOpacity={0.8}
      >
        <View
          style={[styles.brandLogoBox, { backgroundColor: colors.primarySoft }]}
        >
          {item.logo ? (
            <Image
              source={{ uri: item.logo }}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="storefront" size={28} color={colors.primary} />
          )}
        </View>
        <View style={styles.brandInfo}>
          <Text
            style={[styles.brandName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.brandLocation, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {item.location || "Global"}
          </Text>
          <View
            style={[
              styles.productCountBadge,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Text style={[styles.productCountText, { color: colors.primary }]}>
              {item.products?.length || 0} Products
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loadingStats) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Switcher */}
      <View
        style={[styles.tabContainer, { backgroundColor: colors.surfaceRaised }]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "products"
              ? { backgroundColor: colors.tabActiveBackground }
              : { backgroundColor: "transparent" },
          ]}
          onPress={() => setActiveTab("products")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={
              activeTab === "products"
                ? colors.primaryForeground
                : colors.tabInactive
            }
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "products"
                    ? colors.primaryForeground
                    : colors.tabInactive,
              },
              activeTab === "products" && styles.tabTextActive,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "brands"
              ? { backgroundColor: colors.tabActiveBackground }
              : { backgroundColor: "transparent" },
          ]}
          onPress={() => setActiveTab("brands")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={
              activeTab === "brands"
                ? colors.primaryForeground
                : colors.tabInactive
            }
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "brands"
                    ? colors.primaryForeground
                    : colors.tabInactive,
              },
              activeTab === "brands" && styles.tabTextActive,
            ]}
          >
            Brands
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <FilterChips
        onOpenFilters={() => setIsPanelVisible(true)}
        activeFilters={panelActiveFilters}
        filterLabels={{ brands: filterLabels.brands }}
        onClearFilter={handleClearFilter}
      />

      {/* Unified Filter Panel */}
      <FilterPanel
        visible={isPanelVisible}
        onClose={() => setIsPanelVisible(false)}
        activeFilters={panelActiveFilters}
        categoryOptions={filterOptions.productTypes}
        brandOptions={featuredBrands.map((b) => ({
          id: b.id.toString(),
          name: b.name,
        }))}
        onApply={handlePanelApply}
      />

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {activeTab === "products" ? "products" : "Discover Brands"}
        </Text>
        {/* <TouchableOpacity
          onPress={() =>
            navigateTo(activeTab === "products" ? "/products" : "/brands")
          }
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAll, { color: colors.primary }]}>
            See All
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <FlatList
          data={
            activeTab === "products"
              ? (newArrivals as any[])
              : (featuredBrands as any[])
          }
          keyExtractor={(item) => item.id.toString()}
          renderItem={
            activeTab === "products"
              ? (renderProductItem as any)
              : (renderBrandItem as any)
          }
          numColumns={numColumns}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={
                  activeTab === "products"
                    ? "cube-outline"
                    : "storefront-outline"
                }
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.textSecondary }]}
              >
                {activeTab === "products" ? "No products yet" : "No brands yet"}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textTertiary }]}
              >
                Check back soon for new arrivals
              </Text>
            </View>
          }
          key={activeTab}
        />

        {/* Pagination */}
        <Pagination
          currentPage={activeTab === "brands" ? brandsCurrentPage : currentPage}
          totalPages={activeTab === "brands" ? brandsTotalPages : totalPages}
          onPageChange={
            activeTab === "brands" ? onBrandsPageChange : onPageChange
          }
        />
      </View>

      {/* End of content indicator */}
      <View
        style={[styles.endOfContent, { borderTopColor: colors.borderLight }]}
      >
        <View
          style={[styles.endDot, { backgroundColor: colors.textTertiary }]}
        />
        <Text style={[styles.endText, { color: colors.textTertiary }]}>
          You've seen it all
        </Text>
        <View
          style={[styles.endDot, { backgroundColor: colors.textTertiary }]}
        />
      </View>

      {/* Wishlist FAB */}
      {!isGuest && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigateTo("/(tabs)/wishlist")}
          activeOpacity={0.85}
        >
          <Ionicons name="heart" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },

  // ── Tab Switcher ──────────────────────────
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "700",
  },

  // ── Section Header ────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Grid ──────────────────────────────────
  gridContainer: {
    paddingHorizontal: 16,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
  },
  gridRow: {
    justifyContent: "flex-start",
  },

  // ── Brand Card ────────────────────────────
  brandCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  brandLogoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  brandLogo: {
    width: "100%",
    height: "100%",
  },
  brandInfo: {
    alignItems: "center",
    width: "100%",
    gap: 3,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  brandLocation: {
    fontSize: 12,
    textAlign: "center",
  },
  productCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  productCountText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Empty State ───────────────────────────
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
  },
  endOfContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  endDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  endText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  // ── Wishlist FAB ──────────────────────────
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default CustomerDashboard;
