import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import FilterPanel, { PanelFilters } from "@/components/FilterPanel";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";
import { Brand } from "@/types/brand";
import { useThemeColors } from "@/hooks/useThemeColor";
import AutoSwipeImages from "@/components/AutoSwipeImages";

// ── Category definitions ──────────────────────────────
const CATEGORIES = [
  { key: "Shoes", label: "Shoes", icon: "footsteps-outline" as const },
  { key: "Hoodies", label: "Hoodies", icon: "shirt-outline" as const },
  { key: "Shirts", label: "Shirts", icon: "shirt-outline" as const },
  {
    key: "Accessories",
    label: "Accessories",
    icon: "watch-outline" as const,
  },
  { key: "Pants", label: "Pants", icon: "man-outline" as const },
  { key: "Jackets", label: "Jackets", icon: "cloudy-outline" as const },
  { key: "Bags", label: "Bags", icon: "bag-handle-outline" as const },
  { key: "Hats", label: "Hats", icon: "ribbon-outline" as const },
];

const GENDERS = ["All", "Men", "Women"];

// ── Compact Product Card ──────────────────────────────
const CompactProductCard = React.memo(
  ({
    item,
    index,
    colors,
    onPress,
    onWishlistPress,
    isInWishlist,
  }: {
    item: Product;
    index: number;
    colors: any;
    onPress: () => void;
    onWishlistPress: () => void;
    isInWishlist: boolean;
  }) => {
    const [imageWidth, setImageWidth] = useState(0);
    const cardGap = 12;

    // Use product images if available, else first variant's images (don't mix across variants)
    const cardImages: string[] = item.images?.length
      ? item.images
      : item.variants?.[0]?.images?.length
        ? item.variants[0].images
        : item.mainImage
          ? [item.mainImage]
          : [];

    const hasDiscount = item.salePrice != null && item.salePrice < item.price;
    const discountPct = hasDiscount
      ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
      : 0;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

    return (
      <View
        style={[
          cardStyles.wrapper,
          index % 2 === 0
            ? { marginRight: cardGap / 2 }
            : { marginLeft: cardGap / 2 },
        ]}
      >
        <Pressable
          style={[
            cardStyles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
          onPress={onPress}
        >
          <View
            style={[
              cardStyles.imageBox,
              { backgroundColor: colors.surfaceRaised },
            ]}
            onLayout={(e) => setImageWidth(e.nativeEvent.layout.width)}
          >
            {imageWidth > 0 && (
              <AutoSwipeImages
                images={cardImages}
                width={imageWidth}
                height={170}
              />
            )}

            {/* Wishlist Heart */}
            <TouchableOpacity
              style={[
                cardStyles.heartBtn,
                {
                  backgroundColor: isInWishlist
                    ? colors.dangerSoft
                    : colors.surface,
                },
              ]}
              onPress={onWishlistPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isInWishlist ? "heart" : "heart-outline"}
                size={15}
                color={colors.wishlistHeart}
              />
            </TouchableOpacity>

            {/* Discount Badge */}
            {hasDiscount && (
              <View
                style={[
                  cardStyles.discountBadge,
                  { backgroundColor: colors.discountBadge },
                ]}
              >
                <Text style={[cardStyles.discountText, { color: colors.textInverse }]}>-{discountPct}%</Text>
              </View>
            )}
          </View>

          <View style={cardStyles.content}>
              <Text
                style={[cardStyles.brandLabel, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {item.brand?.name || item.brandName || "Local Brand"}
              </Text>

              <Text
                style={[cardStyles.productName, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              {/* Price row */}
              <View style={cardStyles.priceRow}>
                <Text
                  style={[cardStyles.price, { color: colors.priceCurrent }]}
                >
                  {formatCurrency(hasDiscount ? item.salePrice! : item.price)}
                </Text>
                {hasDiscount && (
                  <Text
                    style={[
                      cardStyles.originalPrice,
                      { color: colors.priceOriginal },
                    ]}
                  >
                    {formatCurrency(item.price)}
                  </Text>
                )}
              </View>
          </View>
        </Pressable>
      </View>
    );
  },
);

// ── Main Shop Screen ──────────────────────────────────
const ShopScreen = () => {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const colors = useThemeColors();
  const { token, loading, user } = useAuth();
  const { showToast } = useToast();

  // ── State ─────────────────────────────────────────
  const [selectedGender, setSelectedGender] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { text: string; type: "Product" | "Brand" }[]
  >([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    brandIds: [] as string[],
    sortBy: "createdAt",
    sortOrder: "DESC" as "ASC" | "DESC",
    priceMin: 0,
    priceMax: 500,
    inStockOnly: false,
    followedBrandsOnly: false,
  });
  const [filterLabels, setFilterLabels] = useState<{
    brands: Record<string, string>;
    sort?: string;
  }>({ brands: {} });
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    productTypes: [] as string[],
  });
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // ── Derived values ──────────────────────────────────
  const hasPriceFilter =
    activeFilters.priceMin > 0 || activeFilters.priceMax < 500;
  const activeFilterCount =
    (activeFilters.categories.length > 0 ? 1 : 0) +
    (activeFilters.brandIds.length > 0 ? 1 : 0) +
    (hasPriceFilter ? 1 : 0) +
    (activeFilters.inStockOnly ? 1 : 0);
  const hasActiveChips =
    activeFilters.categories.length > 0 ||
    activeFilters.brandIds.length > 0 ||
    activeFilters.sortBy !== "createdAt" ||
    activeFilters.sortOrder !== "DESC" ||
    hasPriceFilter ||
    activeFilters.inStockOnly;

  // ── Build fetch function for infinite scroll ──────
  const fetchProducts = useCallback(
    async (page: number) => {
      const params = new URLSearchParams();
      params.set("limit", "12");
      params.set("page", page.toString());
      params.set("status", "published");

      if (searchQuery) params.set("search", searchQuery);
      if (selectedGender !== "All")
        params.set("gender", selectedGender.toLowerCase());

      activeFilters.categories.forEach((c) =>
        params.append("productTypes", c),
      );
      activeFilters.brandIds.forEach((id) => params.append("brandIds", id));
      params.set("sortBy", activeFilters.sortBy);
      params.set("sortOrder", activeFilters.sortOrder);

      if (activeFilters.priceMin > 0)
        params.set("minPrice", activeFilters.priceMin.toString());
      if (activeFilters.priceMax < 500)
        params.set("maxPrice", activeFilters.priceMax.toString());
      if (activeFilters.inStockOnly)
        params.set("inStock", "true");

      const res = await fetch(
        `${getApiUrl()}/products?${params.toString()}`,
        {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      if (data.total != null) setTotalCount(data.total);
      else if (data.totalItems != null) setTotalCount(data.totalItems);
      return { items: data.items || [], totalPages: data.totalPages || 1 };
    },
    [searchQuery, selectedGender, activeFilters, token],
  );

  const {
    items: products,
    loading: productsLoading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    reset,
  } = useInfiniteScroll<Product>({ fetchFn: fetchProducts });

  // ── Reset + reload when filters/search/gender change ──
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadMore();
      return;
    }
    const timeout = setTimeout(
      () => {
        reset();
      },
      searchQuery ? 300 : 0,
    );
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedGender, activeFilters]);

  // When reset completes (items become empty, page back to 1), trigger loadMore
  const prevProductsLength = useRef(products.length);
  useEffect(() => {
    if (
      prevProductsLength.current > 0 &&
      products.length === 0 &&
      !productsLoading
    ) {
      loadMore();
    }
    prevProductsLength.current = products.length;
  }, [products.length, productsLoading]);

  // ── Fetch filter options ──────────────────────────
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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/brands?limit=50`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (res.ok) {
          const data = await res.json();
          setFeaturedBrands(data.items || []);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, [token]);

  // ── Wishlist ──────────────────────────────────────
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

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [token]),
  );

  // Apply category filter from navigation params
  useEffect(() => {
    if (category) {
      setActiveFilters((prev) => ({ ...prev, categories: [category] }));
    }
  }, [category]);

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

  // ── Add to cart ───────────────────────────────────
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

  // ── Search suggestions ────────────────────────────
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const productSuggestions = products
        .filter((p) => p.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 3)
        .map((p) => ({ text: p.name, type: "Product" as const }));
      const brandSuggestions = featuredBrands
        .filter((b) => b.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 2)
        .map((b) => ({ text: b.name, type: "Brand" as const }));
      setSuggestions([...productSuggestions, ...brandSuggestions]);
    } else {
      setSuggestions([]);
    }
  };

  // ── Filter handlers ───────────────────────────────
  const handleFilterPress = (
    type: string,
    values: string[],
    labels?: string[],
  ) => {
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

  const handlePanelApply = (filters: PanelFilters) => {
    handleFilterPress("category", filters.categories, filters.categories);
    const brandLabels = filters.brands.map((id) => {
      const brand = featuredBrands.find((b) => b.id.toString() === id);
      return brand?.name ?? id;
    });
    handleFilterPress("brand", filters.brands, brandLabels);

    // Build sort label
    let sortLabel = "Newest First";
    if (filters.sortBy === "price" && filters.sortOrder === "ASC")
      sortLabel = "Price: Low–High";
    else if (filters.sortBy === "price" && filters.sortOrder === "DESC")
      sortLabel = "Price: High–Low";
    else if (filters.sortOrder === "ASC") sortLabel = "Oldest First";

    setActiveFilters((prev) => ({
      ...prev,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      inStockOnly: filters.inStockOnly,
      followedBrandsOnly: filters.followedBrandsOnly,
    }));
    setFilterLabels((l) => ({ ...l, sort: sortLabel }));
  };

  const panelActiveFilters: PanelFilters = {
    categories: activeFilters.categories,
    brands: activeFilters.brandIds,
    sortBy: activeFilters.sortBy,
    sortOrder: activeFilters.sortOrder,
    priceMin: activeFilters.priceMin ?? 0,
    priceMax: activeFilters.priceMax ?? 500,
    inStockOnly: activeFilters.inStockOnly,
    followedBrandsOnly: activeFilters.followedBrandsOnly,
  };

  const toggleCategory = (key: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(key)
        ? prev.categories.filter((c) => c !== key)
        : [...prev.categories, key],
    }));
  };

  // ── Render helpers ────────────────────────────────
  const renderProductCard = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <CompactProductCard
        item={item}
        index={index}
        colors={colors}
        onPress={() => router.push(`/products/${item.id}` as any)}
        onWishlistPress={() => {
          if (!token) {
            router.push("/auth/login" as any);
          } else {
            toggleWishlist(item.id);
          }
        }}
        isInWishlist={!!(token && wishlistProductIds.includes(item.id))}
      />
    ),
    [colors, token, wishlistProductIds, toggleWishlist, router],
  );

  const renderListHeader = () => (
    <View>
      {/* Gender Toggle Tabs */}
      <View style={styles.genderRow}>
        {GENDERS.map((g) => {
          const isActive = selectedGender === g;
          const isAll = g === "All";
          return (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderPill,
                isAll && styles.genderPillSmall,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceRaised,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedGender(g)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.genderPillText,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.textSecondary,
                  },
                  isActive && styles.genderPillTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Separator */}
      <View
        style={[styles.separator, { backgroundColor: colors.border }]}
      />

      {/* Category Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeFilters.categories.includes(cat.key);
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceRaised,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggleCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={
                  isActive ? colors.primaryForeground : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.categoryPillText,
                  {
                    color: isActive ? colors.primaryForeground : colors.text,
                  },
                  isActive && styles.categoryPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Separator */}
      <View
        style={[styles.separator, { backgroundColor: colors.border }]}
      />

      {/* Filter + Sort Bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterBarLeft}>
          {/* Filters Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilterCount > 0
                    ? colors.primarySoft
                    : colors.surfaceRaised,
                borderColor:
                  activeFilterCount > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setIsPanelVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: activeFilterCount > 0 ? colors.primary : colors.text,
                  fontWeight: activeFilterCount > 0 ? "700" : "500",
                },
              ]}
            >
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sort Button */}
          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor:
                  activeFilters.sortOrder !== "DESC"
                    ? colors.primarySoft
                    : colors.surfaceRaised,
                borderColor:
                  activeFilters.sortOrder !== "DESC"
                    ? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => {
              setActiveFilters((prev) => ({
                ...prev,
                sortOrder: prev.sortOrder === "DESC" ? "ASC" : "DESC",
              }));
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              color={
                activeFilters.sortOrder !== "DESC"
                  ? colors.primary
                  : colors.text
              }
            />
            <Text
              style={[
                styles.sortButtonText,
                {
                  color:
                    activeFilters.sortOrder !== "DESC"
                      ? colors.primary
                      : colors.text,
                },
              ]}
            >
              {activeFilters.sortOrder === "DESC" ? "Newest" : "Oldest"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Count */}
        <Text style={[styles.resultsCount, { color: colors.textTertiary }]}>
          {totalCount > 0
            ? `${totalCount} items`
            : products.length > 0
              ? `${products.length}+ items`
              : ""}
        </Text>
      </View>

      {/* Active Filter Chips — color-coded by type */}
      {hasActiveChips && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsContent}
        >
          {/* Category chips — indigo */}
          {activeFilters.categories.map((cat) => (
            <View
              key={`cat-${cat}`}
              style={[
                styles.activeChip,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={11}
                color={colors.primary}
              />
              <Text
                style={[styles.activeChipText, { color: colors.primary }]}
              >
                {cat}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    categories: prev.categories.filter((c) => c !== cat),
                  }));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Brand chips */}
          {activeFilters.brandIds.map((id) => (
            <View
              key={`brand-${id}`}
              style={[
                styles.activeChip,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={11}
                color={colors.primary}
              />
              <Text
                style={[styles.activeChipText, { color: colors.primary }]}
              >
                {filterLabels.brands[id] || id}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    brandIds: prev.brandIds.filter((b) => b !== id),
                  }));
                  setFilterLabels((l) => {
                    const newBrands = { ...l.brands };
                    delete newBrands[id];
                    return { ...l, brands: newBrands };
                  });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Sort chip */}
          {(activeFilters.sortBy !== "createdAt" ||
            activeFilters.sortOrder !== "DESC") && (
            <View
              style={[
                styles.activeChip,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={11}
                color={colors.primary}
              />
              <Text
                style={[styles.activeChipText, { color: colors.primary }]}
              >
                {filterLabels.sort || "Oldest First"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    sortBy: "createdAt",
                    sortOrder: "DESC",
                  }));
                  setFilterLabels((l) => ({ ...l, sort: undefined }));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Price chip */}
          {hasPriceFilter && (
            <View
              style={[
                styles.activeChip,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={11}
                color={colors.primary}
              />
              <Text
                style={[styles.activeChipText, { color: colors.primary }]}
              >
                ${activeFilters.priceMin} – ${activeFilters.priceMax}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    priceMin: 0,
                    priceMax: 500,
                  }));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderListFooter = () => {
    if (productsLoading && products.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[styles.footerLoaderText, { color: colors.textTertiary }]}
          >
            Loading more...
          </Text>
        </View>
      );
    }

    if (!hasMore && products.length > 0) {
      return (
        <View
          style={[
            styles.endOfContent,
            { borderTopColor: colors.borderLight },
          ]}
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
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (productsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="cube-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
          No products found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          Try adjusting your filters or search
        </Text>
      </View>
    );
  };

  // ── Loading state ─────────────────────────────────
  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.surface }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
    >
      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.searchIconWrap,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="search" size={14} color={colors.primary} />
          </View>
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                handleSearchChange("");
              }}
              style={[styles.clearBtn, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={12} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && searchQuery.length > 0 && (
          <View
            style={[
              styles.suggestionBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            {suggestions.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: colors.borderLight },
                ]}
                onPress={() => {
                  setSearchQuery(item.text);
                  handleSearchChange(item.text);
                  setSuggestions([]);
                }}
              >
                <View style={styles.suggestionLeft}>
                  <View
                    style={[styles.suggestionIconCircle, { backgroundColor: colors.primarySoft }]}
                  >
                    <Ionicons
                      name={
                        item.type === "Product"
                          ? "cube-outline"
                          : "storefront-outline"
                      }
                      size={13}
                      color={colors.text}
                    />
                  </View>
                  <Text
                    style={[styles.suggestionText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.text}
                  </Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        item.type === "Brand"
                          ? colors.primarySoft
                          : colors.successSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      {
                        color:
                          item.type === "Brand"
                            ? colors.primary
                            : colors.success,
                      },
                    ]}
                  >
                    {item.type}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Main Product List with infinite scroll */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={() => {
          if (hasMore && !productsLoading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      />

      {/* Filter Panel Modal */}
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
    </View>
  );
};

// ── Compact Product Card Styles ─────────────────────
const cardStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginBottom: 12,
  },
  card: {
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageBox: {
    position: "relative",
    height: 170,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 14,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  content: {
    padding: 10,
    gap: 3,
  },
  brandLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
});

// ── Main Screen Styles ──────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingLeft: 6,
    paddingRight: 14,
    height: 44,
    borderWidth: 1,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionBox: {
    position: "absolute",
    top: 62,
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    maxHeight: 280,
    overflow: "hidden",
    zIndex: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  suggestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  suggestionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Gender Toggle ──────────────────────────
  genderRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  genderPill: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  genderPillSmall: {
    flex: 0.5,
  },
  genderPillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  genderPillTextActive: {
    fontWeight: "700",
  },

  // ── Separator ────────────────────────────
  separator: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 6,
  },

  // ── Category Horizontal Scroll ──────────────
  categoryScroll: {
    marginTop: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  categoryPillTextActive: {
    fontWeight: "700",
  },

  // ── Filter + Sort Bar ───────────────────────
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Active Filter Chips ─────────────────────
  activeChipsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 4,
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Grid ───────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  gridRow: {
    justifyContent: "flex-start",
  },

  // ── Footer ─────────────────────────────────
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    fontWeight: "500",
  },
  endOfContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 12,
    borderTopWidth: 1,
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

  // ── Empty State ────────────────────────────
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
});

export default ShopScreen;
