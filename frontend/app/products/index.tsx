import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { debounce } from "lodash";
import { useColorScheme } from "react-native";
import { Filters, PaginatedResult, SortOptions } from "@/types/filters";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { Brand } from "@/types/brand";
import { Gender, ProductType } from "@/types/enums";

const { width } = Dimensions.get("window");

// interface Brand {
//   id: number;
//   name: string;
//   description?: string;
//   logo?: string;
//   location?: string;
//   owner?: {
//     id: number;
//     name: string;
//     email: string;
//   };
//   createdAt: string;
//   updatedAt: string;
//   productCount?: number;
// }

// interface PaginatedResult {
//   items: Brand[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
// }

// interface Filters {
//   location: string;
//   ownerId: string;
// }

// interface SortOptions {
//   sortBy: "name" | "createdAt" | "updatedAt" | "location";
//   sortOrder: "ASC" | "DESC";
// }

const ProductsListScreen = () => {
  const { token, user } = useAuth();
  const { setSelectedBrandId } = useBrand();
  const userRole = user?.role || user?.userRole;
  const [productsData, setProductsData] = useState<PaginatedResult<Product> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);

  // Search and Filter States
  const params = useLocalSearchParams();
  const urlBrandId = params.brandId ? String(params.brandId) : "";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({
    location: "",
    ownerId: "",
    brandId: urlBrandId,
    gender: "",
    productType: "",
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // UI States
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");

  const router = useRouter();

  // Set brandId from URL params on mount and sync with context
  useEffect(() => {
    if (urlBrandId) {
      setFilters(prev => ({ ...prev, brandId: urlBrandId }));
      setSelectedBrandId(parseInt(urlBrandId));
    } else {
      setSelectedBrandId(null);
    }
  }, [urlBrandId]);

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "tint"
  );
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text"
  );
  const colorScheme = useColorScheme() as "light" | "dark";
  const borderColor = colorScheme === "dark" ? "#38383A" : "#E5E5EA";

  // Build API URL with query parameters
  const buildApiUrl = useCallback(
    (page: number = 1) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(filters.location && { location: filters.location }),
        ...(filters.ownerId && { ownerId: filters.ownerId }),
        ...(filters.brandId && { brandId: filters.brandId.toString() }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.productType && { productType: filters.productType }),
        sortBy: sortOptions.sortBy,
        sortOrder: sortOptions.sortOrder,
      });

      return `${getApiUrl()}/products?${params.toString()}`;
    },
    [searchQuery, filters, sortOptions]
  );

  // Fetch products with pagination
  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(page === 1);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(buildApiUrl(page), {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: PaginatedResult<Product> = await response.json();

        if (append && productsData) {
          setProductsData((prev) =>
            prev
              ? {
                ...data,
                items: [...prev.items, ...data.items],
              }
              : data
          );
        } else {
          setProductsData(data);
        }

        setError("");
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An error occurred");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [buildApiUrl, productsData]
  );

  // Fetch all brands for filter
  const fetchBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const response = await fetch(`${getApiUrl()}/brands?limit=100`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.ok) {
        const data: PaginatedResult<Brand> = await response.json();
        setAllBrands(data.items);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setLoadingBrands(false);
    }
  }, [token]);

  // Debounced search
  const debouncedFetch = useMemo(
    () => debounce((page: number = 1) => fetchProducts(page, false), 300),
    [fetchProducts]
  );

  // Initial fetch and search/filter changes
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    debouncedFetch(1);
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle sort changes
  const handleSortChange = (
    sortBy: SortOptions["sortBy"],
    sortOrder: SortOptions["sortOrder"]
  ) => {
    setSortOptions({ sortBy, sortOrder });
    setShowSort(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      location: "",
      ownerId: "",
      brandId: "",
      gender: "",
      productType: "",
    });
    setSortOptions({ sortBy: "createdAt", sortOrder: "DESC" });
    setBrandSearchQuery("");
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  // Load more data
  const loadMore = () => {
    if (productsData && productsData.hasNextPage && !loadingMore) {
      fetchProducts(productsData.page + 1, true);
    }
  };

  // Render product item
  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <TouchableOpacity
      style={[styles.productContainer, { backgroundColor: cardBackground }]}
      onPress={() => router.push(`/products/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.productContent}>
        <View style={styles.productHeader}>
          <View style={styles.imageContainer}>
            {item.variants?.[0]?.variantImages?.[0] ? (
              <Image
                style={styles.productImage}
                source={{ uri: item.variants[0].variantImages[0] }}
                defaultSource={require("@/assets/images/placeholder-logo.png")}
              />
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: buttonColor },
                ]}
              >
                <Ionicons name="cube" size={24} color="white" />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text
              style={[styles.productName, { color: textColor }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.productDescription, { color: secondaryTextColor }]}
              numberOfLines={2}
            >
              {item.description || "No description available"}
            </Text>
            {item.price && (
              <View style={styles.priceContainer}>
                <Text
                  style={[styles.priceText, { color: buttonColor }]}
                >
                  ${item.price}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={secondaryTextColor}
            />
          </View>
        </View>

        <View style={[styles.productStats, { borderTopColor: borderColor }]}>
          <View style={styles.statItem}>
            <Ionicons
              name="pricetag-outline"
              size={16}
              color={secondaryTextColor}
            />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {item.brandName || item.brand?.name || "No Brand"}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={secondaryTextColor}
            />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render search bar
  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: cardBackground, borderColor },
      ]}
    >
      <Ionicons
        name="search"
        size={20}
        color={secondaryTextColor}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: textColor }]}
        placeholder="Search products..."
        placeholderTextColor={secondaryTextColor}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render filter and sort buttons
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: cardBackground, borderColor },
        ]}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="filter" size={16} color={buttonColor} />
        <Text style={[styles.controlButtonText, { color: buttonColor }]}>
          Filter
        </Text>
        {(filters.location ||
          filters.ownerId ||
          filters.brandId ||
          filters.gender ||
          filters.productType) && (
            <View
              style={[styles.filterBadge, { backgroundColor: buttonColor }]}
            />
          )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.controlButton,
          { backgroundColor: cardBackground, borderColor },
        ]}
        onPress={() => setShowSort(true)}
      >
        <Ionicons name="swap-vertical" size={16} color={buttonColor} />
        <Text style={[styles.controlButtonText, { color: buttonColor }]}>
          Sort
        </Text>
      </TouchableOpacity>

      {(searchQuery ||
        filters.location ||
        filters.ownerId ||
        filters.brandId ||
        filters.gender ||
        filters.productType) && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: "#FF3B30" }]}
            onPress={clearFilters}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={[styles.controlButtonText, { color: "white" }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalCancelText, { color: buttonColor }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: textColor }]}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalDoneText, { color: buttonColor }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.filterSection}>
            <View style={styles.filterHeaderWithSearch}>
              <Text style={[styles.filterLabel, { color: textColor }]}>
                Brand
              </Text>
              <View style={[styles.miniSearchContainer, { borderColor, backgroundColor: backgroundColor }]}>
                <Ionicons name="search" size={14} color={secondaryTextColor} />
                <TextInput
                  style={[styles.miniSearchInput, { color: textColor }]}
                  placeholder="Search brands..."
                  placeholderTextColor={secondaryTextColor}
                  value={brandSearchQuery}
                  onChangeText={setBrandSearchQuery}
                  autoCapitalize="none"
                />
                {brandSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setBrandSearchQuery("")}>
                    <Ionicons name="close-circle" size={14} color={secondaryTextColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.brandId && styles.activeFilterChip,
                  { borderColor },
                ]}
                onPress={() => handleFilterChange("brandId", "")}
              >
                <Text style={[styles.filterChipText, !filters.brandId && styles.activeFilterChipText]}>All</Text>
              </TouchableOpacity>
              {allBrands
                .filter(brand => brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()))
                .map((brand) => (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.filterChip,
                      filters.brandId === brand.id && styles.activeFilterChip,
                      { borderColor },
                    ]}
                    onPress={() => handleFilterChange("brandId", brand.id as any)}
                  >
                    <Text style={[styles.filterChipText, filters.brandId === brand.id && styles.activeFilterChipText]}>
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: textColor }]}>
              Gender
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.gender && styles.activeFilterChip,
                  { borderColor },
                ]}
                onPress={() => handleFilterChange("gender", "")}
              >
                <Text style={[styles.filterChipText, !filters.gender && styles.activeFilterChipText]}>All</Text>
              </TouchableOpacity>
              {Object.values(Gender).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.filterChip,
                    filters.gender === gender && styles.activeFilterChip,
                    { borderColor },
                  ]}
                  onPress={() => handleFilterChange("gender", gender)}
                >
                  <Text style={[styles.filterChipText, filters.gender === gender && styles.activeFilterChipText]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: textColor }]}>
              Product Type
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.productType && styles.activeFilterChip,
                  { borderColor },
                ]}
                onPress={() => handleFilterChange("productType", "")}
              >
                <Text style={[styles.filterChipText, !filters.productType && styles.activeFilterChipText]}>All</Text>
              </TouchableOpacity>
              {Object.values(ProductType).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filters.productType === type && styles.activeFilterChip,
                    { borderColor },
                  ]}
                  onPress={() => handleFilterChange("productType", type)}
                >
                  <Text style={[styles.filterChipText, filters.productType === type && styles.activeFilterChipText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: textColor }]}>
              Location
            </Text>
            <TextInput
              style={[
                styles.filterInput,
                {
                  backgroundColor: cardBackground,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Enter location..."
              placeholderTextColor={secondaryTextColor}
              value={filters.location}
              onChangeText={(text) => handleFilterChange("location", text)}
            />
          </View>

          {/* <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: textColor }]}>
              Owner ID
            </Text>
            <TextInput
              style={[
                styles.filterInput,
                {
                  backgroundColor: cardBackground,
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="Enter owner ID..."
              placeholderTextColor={secondaryTextColor}
              value={filters.ownerId}
              onChangeText={(text) => handleFilterChange("ownerId", text)}
              keyboardType="numeric"
            />
          </View> */}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render sort modal
  const renderSortModal = () => (
    <Modal
      visible={showSort}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSort(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setShowSort(false)}>
            <Text style={[styles.modalCancelText, { color: buttonColor }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: textColor }]}>Sort By</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {[
            { key: "name", label: "Name" },
            { key: "price", label: "Price" },
            { key: "createdAt", label: "Created Date" },
            { key: "updatedAt", label: "Updated Date" },
            { key: "brandName", label: "Brand Name" },
          ].map((option) => (
            <View key={option.key}>
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: borderColor }]}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "ASC")
                }
              >
                <Text style={[styles.sortOptionText, { color: textColor }]}>
                  {option.label} (A-Z)
                </Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "ASC" && (
                    <Ionicons name="checkmark" size={20} color={buttonColor} />
                  )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: borderColor }]}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "DESC")
                }
              >
                <Text style={[styles.sortOptionText, { color: textColor }]}>
                  {option.label} (Z-A)
                </Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "DESC" && (
                    <Ionicons name="checkmark" size={20} color={buttonColor} />
                  )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render pagination info
  const renderPaginationInfo = () => {
    if (!productsData) return null;

    return (
      <View style={styles.paginationInfo}>
        <Text style={[styles.paginationText, { color: secondaryTextColor }]}>
          Showing {productsData.items.length} of {productsData.total} products
        </Text>
        <Text style={[styles.paginationText, { color: secondaryTextColor }]}>
          Page {productsData.page} of {productsData.totalPages}
        </Text>
      </View>
    );
  };

  // Render load more button
  const renderLoadMore = () => {
    if (!productsData?.hasNextPage) return null;

    return (
      <TouchableOpacity
        style={[
          styles.loadMoreButton,
          { backgroundColor: cardBackground, borderColor },
        ]}
        onPress={loadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={buttonColor} />
        ) : (
          <>
            <Ionicons name="chevron-down" size={16} color={buttonColor} />
            <Text style={[styles.loadMoreText, { color: buttonColor }]}>
              Load More
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render header
  const renderHeader = () => {
    const isMyProducts = userRole === "brandOwner";
    const selectedBrandName = filters.brandId && allBrands.length > 0
      ? allBrands.find(b => b.id.toString() === filters.brandId!.toString())?.name
      : null;

    return (
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: textColor }]}>
          {isMyProducts ? "My Products" : "Products"}
        </Text>
        {selectedBrandName && (
          <View style={styles.brandFilterIndicator}>
            <Ionicons name="pricetag" size={14} color={buttonColor} />
            <Text style={[styles.brandFilterText, { color: buttonColor }]}>
              Filtering by: {selectedBrandName}
            </Text>
          </View>
        )}
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          {isMyProducts
            ? "Manage your brand's products"
            : "Discover and manage all products"
          }
        </Text>
      </View>
    );
  };

  // Render create button
  const renderCreateButton = () => {
    if (userRole !== "brandOwner") return null;

    return (
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: buttonColor }]}
        onPress={() => {
          Alert.alert(
            "Select Brand",
            "To add a new product, please navigate to the specific brand's page first.",
            [
              { text: "Go to Brands", onPress: () => router.push("/brands") },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[buttonColor, `${buttonColor}CC`]}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Add New Product</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={secondaryTextColor} />
      <Text style={[styles.emptyStateTitle, { color: textColor }]}>
        {searchQuery || filters.location || filters.ownerId || filters.brandId || filters.gender || filters.productType
          ? "No products found"
          : "No Products Yet"}
      </Text>
      <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
        {searchQuery || filters.location || filters.ownerId || filters.brandId || filters.gender || filters.productType
          ? "Try adjusting your search or filters"
          : "Add your first product to get started"}
      </Text>
      {(searchQuery || filters.location || filters.ownerId || filters.brandId || filters.gender || filters.productType) && (
        <TouchableOpacity
          style={[styles.clearFiltersButton, { backgroundColor: buttonColor }]}
          onPress={clearFilters}
        >
          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !productsData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={buttonColor} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (error && !productsData) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={[styles.errorTitle, { color: textColor }]}>
          Oops! Something went wrong
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: buttonColor }]}
          onPress={() => fetchProducts(1, false)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

      <FlatList
        data={productsData?.items || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderSearchBar()}
            {renderControls()}
            {renderCreateButton()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          <>
            {renderPaginationInfo()}
            {renderLoadMore()}
          </>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={buttonColor}
          />
        }
      />

      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  controlsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productContainer: {
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  productStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  createButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  paginationInfo: {
    alignItems: "center",
    paddingVertical: 16,
  },
  paginationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  brandFilterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 6,
  },
  brandFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  filterHeaderWithSearch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  miniSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    width: "60%",
  },
  miniSearchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 6,
    paddingVertical: 0,
  },
  filterChips: {
    flexDirection: "row",
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: "transparent",
  },
  activeFilterChip: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterChipText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  filterInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sortOptionText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProductsListScreen;
