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

const CATEGORIES = [
  "ALL",
  "JACKETS",
  "SHIRTS",
  "TROUSERS",
  "SHOES",
  "KNITWEAR",
  "ACCESSORIES",
  "BAGS",
  "HOODIES",
];

const GENDERS = ["All", "Men", "Women"];

// ── Monolith Product Card ────────────────────────────
const MonolithProductCard = React.memo(
  ({
    item,
    index,
    onPress,
    onWishlistPress,
    isInWishlist,
  }: {
    item: Product;
    index: number;
    onPress: () => void;
    onWishlistPress: () => void;
    isInWishlist: boolean;
  }) => {
    const images: string[] = item.images?.length
      ? item.images
      : item.mainImage
        ? [item.mainImage]
        : [];
    const imageUri = images[0] ?? null;

    const hasDiscount = item.salePrice != null && item.salePrice < item.price;

    const formatPrice = (amount: number) =>
      `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

    return (
      <TouchableOpacity
        style={[
          cardStyles.wrapper,
          index % 2 === 0 ? { paddingRight: 8 } : { paddingLeft: 8 },
        ]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Image */}
        <View style={cardStyles.imageWrap}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={cardStyles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={cardStyles.imagePlaceholder} />
          )}

          {/* LIMITED STOCK badge */}
          {hasDiscount && (
            <View style={cardStyles.limitedBadge}>
              <Text style={cardStyles.limitedBadgeText}>LIMITED STOCK</Text>
            </View>
          )}

          {/* Heart */}
          <TouchableOpacity
            style={cardStyles.heartBtn}
            onPress={onWishlistPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isInWishlist ? "heart" : "heart-outline"}
              size={16}
              color={isInWishlist ? "#C41E3A" : "#ffffff"}
            />
          </TouchableOpacity>
        </View>

        {/* Meta */}
        <View style={cardStyles.meta}>
          <Text style={cardStyles.brandLabel} numberOfLines={1}>
            {(item.brand?.name || item.brandName || "MONOLITH").toUpperCase()}
          </Text>
          <Text style={cardStyles.productName} numberOfLines={2}>
            {item.name.toUpperCase()}
          </Text>
          <View style={cardStyles.priceRow}>
            <Text style={cardStyles.price}>
              {formatPrice(hasDiscount ? item.salePrice! : item.price)}
            </Text>
            {hasDiscount && (
              <Text style={cardStyles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

// ── Main Shop Screen ──────────────────────────────────
const ShopScreen = () => {
  const router = useRouter();
  const { category, gender } = useLocalSearchParams<{
    category?: string;
    gender?: string;
  }>();
  const { token, loading } = useAuth();
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────
  // Initialize gender directly from param so first fetch uses it
  const [selectedGender, setSelectedGender] = useState<string>(() => {
    if (gender) {
      const n =
        gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      if (GENDERS.includes(n)) return n;
    }
    return "All";
  });

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

  // ── Derived ────────────────────────────────────────
  const hasPriceFilter =
    activeFilters.priceMin > 0 || activeFilters.priceMax < 500;
  const activeFilterCount =
    (activeFilters.categories.length > 0 ? 1 : 0) +
    (activeFilters.brandIds.length > 0 ? 1 : 0) +
    (hasPriceFilter ? 1 : 0) +
    (activeFilters.inStockOnly ? 1 : 0);

  // ── Fetch products ─────────────────────────────────
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
      if (activeFilters.inStockOnly) params.set("inStock", "true");

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

  // ── Reset on filter/search/gender change ───────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadMore();
      return;
    }
    const timeout = setTimeout(() => reset(), searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedGender, activeFilters]);

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

  // ── Filter options ─────────────────────────────────
  useEffect(() => {
    fetch(`${getApiUrl()}/products/filters`)
      .then((r) => r.ok && r.json())
      .then((data) => data && setFilterOptions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${getApiUrl()}/brands?limit=50`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
      .then((r) => r.ok && r.json())
      .then((data) => data && setFeaturedBrands(data.items || []))
      .catch(() => {});
  }, [token]);

  // ── Apply category from nav param ─────────────────
  useEffect(() => {
    if (category) {
      setActiveFilters((prev) => ({ ...prev, categories: [category] }));
    }
  }, [category]);

  // ── Apply gender from nav param (handles tab re-navigation) ──
  useEffect(() => {
    if (gender) {
      const n = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      if (GENDERS.includes(n)) setSelectedGender(n);
    }
  }, [gender]);

  // ── Wishlist ───────────────────────────────────────
  const fetchWishlist = useCallback(async () => {
    if (!token) return setWishlistProductIds([]);
    try {
      const r = await fetch(`${getApiUrl()}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setWishlistProductIds(data.map((i: any) => i.product.id));
      }
    } catch {}
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [token]),
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!token) return;
      try {
        const r = await fetch(
          `${getApiUrl()}/wishlist/toggle/${productId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (r.ok) {
          setWishlistProductIds((prev) =>
            prev.includes(productId)
              ? prev.filter((id) => id !== productId)
              : [...prev, productId],
          );
        }
      } catch {}
    },
    [token],
  );

  // ── Search suggestions ─────────────────────────────
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const ps = products
        .filter((p) => p.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 3)
        .map((p) => ({ text: p.name, type: "Product" as const }));
      const bs = featuredBrands
        .filter((b) => b.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 2)
        .map((b) => ({ text: b.name, type: "Brand" as const }));
      setSuggestions([...ps, ...bs]);
    } else {
      setSuggestions([]);
    }
  };

  // ── Filter handlers ────────────────────────────────
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
      values.forEach((id, i) => { map[id] = labels?.[i] ?? id; });
      setFilterLabels((l) => ({ ...l, brands: map }));
    }
  };

  const handlePanelApply = (filters: PanelFilters) => {
    // Single state update to avoid multiple resets
    const brandLabelMap: Record<string, string> = {};
    filters.brands.forEach((id) => {
      const brand = featuredBrands.find((b) => b.id.toString() === id);
      brandLabelMap[id] = brand?.name ?? id;
    });

    let sortLabel = "Newest First";
    if (filters.sortBy === "price" && filters.sortOrder === "ASC")
      sortLabel = "Price: Low–High";
    else if (filters.sortBy === "price" && filters.sortOrder === "DESC")
      sortLabel = "Price: High–Low";
    else if (filters.sortOrder === "ASC") sortLabel = "Oldest First";

    setActiveFilters({
      categories: filters.categories,
      brandIds: filters.brands,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      inStockOnly: filters.inStockOnly,
      followedBrandsOnly: filters.followedBrandsOnly,
    });
    setFilterLabels({ brands: brandLabelMap, sort: sortLabel });
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
    if (key === "ALL") {
      setActiveFilters((prev) => ({ ...prev, categories: [] }));
      return;
    }
    const normalized =
      key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    setActiveFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(normalized)
        ? prev.categories.filter((c) => c !== normalized)
        : [...prev.categories, normalized],
    }));
  };

  // ── Render helpers ────────────────────────────────
  const renderProductCard = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <MonolithProductCard
        item={item}
        index={index}
        onPress={() => router.push(`/products/${item.id}` as any)}
        onWishlistPress={() => {
          if (!token) router.push("/auth/login" as any);
          else toggleWishlist(item.id);
        }}
        isInWishlist={!!(token && wishlistProductIds.includes(item.id))}
      />
    ),
    [token, wishlistProductIds, toggleWishlist, router],
  );

  const renderListHeader = () => (
    <View>
      {/* ── Gender tabs ────────────────────────────── */}
      <View style={styles.genderRow}>
        {GENDERS.map((g) => {
          const isActive = selectedGender === g;
          return (
            <TouchableOpacity
              key={g}
              style={[styles.genderTab, isActive && styles.genderTabActive]}
              onPress={() => setSelectedGender(g)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.genderTabText,
                  isActive && styles.genderTabTextActive,
                ]}
              >
                {g.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Category chips ─────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryScrollWrap}
      >
        {CATEGORIES.map((cat) => {
          const isAll = cat === "ALL";
          const isActive = isAll
            ? activeFilters.categories.length === 0
            : activeFilters.categories.includes(
                cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(),
              );
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => toggleCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Filter bar ─────────────────────────────── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilterCount > 0 && styles.filterBtnActive,
          ]}
          onPress={() => setIsPanelVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={activeFilterCount > 0 ? "#ffffff" : "#000000"}
          />
          <Text
            style={[
              styles.filterBtnText,
              activeFilterCount > 0 && styles.filterBtnTextActive,
            ]}
          >
            FILTERS
          </Text>
          {activeFilterCount > 0 && (
            <Text style={styles.filterBtnBadge}>{activeFilterCount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() =>
            setActiveFilters((prev) => ({
              ...prev,
              sortOrder: prev.sortOrder === "DESC" ? "ASC" : "DESC",
            }))
          }
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical-outline" size={14} color="#000000" />
          <Text style={styles.filterBtnText}>
            {activeFilters.sortOrder === "DESC" ? "NEWEST" : "OLDEST"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.resultsCount}>
          {totalCount > 0
            ? `${totalCount} ITEMS`
            : products.length > 0
              ? `${products.length}+ ITEMS`
              : ""}
        </Text>
      </View>

      {/* ── Active filter chips ────────────────────── */}
      {activeFilters.categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeChipsScroll}
        >
          {activeFilters.categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.activeChip}
              onPress={() =>
                setActiveFilters((prev) => ({
                  ...prev,
                  categories: prev.categories.filter((c) => c !== cat),
                }))
              }
            >
              <Text style={styles.activeChipText}>{cat.toUpperCase()}</Text>
              <Ionicons name="close" size={10} color="#000000" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderListFooter = () => {
    if (productsLoading && products.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#000000" />
        </View>
      );
    }
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.endRow}>
          <View style={styles.endLine} />
          <Text style={styles.endText}>END OF RESULTS</Text>
          <View style={styles.endLine} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (productsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>NO PRODUCTS FOUND</Text>
        <Text style={styles.emptySubtitle}>
          ADJUST YOUR FILTERS OR SEARCH TERMS
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {/* ── Search bar ─────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color="#777777" />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH PRODUCTS, BRANDS..."
            placeholderTextColor="#aaaaaa"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => { setSearchQuery(""); setSuggestions([]); }}
            >
              <Ionicons name="close" size={16} color="#777777" />
            </Pressable>
          )}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && searchQuery.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.suggestionItem,
                  index < suggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => {
                  setSearchQuery(item.text);
                  handleSearchChange(item.text);
                  setSuggestions([]);
                }}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item.text.toUpperCase()}
                </Text>
                <Text style={styles.suggestionType}>{item.type.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Product grid ──────────────────────────── */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={() => {
          if (hasMore && !productsLoading) loadMore();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#000000" />
        }
      />

      {/* ── Filter Panel ──────────────────────────── */}
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

// ── Card Styles ──────────────────────────────────────
const cardStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    marginBottom: 48,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#f3f3f4",
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eeeeee",
  },
  limitedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#C41E3A",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  limitedBadgeText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 8,
    color: "#ffffff",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: {
    marginTop: 12,
    gap: 4,
  },
  brandLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#777777",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  productName: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 11,
    color: "#000000",
    letterSpacing: 1,
    textTransform: "uppercase",
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 12,
    color: "#000000",
  },
  originalPrice: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#aaaaaa",
    textDecorationLine: "line-through",
  },
});

// ── Screen Styles ────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  // ── Search ────────────────────────────────────────
  searchSection: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    backgroundColor: "#ffffff",
    zIndex: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#000000",
    letterSpacing: 2,
    paddingVertical: 0,
  },
  suggestionBox: {
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    backgroundColor: "#ffffff",
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  suggestionText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 1,
    flex: 1,
  },
  suggestionType: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#777777",
    letterSpacing: 2,
  },

  // ── Gender tabs ───────────────────────────────────
  genderRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  genderTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#eeeeee",
  },
  genderTabActive: {
    backgroundColor: "#000000",
  },
  genderTabText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  genderTabTextActive: {
    color: "#ffffff",
  },

  // ── Category chips ────────────────────────────────
  categoryScrollWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  categoryChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  categoryChipText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },

  // ── Filter bar ────────────────────────────────────
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#000000",
  },
  filterBtnActive: {
    backgroundColor: "#000000",
  },
  filterBtnText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 1,
  },
  filterBtnTextActive: {
    color: "#ffffff",
  },
  filterBtnBadge: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 10,
    color: "#ffffff",
    letterSpacing: 0,
  },
  resultsCount: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#777777",
    letterSpacing: 2,
    marginLeft: "auto",
  },

  // ── Active chips ──────────────────────────────────
  activeChipsScroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#000000",
  },
  activeChipText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#000000",
    letterSpacing: 2,
  },

  // ── Grid ──────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ── Footer ───────────────────────────────────────
  footerLoader: {
    paddingVertical: 32,
    alignItems: "center",
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  endLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000000",
  },
  endText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#000000",
    letterSpacing: 3,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 20,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  emptySubtitle: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#777777",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default ShopScreen;
