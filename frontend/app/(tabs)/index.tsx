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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useThemeColors } from "@/hooks/useThemeColor";

const HomeScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, loading, user } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [stats, setStats] = useState({
    myOrders: 0,
    wishlist: 0,
    cartItems: 0,
  });
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fetchHomeData = async () => {
    if (!hasLoadedOnce.current) setLoadingData(true);

    const apiUrl = getApiUrl();

    // Fetch stats for authenticated users
    if (token) {
      try {
        const response = await fetch(`${apiUrl}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    // Fetch featured brands and new arrivals
    try {
      const [brandsRes, productsRes] = await Promise.all([
        fetch(`${apiUrl}/brands?limit=6&sortBy=createdAt&sortOrder=DESC`, {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        }),
        fetch(
          `${apiUrl}/products?limit=8&status=published&sortBy=createdAt&sortOrder=DESC`,
          {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          },
        ),
      ]);

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setFeaturedBrands(brandsData.items || []);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setNewArrivals(productsData.items || []);
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
      if (hasLoadedOnce.current) fetchHomeData();
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

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

  const productCardWidth = isTablet ? 180 : 150;

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
        {/* Header — no search bar (search lives in Shop tab) */}
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={user?.role || user?.userRole || "customer"}
          isGuest={!token}
          showSearch={false}
        />

        {/* Quick Stats for authenticated users */}
        {token && (
          <View style={styles.quickStats}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/orders" as any)}
            >
              <View style={[styles.statIconBox, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.myOrders || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/wishlist" as any)}
            >
              <View style={[styles.statIconBox, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="heart-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.wishlist || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Wishlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push("/cart" as any)}
            >
              <View style={[styles.statIconBox, { backgroundColor: colors.successSoft }]}>
                <Ionicons name="bag-handle-outline" size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.cartItems || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Cart
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured Brands */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Brands
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/shop" as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {loadingData && !hasLoadedOnce.current ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.sectionLoader}
            />
          ) : featuredBrands.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No brands available
            </Text>
          ) : (
            <FlatList
              data={featuredBrands}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.brandCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() =>
                    router.push(`/brands/${item.id}` as any)
                  }
                >
                  {item.logo ? (
                    <Image
                      source={{ uri: item.logo }}
                      style={styles.brandLogo}
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
                        size={24}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                  <Text
                    style={[styles.brandName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.location && (
                    <Text
                      style={[styles.brandLocation, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {item.location}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              New Arrivals
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/shop" as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

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
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const firstVariant = item.variants?.[0];
                const image =
                  firstVariant?.images?.[0] ||
                  firstVariant?.variantImages?.[0] ||
                  "";
                const hasDiscount =
                  item.salePrice && item.salePrice < item.price;

                return (
                  <TouchableOpacity
                    style={[
                      styles.productCard,
                      {
                        width: productCardWidth,
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      router.push(`/products/${item.id}` as any)
                    }
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.productImage}
                    />
                    {hasDiscount && (
                      <View
                        style={[
                          styles.discountBadge,
                          { backgroundColor: colors.danger },
                        ]}
                      >
                        <Text style={styles.discountText}>
                          {Math.round(
                            ((item.price - item.salePrice!) / item.price) * 100,
                          )}
                          % OFF
                        </Text>
                      </View>
                    )}
                    <View style={styles.productInfo}>
                      <Text
                        style={[
                          styles.productBrand,
                          { color: colors.textTertiary },
                        ]}
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
                            { color: colors.priceCurrent },
                          ]}
                        >
                          ${(item.salePrice || item.price).toFixed(2)}
                        </Text>
                        {hasDiscount && (
                          <Text
                            style={[
                              styles.originalPrice,
                              { color: colors.textTertiary },
                            ]}
                          >
                            ${item.price.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

  // Quick Stats
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Sections
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
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionLoader: {
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 24,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 12,
  },

  // Brand Card
  brandCard: {
    width: 110,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
  },
  brandLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  brandLocation: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },

  // Product Card
  productCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  productImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f5f5f5",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  productInfo: {
    padding: 10,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
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
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },

  bottomSpacing: {
    height: 40,
  },
});

export default HomeScreen;
