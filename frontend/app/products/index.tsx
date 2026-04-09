import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";
import { Filters, PaginatedResult, SortOptions } from "@/types/filters";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { Brand } from "@/types/brand";
import { Gender, ProductType } from "@/types/enums";

const ProductsListScreen = () => {
  const { token, user } = useAuth();
  const { setSelectedBrandId } = useBrand();
  const colors = useThemeColors();
  const userRole = user?.role || user?.userRole;

  const [productsData, setProductsData] =
    useState<PaginatedResult<Product> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [allBrands, setAllBrands] = useState<Brand[]>([]);

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
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    if (urlBrandId) {
      setFilters((prev) => ({ ...prev, brandId: urlBrandId }));
      setSelectedBrandId(parseInt(urlBrandId));
    } else {
      setSelectedBrandId(null);
    }
  }, [urlBrandId]);

  const buildApiUrl = useCallback(
    (page: number = 1) => {
      const p = new URLSearchParams({
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
      return `${getApiUrl()}/products?${p.toString()}`;
    },
    [searchQuery, filters, sortOptions],
  );

  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(page === 1);
        else setLoadingMore(true);

        const response = await fetch(buildApiUrl(page), {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!response.ok) throw new Error("Failed to fetch products");

        const data: PaginatedResult<Product> = await response.json();
        if (append) {
          setProductsData((prev) =>
            prev ? { ...data, items: [...prev.items, ...data.items] } : data,
          );
        } else {
          setProductsData(data);
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [buildApiUrl],
  );

  const fetchBrands = useCallback(async () => {
    try {
      const endpoint = userRole === "admin" ? "/brands/admin" : "/brands";
      const response = await fetch(`${getApiUrl()}${endpoint}?limit=100`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (response.ok) {
        const data: PaginatedResult<Brand> = await response.json();
        setAllBrands(data.items);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
    }
  }, [token]);

  const debouncedFetch = useMemo(
    () => debounce((page: number = 1) => fetchProducts(page, false), 300),
    [fetchProducts],
  );

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    debouncedFetch(1);
    return () => { debouncedFetch.cancel(); };
  }, [debouncedFetch]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (
    sortBy: SortOptions["sortBy"],
    sortOrder: SortOptions["sortOrder"],
  ) => {
    setSortOptions({ sortBy, sortOrder });
    setShowSort(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ location: "", ownerId: "", brandId: "", gender: "", productType: "" });
    setSortOptions({ sortBy: "createdAt", sortOrder: "DESC" });
    setBrandSearchQuery("");
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(1, false);
  };

  const loadMore = () => {
    if (productsData?.hasNextPage && !loadingMore) {
      fetchProducts(productsData.page + 1, true);
    }
  };

  const hasActiveFilters =
    !!filters.location ||
    !!filters.ownerId ||
    !!filters.brandId ||
    !!filters.gender ||
    !!filters.productType;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  // ── Product card ─────────────────────────────────
  const renderProduct = ({ item }: { item: Product }) => {
    const image = item.images?.[0] || item.mainImage;
    const hasDiscount = item.salePrice != null && item.salePrice < item.price;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.push(`/products/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View
          style={[styles.cardImage, { backgroundColor: colors.surfaceRaised }]}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.cardImageInner}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="cube-outline" size={28} color={colors.textTertiary} />
          )}
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.cardDesc, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description || "No description"}
          </Text>

          <View style={styles.cardMeta}>
            {/* Brand */}
            <View style={styles.metaTag}>
              <Ionicons
                name="storefront-outline"
                size={11}
                color={colors.textTertiary}
              />
              <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
                {item.brandName || item.brand?.name || "—"}
              </Text>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              {hasDiscount && (
                <Text style={[styles.oldPrice, { color: colors.textTertiary }]}>
                  {formatCurrency(item.price)}
                </Text>
              )}
              <Text style={[styles.price, { color: colors.text }]}>
                {formatCurrency(hasDiscount ? item.salePrice! : item.price)}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "published"
                      ? colors.successSoft
                      : item.status === "draft"
                        ? colors.surfaceRaised
                        : colors.dangerSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "published"
                        ? colors.success
                        : item.status === "draft"
                          ? colors.textSecondary
                          : colors.danger,
                  },
                ]}
              >
                {item.status ?? "unknown"}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textTertiary}
          style={{ alignSelf: "center", marginLeft: 4 }}
        />
      </TouchableOpacity>
    );
  };

  // ── List header ──────────────────────────────────
  const renderHeader = () => {
    const isMine = userRole === "brandOwner";
    const selectedBrandName =
      filters.brandId && allBrands.length > 0
        ? allBrands.find((b) => b.id.toString() === filters.brandId!.toString())?.name
        : null;

    return (
      <View style={styles.listHeader}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceRaised }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        {/* Page title */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              {isMine ? "My Products" : "Products"}
            </Text>
            {selectedBrandName && (
              <View style={[styles.brandTag, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <Ionicons name="storefront-outline" size={12} color={colors.primary} />
                <Text style={[styles.brandTagText, { color: colors.primary }]}>
                  {selectedBrandName}
                </Text>
              </View>
            )}
          </View>
          {productsData && (
            <Text style={[styles.countLabel, { color: colors.textTertiary }]}>
              {productsData.total} items
            </Text>
          )}
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
          ]}
        >
          <View style={[styles.searchIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="search" size={14} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={[styles.clearBtn, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={12} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              {
                backgroundColor: hasActiveFilters ? colors.primarySoft : colors.surfaceRaised,
                borderColor: hasActiveFilters ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={hasActiveFilters ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.controlBtnText,
                { color: hasActiveFilters ? colors.primary : colors.text, fontWeight: hasActiveFilters ? "700" : "500" },
              ]}
            >
              Filters
            </Text>
            {hasActiveFilters && (
              <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              {
                backgroundColor:
                  sortOptions.sortOrder !== "DESC" || sortOptions.sortBy !== "createdAt"
                    ? colors.primarySoft
                    : colors.surfaceRaised,
                borderColor:
                  sortOptions.sortOrder !== "DESC" || sortOptions.sortBy !== "createdAt"
                    ? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => setShowSort(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={15}
              color={
                sortOptions.sortOrder !== "DESC" || sortOptions.sortBy !== "createdAt"
                  ? colors.primary
                  : colors.text
              }
            />
            <Text
              style={[
                styles.controlBtnText,
                {
                  color:
                    sortOptions.sortOrder !== "DESC" || sortOptions.sortBy !== "createdAt"
                      ? colors.primary
                      : colors.text,
                },
              ]}
            >
              Sort
            </Text>
          </TouchableOpacity>

          {(searchQuery || hasActiveFilters) && (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
              ]}
              onPress={clearFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
              <Text style={[styles.controlBtnText, { color: colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Create button — brand owners only */}
        {userRole === "brandOwner" && (
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() =>
              Alert.alert(
                "Select Brand",
                "Navigate to a brand's page to add a new product.",
                [
                  { text: "Go to Brands", onPress: () => router.push("/(tabs)/brands") },
                  { text: "Cancel", style: "cancel" },
                ],
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>
              Add New Product
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Footer ───────────────────────────────────────
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.footerLoaderText, { color: colors.textTertiary }]}>
            Loading more...
          </Text>
        </View>
      );
    }
    if (!productsData?.hasNextPage && (productsData?.items.length ?? 0) > 0) {
      return (
        <View style={[styles.endRow, { borderTopColor: colors.borderLight }]}>
          <View style={[styles.endDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={[styles.endText, { color: colors.textTertiary }]}>
            You've seen it all
          </Text>
          <View style={[styles.endDot, { backgroundColor: colors.textTertiary }]} />
        </View>
      );
    }
    return null;
  };

  // ── Empty state ──────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          {searchQuery || hasActiveFilters ? "No products found" : "No products yet"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          {searchQuery || hasActiveFilters
            ? "Try adjusting your search or filters"
            : "Add your first product to get started"}
        </Text>
        {(searchQuery || hasActiveFilters) && (
          <TouchableOpacity
            style={[styles.clearChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
            onPress={clearFilters}
          >
            <Text style={[styles.clearChipText, { color: colors.text }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Filter modal ─────────────────────────────────
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.filterSection}>
            <View style={styles.filterLabelRow}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Brand</Text>
              <View
                style={[
                  styles.miniSearch,
                  { borderColor: colors.border, backgroundColor: colors.surfaceRaised },
                ]}
              >
                <Ionicons name="search" size={13} color={colors.textTertiary} />
                <TextInput
                  style={[styles.miniSearchInput, { color: colors.text }]}
                  placeholder="Search brands..."
                  placeholderTextColor={colors.textTertiary}
                  value={brandSearchQuery}
                  onChangeText={setBrandSearchQuery}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {[{ id: "", name: "All" }, ...allBrands.filter((b) =>
                b.name.toLowerCase().includes(brandSearchQuery.toLowerCase()),
              )].map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.brandId === brand.id
                          ? colors.primary
                          : colors.surfaceRaised,
                      borderColor:
                        filters.brandId === brand.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleFilterChange("brandId", brand.id as string)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          filters.brandId === brand.id
                            ? colors.primaryForeground
                            : colors.textSecondary,
                        fontWeight: filters.brandId === brand.id ? "700" : "500",
                      },
                    ]}
                  >
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Gender */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Gender</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {["", ...Object.values(Gender)].map((g) => (
                <TouchableOpacity
                  key={g || "all"}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.gender === g ? colors.primary : colors.surfaceRaised,
                      borderColor: filters.gender === g ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleFilterChange("gender", g)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          filters.gender === g
                            ? colors.primaryForeground
                            : colors.textSecondary,
                        fontWeight: filters.gender === g ? "700" : "500",
                      },
                    ]}
                  >
                    {g || "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Product Type */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Product Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {["", ...Object.values(ProductType)].map((t) => (
                <TouchableOpacity
                  key={t || "all"}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        filters.productType === t ? colors.primary : colors.surfaceRaised,
                      borderColor: filters.productType === t ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleFilterChange("productType", t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          filters.productType === t
                            ? colors.primaryForeground
                            : colors.textSecondary,
                        fontWeight: filters.productType === t ? "700" : "500",
                      },
                    ]}
                  >
                    {t || "All"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Location */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Location</Text>
            <View
              style={[
                styles.textInputWrap,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}
            >
              <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
              <TextInput
                style={[styles.textInputField, { color: colors.text }]}
                placeholder="Enter location..."
                placeholderTextColor={colors.textTertiary}
                value={filters.location}
                onChangeText={(t) => handleFilterChange("location", t)}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ── Sort modal ───────────────────────────────────
  const SORT_OPTIONS = [
    { key: "name", label: "Name" },
    { key: "price", label: "Price" },
    { key: "createdAt", label: "Created Date" },
    { key: "updatedAt", label: "Updated Date" },
    { key: "brandName", label: "Brand Name" },
  ];

  const renderSortModal = () => (
    <Modal
      visible={showSort}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSort(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowSort(false)}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalScroll}>
          {SORT_OPTIONS.map((option) => (
            <View key={option.key}>
              {(["ASC", "DESC"] as const).map((order) => {
                const isActive =
                  sortOptions.sortBy === option.key && sortOptions.sortOrder === order;
                return (
                  <TouchableOpacity
                    key={order}
                    style={[
                      styles.sortRow,
                      {
                        borderBottomColor: colors.borderLight,
                        backgroundColor: isActive ? colors.primarySoft : "transparent",
                      },
                    ]}
                    onPress={() =>
                      handleSortChange(option.key as SortOptions["sortBy"], order)
                    }
                  >
                    <Text style={[styles.sortLabel, { color: isActive ? colors.primary : colors.text }]}>
                      {option.label}{" "}
                      <Text style={{ color: colors.textTertiary }}>
                        ({order === "ASC" ? "A–Z" : "Z–A"})
                      </Text>
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // ── Loading / Error states ───────────────────────
  if (loading && !productsData) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !productsData) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => fetchProducts(1, false)}
        >
          <Text style={[styles.retryBtnText, { color: colors.primaryForeground }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.surface }]}>
      <FlatList
        data={productsData?.items || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {renderFilterModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: { padding: 2, marginBottom: 8 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // ── List header ─────────────────────────────────
  listHeader: {
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 0.5,
    alignSelf: "flex-start",
  },
  brandTagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  countLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
  },

  // ── Search ──────────────────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 0,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Controls ────────────────────────────────────
  controlsRow: {
    flexDirection: "row",
    gap: 8,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  controlBtnText: {
    fontSize: 13,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    marginLeft: 2,
  },

  // ── Create button ────────────────────────────────
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 0,
    marginTop: 4,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Product card ─────────────────────────────────
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 0,
    borderWidth: 0.5,
    marginTop: 10,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  cardImageInner: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  oldPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // ── Footer ──────────────────────────────────────
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {
    fontSize: 13,
  },
  endRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
    borderTopWidth: 0.5,
    marginTop: 8,
  },
  endDot: {
    width: 4,
    height: 4,
    borderRadius: 0,
  },
  endText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // ── Empty state ──────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  clearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0.5,
    marginTop: 8,
  },
  clearChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Loading / Error ──────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorSub: {
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 0,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Modals ───────────────────────────────────────
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalCancel: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalDone: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  filterSection: {
    gap: 10,
  },
  filterLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  miniSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 0.5,
    width: "58%",
  },
  miniSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  chipsScroll: {
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0.5,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
  },
  textInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  sortLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});

export default ProductsListScreen;
