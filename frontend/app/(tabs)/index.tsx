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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useCartCount } from "@/hooks/useCartCount";

// ── Categories ──────────────────────────────────────────────
const CATEGORIES = [
  { label: "Shoes", type: "Shoes", icon: "footsteps-outline", colors: ["#667eea", "#764ba2"] as [string, string] },
  { label: "Shirts", type: "Shirts", icon: "shirt-outline", colors: ["#4facfe", "#00f2fe"] as [string, string] },
  { label: "Hoodies", type: "Hoodies", icon: "shirt-outline", colors: ["#f093fb", "#f5576c"] as [string, string] },
  { label: "Pants", type: "Pants", icon: "cut-outline", colors: ["#43e97b", "#38f9d7"] as [string, string] },
  { label: "Jackets", type: "Jackets", icon: "rainy-outline", colors: ["#a18cd1", "#fbc2eb"] as [string, string] },
  { label: "Bags", type: "Bags", icon: "bag-handle-outline", colors: ["#fa709a", "#fee140"] as [string, string] },
  { label: "Accessories", type: "Accessories", icon: "watch-outline", colors: ["#ff9a9e", "#fecfef"] as [string, string] },
  { label: "Hats", type: "Hats", icon: "sunny-outline", colors: ["#fbc2eb", "#a6c1ee"] as [string, string] },
];

