import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  useWindowDimensions,
  RefreshControl,
  Pressable,
  ViewToken,
  Animated,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useThemeColors } from "@/hooks/useThemeColor";
import AutoSwipeImages from "@/components/AutoSwipeImages";

// ── Categories ──────────────────────────────────────────────
const CATEGORIES = [
  { label: "Shoes", type: "Shoes", icon: "footsteps-outline" },
  { label: "Shirts", type: "Shirts", icon: "shirt-outline" },
  { label: "Hoodies", type: "Hoodies", icon: "shirt-outline" },
  { label: "Pants", type: "Pants", icon: "cut-outline" },
  { label: "Jackets", type: "Jackets", icon: "rainy-outline" },
  { label: "Bags", type: "Bags", icon: "bag-handle-outline" },
  { label: "Accessories", type: "Accessories", icon: "watch-outline" },
  { label: "Hats", type: "Hats", icon: "sunny-outline" },
];

// ── Promotional Banners ─────────────────────────────────────
const PROMO_BANNERS = [
  {
    id: "1",
    title: "New Season\nCollection",
    subtitle: "Up to 40% off on selected brands",
    buttonText: "Shop Now",
    icon: "sparkles",
  },
  {
    id: "2",
    title: "Flash Sale\nThis Weekend",
    subtitle: "Don't miss exclusive deals",
    buttonText: "View Deals",
    icon: "flash",
  },
  {
    id: "3",
    title: "Free Shipping\nOrders $50+",
    subtitle: "Limited time offer",
    buttonText: "Start Shopping",
    icon: "car",
  },
];

