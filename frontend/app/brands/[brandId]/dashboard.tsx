import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

interface TopProduct {
  id: number;
  name: string;
  price: number;
  salePrice: number | null;
  salesCount: number;
  viewCount: number;
  averageRating: number;
  image: string;
}

interface RecentOrder {
  orderId: number;
  orderStatus: string;
  customerName: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

interface BrandAnalytics {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  totalUnitsSold: number;
  pendingOrders: number;
  followerCount: number;
  totalViews: number;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
}

const BrandDashboard = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { brandId } = useLocalSearchParams();
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!token || !brandId) return;
    try {
      const [analyticsRes, brandRes] = await Promise.all([
        fetch(`${getApiUrl()}/brands/${brandId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/brands/${brandId}`),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrandName(data.name || "");
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return colors.success;
      case "cancelled":
        return colors.danger;
      case "pending":
        return colors.textTertiary;
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Unable to load dashboard
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.goBackText, { color: colors.primary }]}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.borderLight }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            DASHBOARD
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {brandName}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            {
              label: "REVENUE",
              value: formatCurrency(analytics.totalRevenue),
              icon: "cash-outline" as const,
            },
            {
              label: "ORDERS",
              value: analytics.totalOrders.toString(),
              icon: "receipt-outline" as const,
            },
            {
              label: "PRODUCTS",
              value: analytics.totalProducts.toString(),
              icon: "cube-outline" as const,
            },
            {
              label: "UNITS SOLD",
              value: formatNumber(analytics.totalUnitsSold),
              icon: "cart-outline" as const,
            },
            {
              label: "FOLLOWERS",
              value: formatNumber(analytics.followerCount),
              icon: "people-outline" as const,
            },
            {
              label: "VIEWS",
              value: formatNumber(analytics.totalViews),
              icon: "eye-outline" as const,
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={stat.icon}
                size={18}
                color={colors.textTertiary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.textTertiary }]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Pending Orders Alert */}
        {analytics.pendingOrders > 0 && (
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.text}
            />
            <Text style={[styles.alertText, { color: colors.text }]}>
              {analytics.pendingOrders} pending order
              {analytics.pendingOrders > 1 ? "s" : ""} awaiting action
            </Text>
          </View>
        )}

        {/* Top Products */}
        {analytics.topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              TOP PRODUCTS
            </Text>
            {analytics.topProducts.map((product, index) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productRow,
                  {
                    borderBottomColor: colors.borderLight,
                    borderBottomWidth:
                      index < analytics.topProducts.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() =>
                  router.push(`/products/${product.id}` as any)
                }
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.productRank, { color: colors.textTertiary }]}
                >
                  {index + 1}
                </Text>
                <Image
                  source={{ uri: product.image }}
                  style={[
                    styles.productImage,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                />
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text
                      style={[
                        styles.productMetaText,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {product.salesCount} sold
                    </Text>
                    <Text
                      style={[
                        styles.productMetaText,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {product.viewCount} views
                    </Text>
                    {product.averageRating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={10} color={colors.text} />
                        <Text
                          style={[
                            styles.productMetaText,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {product.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.productPrice, { color: colors.text }]}>
                  {formatCurrency(product.salePrice || product.price)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Orders */}
        {analytics.recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              RECENT ORDERS
            </Text>
            {analytics.recentOrders.map((order, index) => (
              <TouchableOpacity
                key={`${order.orderId}-${index}`}
                style={[
                  styles.orderRow,
                  {
                    borderBottomColor: colors.borderLight,
                    borderBottomWidth:
                      index < analytics.recentOrders.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() =>
                  router.push(`/orders/${order.orderId}` as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.orderInfo}>
                  <Text
                    style={[styles.orderProduct, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {order.productName}
                  </Text>
                  <Text
                    style={[
                      styles.orderCustomer,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {order.customerName} · Qty {order.quantity}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={[styles.orderPrice, { color: colors.text }]}>
                    {formatCurrency(order.totalPrice)}
                  </Text>
                  <Text
                    style={[
                      styles.orderStatus,
                      { color: getStatusColor(order.orderStatus) },
                    ]}
                  >
                    {order.orderStatus?.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  goBackText: {
    fontSize: 13,
    fontWeight: "700",
    // letterSpacing: 1,
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    // letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  scrollContent: { paddingTop: 20 },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    width: "31%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    // letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    // letterSpacing: 1,
  },

  // Alert
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  alertText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    // letterSpacing: 2,
    marginBottom: 16,
  },

  // Top Products
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  productRank: {
    fontSize: 14,
    fontWeight: "700",
    width: 20,
    textAlign: "center",
  },
  productImage: {
    width: 48,
    height: 48,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: "row",
    gap: 10,
  },
  productMetaText: {
    fontSize: 11,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Recent Orders
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderProduct: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 11,
    fontWeight: "500",
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 9,
    fontWeight: "800",
    // letterSpacing: 1,
  },
});

export default BrandDashboard;
