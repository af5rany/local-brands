import React from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Image, FlatList } from "react-native";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import BrandCard from "./BrandCard";
import RecommendationCard from "./RecommendationCard";
import FilterChips from "./FilterChips";
import FilterModal from "./FilterModal";
import { Ionicons } from "@expo/vector-icons";
import Pagination from "./Pagination";

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
    category?: string;
    type?: string;
    brand?: string;
    sort?: string;
  };
  onFilterPress?: (type: string, value?: string) => void;
  filterOptions?: {
    categories: string[];
    productTypes: string[];
  };
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
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
  filterOptions = { categories: [], productTypes: [] },
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => { },
}: CustomerDashboardProps) => {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState<"products" | "brands">("products");
  const [isFilterModalVisible, setFilterModalVisible] = React.useState(false);
  const [currentFilterType, setCurrentFilterType] = React.useState<string>("");

  const handleChipPress = (type: string) => {
    setCurrentFilterType(type);
    setFilterModalVisible(true);
  };

  const getModalOptions = () => {
    switch (currentFilterType) {
      case "category":
        return filterOptions.categories.map(c => ({ id: c, label: c }));
      case "type":
        return filterOptions.productTypes.map(t => ({ id: t, label: t }));
      case "brand":
        return featuredBrands.map(b => ({ id: b.id.toString(), label: b.name }));
      case "sort":
        return [
          { id: "DESC", label: "Newest First" },
          { id: "ASC", label: "Oldest First" },
        ];
      default:
        return [];
    }
  };

  const handleSelectOption = (id: string, label: string) => {
    onFilterPress?.(currentFilterType, id);
    setFilterModalVisible(false);
  };
  const isTablet = width > 768;
  const numColumns = isTablet ? 3 : 2;
  const cardGap = 12;
  const cardWidth = (width - (16 * 2) - (cardGap * (numColumns - 1))) / numColumns;

  const renderProductItem = ({ item }: { item: Product }) => (
    <RecommendationCard
      product={{
        id: item.id.toString(),
        name: item.name,
        price: item.salePrice ?? item.price,
        image: item.variants?.[0]?.variantImages?.[0] || "",
        brand: item.brand?.name || "Global Brand",
        rating: 4.8,
        originalPrice: item.salePrice ? item.price : undefined,
      }}
      onPress={() => navigateTo(`/products/${item.id}`)}
      onAddToWishlist={() => { }}
      style={{ width: cardWidth, marginRight: 0, marginBottom: cardGap }}
    />
  );

  const renderBrandItem = ({ item }: { item: Brand }) => (
    <TouchableOpacity
      style={[styles.brandCard, { width: cardWidth, marginRight: 0 }]}
      onPress={() => navigateTo(`/brands/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.brandLogoBox}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.brandLogo} resizeMode="contain" />
        ) : (
          <Ionicons name="business" size={32} color="#64748b" />
        )}
      </View>
      <View style={styles.brandInfo}>
        <Text style={styles.brandName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandTagline} numberOfLines={1}>{item.location || "Global"}</Text>
        <View style={styles.productCountBadge}>
          <Text style={styles.productCountText}>{item.products?.length || 0} Products</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 2) Primary CTAs - Segmented Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.activeTab]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "brands" && styles.activeTab]}
          onPress={() => setActiveTab("brands")}
        >
          <Text style={[styles.tabText, activeTab === "brands" && styles.activeTabText]}>Brands</Text>
        </TouchableOpacity>
      </View>

      {/* 3) Quick Filter Chips */}
      <FilterChips
        activeFilters={activeFilters}
        onFilterPress={handleChipPress}
      />

      {/* Filter Selection Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title={`Filter by ${currentFilterType.charAt(0).toUpperCase() + currentFilterType.slice(1)}`}
        options={getModalOptions()}
        onSelect={handleSelectOption}
        activeId={activeFilters[currentFilterType as keyof typeof activeFilters]}
        enableSearch={currentFilterType === "brand"}
      />

      {/* 4) Featured Strip (Curation Layer) - Only show for Product tab or as a global entry */}
      {featuredBrands.length > 0 && activeTab === "products" && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Brands</Text>
            <TouchableOpacity onPress={() => navigateTo("/brands")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredBrands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                size="small"
                onPress={() => navigateTo(`/brands/${brand.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5) Main Content Grid */}
      <View style={styles.gridContainer}>
        <Text style={styles.discoveryTitle}>
          {activeTab === "products" ? "Latest Arrivals" : "All Brands"}
        </Text>
        <FlatList
          data={activeTab === "products" ? (newArrivals as any[]) : (featuredBrands as any[])}
          keyExtractor={(item) => item.id.toString()}
          renderItem={activeTab === "products" ? (renderProductItem as any) : (renderBrandItem as any)}
          numColumns={numColumns}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={<Text style={styles.emptyText}>Nothing found in this section</Text>}
          key={activeTab === "products" ? "h-grid" : "v-grid"} // Force re-render on tab change for grid layout
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  activeTab: {
    backgroundColor: "#1e293b",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  featuredSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  seeAll: {
    fontSize: 14,
    color: "#346beb",
    fontWeight: "600",
  },
  featuredList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridContainer: {
    padding: 16,
  },
  discoveryTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  gridRow: {
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  brandCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    marginBottom: 12,
  },
  brandLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  brandLogo: {
    width: "100%",
    height: "100%",
  },
  brandInfo: {
    alignItems: "center",
    width: "100%",
  },
  brandName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
    textAlign: "center",
  },
  brandTagline: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
    textAlign: "center",
  },
  productCountBadge: {
    backgroundColor: "#346beb10",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#346beb",
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 20,
  },
});

export default CustomerDashboard;
