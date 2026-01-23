import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import ProductCard from "@/components/ProductCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { Gender, ProductType, Season } from "@/types/enums";
import { useAuth } from "@/context/AuthContext";

// Filter interface
// interface ProductFilters {
//   search: string;
//   productType?: ProductType;
//   gender?: Gender;
//   season?: Season;
//   minPrice?: number;
//   maxPrice?: number;
//   tags?: string[];
//   material?: string;
//   inStock?: boolean;
//   onSale?: boolean;
//   featured?: boolean;
// }

// // Pagination interface
// interface PaginationInfo {
//   page: number;
//   limit: number;
//   total: number;
//   totalPages: number;
//   hasNext: boolean;
//   hasPrev: boolean;
// }

// // Sort options
// enum SortBy {
//   NAME_ASC = "name_asc",
//   NAME_DESC = "name_desc",
//   PRICE_ASC = "price_asc",
//   PRICE_DESC = "price_desc",
//   CREATED_DESC = "created_desc",
//   CREATED_ASC = "created_asc",
//   FEATURED = "featured",
// }

const BrandDetailScreen = () => {
  const router = useRouter();
  const { brandId, refresh } = useLocalSearchParams();
  const { token } = useAuth();
  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#e1e5e9", dark: "#38383a" },
    "text"
  );
  const primaryColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "tint"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#8E8E93", dark: "#8E8E93" },
    "text"
  );

  // State management
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filter state
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    inStock: undefined,
    onSale: undefined,
    featured: undefined,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.CREATED_DESC);

  // Available filter options (you might want to fetch these from API)
  const filterOptions = {
    productTypes: Object.values(ProductType),
    genders: Object.values(Gender),
    seasons: Object.values(Season),
    materials: ["Cotton", "Polyester", "Wool", "Silk", "Denim", "Leather"], // Example materials
  };

  const fetchBrandDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch brand details");
      }
      const data = await response.json();
      setBrand(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (reset) {
        setProductsLoading(true);
      }

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          sort: sortBy,
        });

        // Add filters to query
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.productType)
          queryParams.append("productType", filters.productType);
        if (filters.gender) queryParams.append("gender", filters.gender);
        if (filters.season) queryParams.append("season", filters.season);
        if (filters.minPrice)
          queryParams.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice)
          queryParams.append("maxPrice", filters.maxPrice.toString());
        if (filters.material) queryParams.append("material", filters.material);
        if (filters.inStock !== undefined)
          queryParams.append("inStock", filters.inStock.toString());
        if (filters.onSale !== undefined)
          queryParams.append("onSale", filters.onSale.toString());
        if (filters.featured !== undefined)
          queryParams.append("featured", filters.featured.toString());
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach((tag) => queryParams.append("tags", tag));
        }

        const response = await fetch(
          `${getApiUrl()}/brands/${brandId}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        if (reset || page === 1) {
          setProducts(data.products);
        } else {
          setProducts((prev) => [...prev, ...data.products]);
        }

        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProductsLoading(false);
        setRefreshing(false);
      }
    },
    [brandId, filters, sortBy, pagination.limit]
  );

  useEffect(() => {
    if (brandId) {
      fetchBrandDetails();
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      fetchProducts(1, true);
    }
  }, [fetchProducts]);

  useEffect(() => {
    if (refresh === "true") {
      fetchBrandDetails();
      fetchProducts(1, true);
      router.setParams({ refresh: "" });
    }
  }, [refresh]);

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchProducts(1, true);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      inStock: undefined,
      onSale: undefined,
      featured: undefined,
    });
    fetchProducts(1, true);
  };

  const loadMoreProducts = () => {
    if (pagination.hasNext && !productsLoading) {
      fetchProducts(pagination.page + 1, false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBrandDetails();
    fetchProducts(1, true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.productType) count++;
    if (filters.gender) count++;
    if (filters.season) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.material) count++;
    if (filters.inStock !== undefined) count++;
    if (filters.onSale !== undefined) count++;
    if (filters.featured !== undefined) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      padding: 20,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: backgroundColor,
    },
    brandHeader: {
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    brandLogo: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 15,
      borderWidth: 3,
      borderColor: borderColor,
    },
    brandName: {
      fontSize: 28,
      fontWeight: "700",
      color: textColor,
      marginBottom: 8,
      textAlign: "center",
    },
    brandDescription: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: "center",
      lineHeight: 22,
    },
    searchAndFilterContainer: {
      flexDirection: "row",
      marginBottom: 20,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: cardBackground,
      borderRadius: 12,
      paddingHorizontal: 15,
      height: 48,
      borderWidth: 1,
      borderColor: borderColor,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: textColor,
      marginLeft: 10,
    },
    filterButton: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      paddingHorizontal: 15,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: borderColor,
      flexDirection: "row",
    },
    filterButtonActive: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    filterButtonText: {
      color: textColor,
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 5,
    },
    filterButtonTextActive: {
      color: "#ffffff",
    },
    filterBadge: {
      backgroundColor: "#FF3B30",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 5,
    },
    filterBadgeText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },
    sortContainer: {
      marginBottom: 15,
    },
    sortContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
    },
    sortButton: {
      backgroundColor: cardBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    sortButtonActive: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    sortButtonText: {
      color: textColor,
      fontSize: 14,
    },
    sortButtonTextActive: {
      color: "#ffffff",
    },
    productsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    productsTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
    },
    productCount: {
      fontSize: 14,
      color: secondaryTextColor,
    },
    productsList: {
      paddingBottom: 20,
    },
    loadMoreButton: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 15,
      borderWidth: 1,
      borderColor: borderColor,
    },
    loadMoreText: {
      color: primaryColor,
      fontSize: 16,
      fontWeight: "500",
    },
    emptyProducts: {
      alignItems: "center",
      padding: 40,
      backgroundColor: cardBackground,
      borderRadius: 16,
      marginTop: 10,
    },
    emptyProductsText: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: "center",
      marginTop: 10,
    },
    // Filter Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      maxHeight: Dimensions.get("window").height * 0.8,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
    },
    modalCloseButton: {
      padding: 5,
    },
    filterSection: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
      marginBottom: 10,
    },
    filterOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    filterOption: {
      backgroundColor: backgroundColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    filterOptionActive: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    filterOptionText: {
      color: textColor,
      fontSize: 14,
    },
    filterOptionTextActive: {
      color: "#ffffff",
    },
    priceRangeContainer: {
      flexDirection: "row",
      gap: 10,
    },
    priceInput: {
      flex: 1,
      backgroundColor: backgroundColor,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: borderColor,
      color: textColor,
    },
    modalFooter: {
      flexDirection: "row",
      padding: 20,
      gap: 10,
    },
    resetButton: {
      flex: 1,
      backgroundColor: backgroundColor,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      borderWidth: 1,
      borderColor: borderColor,
    },
    resetButtonText: {
      color: textColor,
      fontSize: 16,
      fontWeight: "500",
    },
    applyButton: {
      flex: 1,
      backgroundColor: primaryColor,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
    },
    applyButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    createButton: {
      backgroundColor: primaryColor,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    createButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>{error}</Text>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>Brand not found.</Text>
      </View>
    );
  }

  const getOwnerInitials = (owner: any) => {
    if (!owner?.name) return "?";
    return owner.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
          />
        }
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          {brand.logo ? (
            <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
          ) : (
            <View
              style={[
                styles.brandLogo,
                {
                  backgroundColor: primaryColor,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 32, fontWeight: "700" }}
              >
                {brand.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.brandName}>{brand.name}</Text>
          {brand.description && (
            <Text style={styles.brandDescription}>{brand.description}</Text>
          )}
        </View>

        {/* Create Product Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push(`/products/create/${brand.id}`)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>Create New Product</Text>
        </TouchableOpacity>

        {/* Search and Filter */}
        <View style={styles.searchAndFilterContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={secondaryTextColor}
              value={filters.search}
              onChangeText={(text) => handleFilterChange("search", text)}
              onSubmitEditing={() => fetchProducts(1, true)}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options"
              size={20}
              color={activeFiltersCount > 0 ? "#ffffff" : textColor}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sort Options */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortContent}
        >
          {Object.entries({
            [SortBy.FEATURED]: "Featured",
            [SortBy.CREATED_DESC]: "Newest",
            [SortBy.CREATED_ASC]: "Oldest",
            [SortBy.PRICE_ASC]: "Price: Low to High",
            [SortBy.PRICE_DESC]: "Price: High to Low",
            [SortBy.NAME_ASC]: "Name: A-Z",
            [SortBy.NAME_DESC]: "Name: Z-A",
          }).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.sortButton,
                sortBy === key && styles.sortButtonActive,
              ]}
              onPress={() => {
                setSortBy(key as SortBy);
                fetchProducts(1, true);
              }}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === key && styles.sortButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Header */}
        <View style={styles.productsHeader}>
          <Text style={styles.productsTitle}>Products</Text>
          <Text style={styles.productCount}>
            {pagination.total} product{pagination.total !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Products List */}
        {products.length > 0 ? (
          <>
            <FlatList
              data={products}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => <ProductCard product={item} />}
              contentContainerStyle={styles.productsList}
              ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
              ListFooterComponent={() => (
                <>
                  {pagination.hasNext && (
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={loadMoreProducts}
                      disabled={productsLoading}
                    >
                      {productsLoading ? (
                        <ActivityIndicator size="small" color={primaryColor} />
                      ) : (
                        <Text style={styles.loadMoreText}>
                          Load More ({pagination.total - products.length}{" "}
                          remaining)
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            />
          </>
        ) : (
          <View style={styles.emptyProducts}>
            <Ionicons
              name="cube-outline"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={styles.emptyProductsText}>
              {activeFiltersCount > 0
                ? "No products found matching your filters."
                : "No products yet. Create your first product to get started!"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFilters(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Product Type</Text>
                <View style={styles.filterOptions}>
                  {filterOptions.productTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        filters.productType === type &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          "productType",
                          filters.productType === type ? undefined : type
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.productType === type &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gender Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Gender</Text>
                <View style={styles.filterOptions}>
                  {filterOptions.genders.map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.filterOption,
                        filters.gender === gender && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          "gender",
                          filters.gender === gender ? undefined : gender
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.gender === gender &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Season Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Season</Text>
                <View style={styles.filterOptions}>
                  {filterOptions.seasons.map((season) => (
                    <TouchableOpacity
                      key={season}
                      style={[
                        styles.filterOption,
                        filters.season === season && styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          "season",
                          filters.season === season ? undefined : season
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.season === season &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {season}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.priceRangeContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min Price"
                    placeholderTextColor={secondaryTextColor}
                    keyboardType="numeric"
                    value={filters.minPrice?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "minPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                  />
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max Price"
                    placeholderTextColor={secondaryTextColor}
                    keyboardType="numeric"
                    value={filters.maxPrice?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "maxPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                  />
                </View>
              </View>

              {/* Material Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Material</Text>
                <View style={styles.filterOptions}>
                  {filterOptions.materials.map((material) => (
                    <TouchableOpacity
                      key={material}
                      style={[
                        styles.filterOption,
                        filters.material === material &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        handleFilterChange(
                          "material",
                          filters.material === material ? undefined : material
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filters.material === material &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {material}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.inStock === true && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      handleFilterChange(
                        "inStock",
                        filters.inStock === true ? undefined : true
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.inStock === true &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      In Stock
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.onSale === true && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      handleFilterChange(
                        "onSale",
                        filters.onSale === true ? undefined : true
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.onSale === true &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      On Sale
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.featured === true && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      handleFilterChange(
                        "featured",
                        filters.featured === true ? undefined : true
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.featured === true &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      Featured
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BrandDetailScreen;