// ── Promotional Banners ─────────────────────────────────────
const PROMO_BANNERS = [
  {
    id: "1",
    title: "New Season\nCollection",
    subtitle: "Up to 40% off on selected brands",
    buttonText: "Shop Now",
    colors: ["#4338CA", "#6366F1"] as [string, string],
    icon: "sparkles",
  },
  {
    id: "2",
    title: "Flash Sale\nThis Weekend",
    subtitle: "Don't miss exclusive deals",
    buttonText: "View Deals",
    colors: ["#DC2626", "#F97316"] as [string, string],
    icon: "flash",
  },
  {
    id: "3",
    title: "Free Shipping\nOrders $50+",
    subtitle: "Limited time offer",
    buttonText: "Start Shopping",
    colors: ["#059669", "#10B981"] as [string, string],
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

  const { count: cartItemCount, refresh: refreshCartCount } = useCartCount();

  // Banner auto-scroll
  const bannerRef = useRef<FlatList>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const activeBannerIndexRef = useRef(0);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [newBrands, setNewBrands] = useState<Brand[]>([]);
  const [sponsoredBrands, setSponsoredBrands] = useState<Brand[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
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
  const fetchNotificationCount = async () => {
    if (!token) {
      setNotificationCount(0);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.count || 0);
      }
    } catch {
      setNotificationCount(0);
    }
  };

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

      const [newBrandsRes, sponsoredBrandsRes, productsRes, dealsRes] =
        await Promise.all([
          fetch(
            `${apiUrl}/brands?limit=8&sortBy=createdAt&sortOrder=DESC`,
            { headers },
          ),
          fetch(
            `${apiUrl}/brands?limit=8&isSponsored=true`,
            { headers },
          ),
          fetch(
            `${apiUrl}/products?limit=8&status=published&sortBy=createdAt&sortOrder=DESC`,
            { headers },
          ),
          fetch(
            `${apiUrl}/products?limit=20&status=published&sortBy=price&sortOrder=ASC`,
            { headers },
          ),
        ]);

      if (newBrandsRes.ok) {
        const data = await newBrandsRes.json();
        setNewBrands(data.items || []);
      }
      if (sponsoredBrandsRes.ok) {
        const data = await sponsoredBrandsRes.json();
        setSponsoredBrands(data.items || []);
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
    fetchNotificationCount();
    refreshCartCount();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) {
        fetchHomeData();
        fetchNotificationCount();
        refreshCartCount();
      }
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
    fetchNotificationCount();
    refreshCartCount();
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
    badgeType?: "NEW" | "SPONSORED",
  ) => {
    const gradientColors: [string, string] =
      badgeType === "SPONSORED"
        ? [colors.accent, "#FF9500"]
        : [colors.primary, colors.primaryMuted];

    return (
      <TouchableOpacity
        style={[styles.brandCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/brands/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandLogoRing}
        >
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
        </LinearGradient>

        {badgeType && (
          <View
            style={[
              styles.brandBadge,
              {
                backgroundColor:
                  badgeType === "NEW" ? colors.success : colors.accent,
              },
            ]}
          >
            <Text style={styles.brandBadgeText}>{badgeType}</Text>
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
    const firstVariant = item.variants?.[0];
    const image =
      firstVariant?.images?.[0] || firstVariant?.variantImages?.[0] || "";
    const hasDiscount = item.salePrice && item.salePrice < item.price;
    const discountPercent = hasDiscount
      ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          {
            width: productCardWidth,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => router.push(`/products/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageWrapper}>
          <Image
            source={{ uri: image }}
            style={[
              styles.productImage,
              { backgroundColor: colors.surfaceRaised },
            ]}
          />
          {hasDiscount && (
            <LinearGradient
              colors={["#E11D48", "#F43F5E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discountBadge}
            >
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </LinearGradient>
          )}
          {showDealBadge && hasDiscount && (
            <View style={styles.dealTag}>
              <Ionicons name="flash" size={10} color="#FFF" />
              <Text style={styles.dealTagText}>DEAL</Text>
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
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (
    title: string,
    iconName: string,
    iconGradient: [string, string],
    onSeeAll: () => void,
  ) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <LinearGradient
          colors={iconGradient}
          style={styles.sectionIconBadge}
        >
          <Ionicons name={iconName as any} size={13} color="#FFF" />
        </LinearGradient>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.seeAllButton, { backgroundColor: colors.primarySoft }]}
        onPress={onSeeAll}
        activeOpacity={0.7}
      >
        <Text style={[styles.seeAllText, { color: colors.primary }]}>
          See All
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const navigateToShop = () => router.push("/(tabs)/shop" as any);

  // ── JSX ────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={user?.role || user?.userRole || "customer"}
          isGuest={!token}
          showSearch={false}
          cartItemCount={cartItemCount}
          notificationCount={notificationCount}
        />

        {/* ── Search Bar (tappable → navigates to Shop) ──────── */}
        <Pressable
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
          onPress={navigateToShop}
        >
          <View
            style={[
              styles.searchBarIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="search" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.searchBarText, { color: colors.textTertiary }]}>
            Search products, brands...
          </Text>
          <Ionicons
            name="options-outline"
            size={18}
            color={colors.textTertiary}
          />
        </Pressable>

        {/* ── Quick Stats (authenticated users) ──────────────── */}
        {token && (
          <View style={styles.quickStats}>
            {Object.keys(stats).filter((k) => ({
              brands: 1, products: 1, users: 1, myProducts: 1, orders: 1, revenue: 1, myOrders: 1, wishlist: 1, cartItems: 1,
            } as Record<string, number>)[k]).slice(0, 3).map((key) => ({
              key,
              value: stats[key] || 0,
              ...({
                brands:     { label: "Brands",   icon: "storefront-outline" as const, iconColor: colors.accent,  iconBg: colors.accentSoft,  route: "/brands" },
                products:   { label: "Products", icon: "cube-outline" as const,       iconColor: colors.primary, iconBg: colors.primarySoft, route: "/products" },
                users:      { label: "Users",    icon: "people-outline" as const,     iconColor: colors.info,    iconBg: colors.infoSoft,    route: "/users" },
                myProducts: { label: "Products", icon: "cube-outline" as const,       iconColor: colors.primary, iconBg: colors.primarySoft, route: "/products" },
                orders:     { label: "Orders",   icon: "receipt-outline" as const,    iconColor: colors.primary, iconBg: colors.primarySoft, route: "/(tabs)/orders" },
                revenue:    { label: "Revenue",  icon: "cash-outline" as const,       iconColor: colors.success, iconBg: colors.successSoft, route: "/(tabs)/orders" },
                myOrders:   { label: "Orders",   icon: "receipt-outline" as const,    iconColor: colors.primary, iconBg: colors.primarySoft, route: "/(tabs)/orders" },
                wishlist:   { label: "Wishlist",  icon: "heart-outline" as const,     iconColor: colors.danger,  iconBg: colors.dangerSoft,  route: "/(tabs)/wishlist" },
                cartItems:  { label: "Cart",     icon: "bag-handle-outline" as const, iconColor: colors.success, iconBg: colors.successSoft, route: "/cart" },
              } as Record<string, { label: string; icon: any; iconColor: string; iconBg: string; route: string }>)[key],
            })).map((stat) => (
              <TouchableOpacity
                key={stat.label}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(stat.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statIconBox,
                    { backgroundColor: stat.iconBg },
                  ]}
                >
                  <Ionicons name={stat.icon} size={16} color={stat.iconColor} />
                </View>
                <View>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stat.value || 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.textTertiary }]}
                  >
                    {stat.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
              <Pressable
                style={{ width, paddingHorizontal: 20 }}
                onPress={navigateToShop}
              >
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.promoBanner}
                >
                  {/* Decorative circles */}
                  <View style={styles.promoCircle1} />
                  <View style={styles.promoCircle2} />
                  <View style={styles.promoCircle3} />

                  {/* Large decorative icon */}
                  <Ionicons
                    name={item.icon as any}
                    size={90}
                    color="rgba(255,255,255,0.12)"
                    style={styles.promoDecoIcon}
                  />

                  {/* Content */}
                  <View style={styles.promoContent}>
                    <Text style={styles.promoTitle}>{item.title}</Text>
                    <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
                    <View style={styles.promoButton}>
                      <Text style={styles.promoButtonText}>
                        {item.buttonText}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#FFF"
                      />
                    </View>
                  </View>
                </LinearGradient>
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
                  router.push(`/category/${cat.type}` as any)
                }
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={cat.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryIcon}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={22}
                    color="#FFF"
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: colors.textSecondary },
                  ]}
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
              ["#FF6B00", "#FF9500"],
              navigateToShop,
            )}

            {loadingData && !hasLoadedOnce.current ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.sectionLoader}
              />
            ) : (
              <FlatList
                data={dealProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                keyExtractor={(item) => `deal-${item.id}`}
                renderItem={({ item }) => renderProductCard(item, true)}
              />
            )}
          </View>
        )}

        {/* ── New Brands ─────────────────────────────────────── */}
        <View style={styles.section}>
          {renderSectionHeader(
            "New Brands",
            "sparkles",
            [colors.success, "#10B981"],
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
            <FlatList
              data={newBrands}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => `new-brand-${item.id}`}
              renderItem={({ item }) => renderBrandCard(item, "NEW")}
            />
          )}
        </View>

        {/* ── New Arrivals ───────────────────────────────────── */}
        <View style={styles.section}>
          {renderSectionHeader(
            "New Arrivals",
            "star",
            ["#4facfe", "#00f2fe"],
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
            <FlatList
              data={newArrivals}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => `arrival-${item.id}`}
              renderItem={({ item }) => renderProductCard(item)}
            />
          )}
        </View>

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
              <FlatList
                data={sponsoredBrands}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                keyExtractor={(item) => `sponsored-brand-${item.id}`}
                renderItem={({ item }) =>
                  renderBrandCard(item, "SPONSORED")
                }
              />
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 6,
    paddingRight: 14,
  },
  searchBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    borderRadius: 20,
    overflow: "hidden",
    padding: 24,
    justifyContent: "center",
  },
  promoCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  promoCircle2: {
    position: "absolute",
    bottom: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  promoCircle3: {
    position: "absolute",
    top: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  promoDecoIcon: {
    position: "absolute",
    bottom: -5,
    right: 15,
  },
  promoContent: {
    zIndex: 1,
  },
  promoTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  promoSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  promoButtonText: {
    color: "#FFF",
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
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
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
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandLogoRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
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
    color: "#FFF",
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
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
    borderRadius: 8,
  },
  discountText: {
    color: "#FFF",
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
    backgroundColor: "#FF6B00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  dealTagText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
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