// ─────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, loading, user } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Banner auto-scroll
  const bannerRef = useRef<FlatList>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const activeBannerIndexRef = useRef(0);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [newBrands, setNewBrands] = useState<Brand[]>([]);
  const [sponsoredBrands, setSponsoredBrands] = useState<Brand[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  // ── Banner auto-scroll callbacks ────────────────────────────
  const onBannerViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        activeBannerIndexRef.current = viewableItems[0].index;
        setActiveBannerIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const bannerViewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  useEffect(() => {
    if (PROMO_BANNERS.length <= 1) return;
    const interval = setInterval(() => {
      const next =
        activeBannerIndexRef.current >= PROMO_BANNERS.length - 1
          ? 0
          : activeBannerIndexRef.current + 1;
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ── Data fetching ──────────────────────────────────────────

  const fetchHomeData = async () => {
    if (!hasLoadedOnce.current) setLoadingData(true);

    const apiUrl = getApiUrl();

    if (token) {
      try {
        const response = await fetch(`${apiUrl}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("[HomeStats]", data);
          setStats((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    try {
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      const [
        newBrandsRes,
        sponsoredBrandsRes,
        featuredBrandsRes,
        productsRes,
        dealsRes,
        trendingRes,
        bestsellersRes,
      ] = await Promise.all([
        fetch(`${apiUrl}/brands?limit=8&sortBy=createdAt&sortOrder=DESC`, {
          headers,
        }),
        fetch(`${apiUrl}/brands?limit=8&isSponsored=true`, { headers }),
        fetch(`${apiUrl}/brands?limit=8&isFeatured=true`, { headers }),
        fetch(
          `${apiUrl}/products?limit=8&status=published&sortBy=createdAt&sortOrder=DESC`,
          { headers },
        ),
        fetch(
          `${apiUrl}/products?limit=20&status=published&sortBy=price&sortOrder=ASC`,
          { headers },
        ),
        fetch(`${apiUrl}/products/trending?limit=10`, { headers }),
        fetch(`${apiUrl}/products/bestsellers?limit=10`, { headers }),
      ]);

      if (newBrandsRes.ok) {
        const data = await newBrandsRes.json();
        setNewBrands(data.items || []);
      }
      if (sponsoredBrandsRes.ok) {
        const data = await sponsoredBrandsRes.json();
        setSponsoredBrands(data.items || []);
      }
      if (featuredBrandsRes.ok) {
        const data = await featuredBrandsRes.json();
        setFeaturedBrands(data.items || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setNewArrivals(data.items || []);
      }
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        const allProducts: Product[] = data.items || [];
        const discounted = allProducts.filter(
          (p) => p.salePrice && p.salePrice < p.price,
        );
        setDealProducts(discounted.slice(0, 10));
      }
      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingProducts(Array.isArray(data) ? data : []);
      }
      if (bestsellersRes.ok) {
        const data = await bestsellersRes.json();
        setBestsellers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      hasLoadedOnce.current = true;
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) {
        fetchHomeData();
      }
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const productCardWidth = isTablet ? 180 : 160;

  // ── Render helpers ─────────────────────────────────────────

  const renderBrandCard = (
    item: Brand,
    badgeType?: "NEW" | "SPONSORED" | "FEATURED",
  ) => {
    return (
      <TouchableOpacity
        style={[
          styles.brandCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => router.push(`/brands/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.brandLogoRing, { borderColor: colors.text }]}>
          {item.logo ? (
            <Image
              source={{ uri: item.logo }}
              style={[styles.brandLogo, { backgroundColor: colors.surface }]}
            />
          ) : (
            <View
              style={[
                styles.brandLogoPlaceholder,
                { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <Ionicons
                name="storefront-outline"
                size={22}
                color={colors.textTertiary}
              />
            </View>
          )}
        </View>

        {badgeType && (
          <View style={[styles.brandBadge, { backgroundColor: colors.text }]}>
            <Text
              style={[styles.brandBadgeText, { color: colors.textInverse }]}
            >
              {badgeType}
            </Text>
          </View>
        )}

        <Text
          style={[styles.brandName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {item.location && (
          <View style={styles.brandLocationRow}>
            <Ionicons
              name="location-outline"
              size={10}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.brandLocation, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderProductCard = (item: Product, showDealBadge = false) => {
    // Use product images if available, else first variant's images (don't mix across variants)
    const cardImages: string[] = item.images?.length
      ? item.images
      : item.variants?.[0]?.images?.length
        ? item.variants[0].images
        : item.mainImage
          ? [item.mainImage]
          : [];

    const hasDiscount = item.salePrice && item.salePrice < item.price;
    const discountPercent = hasDiscount
      ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
      : 0;

    return (
      <Pressable
        style={[
          styles.productCard,
          {
            width: productCardWidth,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => router.push(`/products/${item.id}` as any)}
      >
        <View style={styles.productImageWrapper}>
          <AutoSwipeImages
            images={cardImages}
            width={productCardWidth}
            height={180}
          />
          {hasDiscount && (
            <View
              style={[styles.discountBadge, { backgroundColor: colors.text }]}
            >
              <Text
                style={[styles.discountText, { color: colors.textInverse }]}
              >
                {discountPercent}% OFF
              </Text>
            </View>
          )}
          {showDealBadge && hasDiscount && (
            <View style={[styles.dealTag, { backgroundColor: colors.text }]}>
              <Ionicons name="flash" size={10} color={colors.textInverse} />
              <Text style={[styles.dealTagText, { color: colors.textInverse }]}>
                DEAL
              </Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text
            style={[styles.productBrand, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {item.brand?.name || item.brandName || "Brand"}
          </Text>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.productPrice,
                { color: hasDiscount ? colors.priceCurrent : colors.text },
              ]}
            >
              ${(item.salePrice || item.price).toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text
                style={[styles.originalPrice, { color: colors.textTertiary }]}
              >
                ${item.price.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = (
    title: string,
    _iconName: string,
    _iconGradient: [string, string],
    onSeeAll: () => void,
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
        <Text
          style={[
            styles.seeAllText,
            { color: colors.text, textDecorationLine: "underline" },
          ]}
        >
          See All
        </Text>
      </TouchableOpacity>
    </View>
  );

  const searchBarScale = useRef(new Animated.Value(1)).current;

  const navigateToShop = () => {
    Animated.sequence([
      Animated.timing(searchBarScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarScale, {
        toValue: 1.02,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      searchBarScale.setValue(1);
      router.push("/(tabs)/shop" as any);
    });
  };

  // ── JSX ────────────────────────────────────────────────────
  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Promotional Banners ────────────────────────────── */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={bannerRef}
            data={PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onBannerViewableItemsChanged}
            viewabilityConfig={bannerViewabilityConfig}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <Pressable style={{ width }} onPress={navigateToShop}>
                <View
                  style={[styles.promoBanner, { backgroundColor: colors.text }]}
                >
                  {/* Content */}
                  <View style={styles.promoContent}>
                    <Text
                      style={[styles.promoTitle, { color: colors.textInverse }]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.promoSubtitle,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                    <View
                      style={[
                        styles.promoButton,
                        {
                          borderColor: colors.primarySoft,
                          borderWidth: 1,
                          backgroundColor: "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.promoButtonText,
                          { color: colors.textInverse },
                        ]}
                      >
                        {item.buttonText}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={colors.textInverse}
                      />
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
          />

          {/* Dot indicators */}
          <View style={styles.bannerDots}>
            {PROMO_BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerDot,
                  activeBannerIndex === index
                    ? [
                        styles.bannerDotActive,
                        { backgroundColor: colors.primary },
                      ]
                    : [
                        styles.bannerDotInactive,
                        { backgroundColor: colors.border },
                      ],
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Categories ─────────────────────────────────────── */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {CATEGORIES.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryItem}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/shop",
                    params: { category: cat.type },
                  } as any)
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: colors.text },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={22}
                    color={colors.textInverse}
                  />
                </View>
                <Text
                  style={[styles.categoryLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Flash Deals ────────────────────────────────────── */}
        {(loadingData && !hasLoadedOnce.current
          ? true
          : dealProducts.length > 0) && (
          <View style={styles.section}>
            {renderSectionHeader(
              "Flash Deals",
              "flash",
              [colors.primary, colors.primaryMuted],
              navigateToShop,
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {dealProducts.map((item) => (
                  <React.Fragment key={`deal-${item.id}`}>
                    {renderProductCard(item, true)}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Trending Now ──────────────────────────────────── */}
        {(loadingData && !hasLoadedOnce.current
          ? true
          : trendingProducts.length > 0) && (
          <View style={styles.section}>
            {renderSectionHeader(
              "Trending Now",
              "trending-up",
              [colors.text, colors.textSecondary],
              navigateToShop,
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {trendingProducts.map((item) => (
                  <React.Fragment key={`trending-${item.id}`}>
                    {renderProductCard(item)}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Featured Brands ─────────────────────────────── */}
        {(loadingData && !hasLoadedOnce.current
          ? true
          : featuredBrands.length > 0) && (
          <View style={styles.section}>
            {renderSectionHeader(
              "Featured Brands",
              "star",
              [colors.text, colors.textSecondary],
              () => router.push("/(tabs)/brands" as any),
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {featuredBrands.map((item) => (
                  <React.Fragment key={`featured-brand-${item.id}`}>
                    {renderBrandCard(item, "FEATURED")}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── New Arrivals ───────────────────────────────────── */}
        <View style={styles.section}>
          {renderSectionHeader(
            "New Arrivals",
            "star",
            [colors.primary, colors.primaryMuted],
            navigateToShop,
          )}

          {loadingData && !hasLoadedOnce.current ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.sectionLoader}
            />
          ) : newArrivals.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No products available
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {newArrivals.map((item) => (
                <React.Fragment key={`arrival-${item.id}`}>
                  {renderProductCard(item)}
                </React.Fragment>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── New Brands ─────────────────────────────────────── */}
        <View style={styles.section}>
          {renderSectionHeader(
            "New Brands",
            "sparkles",
            [colors.success, colors.success],
            navigateToShop,
          )}

          {loadingData && !hasLoadedOnce.current ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.sectionLoader}
            />
          ) : newBrands.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No brands available
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {newBrands.map((item) => (
                <React.Fragment key={`new-brand-${item.id}`}>
                  {renderBrandCard(item, "NEW")}
                </React.Fragment>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Bestsellers ──────────────────────────────────── */}
        {(loadingData && !hasLoadedOnce.current
          ? true
          : bestsellers.length > 0) && (
          <View style={styles.section}>
            {renderSectionHeader(
              "Bestsellers",
              "trophy",
              [colors.text, colors.textSecondary],
              navigateToShop,
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {bestsellers.map((item) => (
                  <React.Fragment key={`bestseller-${item.id}`}>
                    {renderProductCard(item)}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Sponsored Brands ───────────────────────────────── */}
        {(loadingData && !hasLoadedOnce.current
          ? true
          : sponsoredBrands.length > 0) && (
          <View style={styles.section}>
            {renderSectionHeader(
              "Sponsored Brands",
              "megaphone",
              [colors.primary, colors.primaryMuted],
              navigateToShop,
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {sponsoredBrands.map((item) => (
                  <React.Fragment key={`sponsored-brand-${item.id}`}>
                    {renderBrandCard(item, "SPONSORED")}
                  </React.Fragment>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────
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

  // ── Search Bar ──────────────────────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    height: 48,
    borderRadius: 0,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 14,
  },
  searchBarIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchBarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0.1,
  },

  // ── Quick Stats ─────────────────────────────────────────
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statIconBox: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // ── Promo Banners ───────────────────────────────────────
  bannerSection: {
    marginTop: 20,
  },
  promoBanner: {
    height: 180,
    borderRadius: 0,
    overflow: "hidden",
    padding: 24,
    justifyContent: "center",
  },
  promoContent: {
    zIndex: 1,
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  promoSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  bannerDot: {
    borderRadius: 4,
  },
  bannerDotActive: {
    width: 24,
    height: 8,
  },
  bannerDotInactive: {
    width: 8,
    height: 8,
  },

  // ── Categories ──────────────────────────────────────────
  categoriesSection: {
    marginTop: 24,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    width: 64,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── Sections ────────────────────────────────────────────
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  sectionLoader: {
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 13,
    paddingVertical: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // ── Brand Card ──────────────────────────────────────────
  brandCard: {
    width: 110,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 0,
  },
  brandLogoRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  brandLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  brandLogoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  brandBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  brandLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 2,
  },
  brandLocation: {
    fontSize: 10,
    textAlign: "center",
  },

  // ── Product Card ────────────────────────────────────────
  productCard: {
    borderRadius: 0,
    overflow: "hidden",
  },
  productImageWrapper: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 180,
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  dealTag: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    gap: 3,
  },
  dealTagText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  productInfo: {
    padding: 12,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },

  // ── Misc ────────────────────────────────────────────────
  bottomSpacing: {
    height: 40,
  },
});

export default HomeScreen;
