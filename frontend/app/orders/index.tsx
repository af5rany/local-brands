import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { OrderListSkeleton } from "@/components/Skeleton";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";

const OrdersScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isConnected } = useNetwork();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const isCancelled = (status: string) =>
    status?.toUpperCase() === "CANCELLED";

  const isDelivered = (status: string) => {
    const s = status?.toUpperCase();
    return s === "DELIVERED" || s === "COMPLETED";
  };

  const getStatusBadgeStyle = (status: string) => {
    if (isCancelled(status)) return styles.badgeCancelled;
    if (isDelivered(status)) return styles.badgeDelivered;
    return styles.badgeProcessing;
  };

  const getStatusTextStyle = (status: string) => {
    if (isCancelled(status)) return styles.badgeTextCancelled;
    if (isDelivered(status)) return styles.badgeTextDelivered;
    return styles.badgeTextProcessing;
  };

  const renderCTA = (item: any) => {
    const status = item.status?.toUpperCase();
    if (isCancelled(item.status)) {
      return (
        <TouchableOpacity style={styles.ctaGhost}>
          <Text style={styles.ctaGhostText}>CONTACT SUPPORT</Text>
        </TouchableOpacity>
      );
    }
    if (isDelivered(item.status)) {
      return (
        <TouchableOpacity
          style={styles.ctaBordered}
          onPress={() => router.push(`/orders/${item.id}` as any)}
        >
          <Text style={styles.ctaBorderedText}>REORDER</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.ctaBordered}
        onPress={() => router.push(`/orders/${item.id}` as any)}
      >
        <Text style={styles.ctaBorderedText}>VIEW DETAILS</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const cancelled = isCancelled(item.status);
    const images: string[] = (item.orderItems || [])
      .slice(0, 3)
      .map((i: any) => i.productImage)
      .filter(Boolean);

    return (
      <TouchableOpacity
        style={[styles.orderCard, cancelled && styles.orderCardCancelled]}
        onPress={() =>
          !cancelled && router.push(`/orders/${item.id}` as any)
        }
        activeOpacity={cancelled ? 1 : 0.85}
      >
        {/* Top row: order number + badge */}
        <View style={styles.topRow}>
          <Text style={styles.orderNumber}>
            #ORD-{String(item.id).padStart(4, "0")}
          </Text>
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.dateText}>
          PLACED{" "}
          {new Date(item.createdAt)
            .toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
            .toUpperCase()}
        </Text>

        {/* Product thumbnails */}
        {images.length > 0 && (
          <View style={styles.thumbnailRow}>
            {images.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={[
                  styles.thumbnail,
                  idx > 0 && { marginLeft: -8 },
                ]}
              />
            ))}
          </View>
        )}

        {/* Total + CTA */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalAmount}>
              ${Number(item.totalAmount).toFixed(2)}
            </Text>
          </View>
          {renderCTA(item)}
        </View>
      </TouchableOpacity>
    );
  };

  if (!isConnected && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header showBack={true} />
        <OfflinePlaceholder onRetry={fetchOrders} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header showBack={true} />

      {!token ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>NO ORDERS YET</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to view your order history.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.primaryBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <OrderListSkeleton count={4} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>NO ORDERS YET</Text>
          <Text style={styles.emptySubtitle}>
            Begin your journey by discovering our premium collections.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/")}
          >
            <Text style={styles.primaryBtnText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>MY ORDERS</Text>
              <View style={styles.titleAccent} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Page header */
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  pageTitle: {
    fontFamily: undefined,
    fontSize: 40,
    color: colors.text,
    // letterSpacing: -0.5,
  },
  titleAccent: {
    width: 80,
    height: 2,
    backgroundColor: colors.text,
    marginTop: 12,
  },

  /* List */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Order card */
  orderCard: {
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 16,
    borderRadius: 0,
  },
  orderCardCancelled: {
    opacity: 0.7,
  },

  /* Top row */
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontFamily: undefined,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    // letterSpacing: 0.5,
  },

  /* Status badge */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
  },
  badgeProcessing: {
    borderColor: colors.text,
  },
  badgeDelivered: {
    borderColor: colors.border,
  },
  badgeCancelled: {
    borderColor: colors.accentRed,
  },
  statusText: {
    fontFamily: undefined,
    fontSize: 9,
    // letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  badgeTextProcessing: {
    color: colors.text,
  },
  badgeTextDelivered: {
    color: colors.textTertiary,
  },
  badgeTextCancelled: {
    color: colors.accentRed,
  },

  /* Date */
  dateText: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    // letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  /* Thumbnails */
  thumbnailRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.surfaceContainer,
  },

  /* Bottom row */
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    // letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  totalAmount: {
    fontFamily: undefined,
    fontSize: 22,
    color: colors.text,
  },

  /* CTA buttons */
  ctaBordered: {
    borderWidth: 1,
    borderColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 0,
  },
  ctaBorderedText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    // letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  ctaGhost: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  ctaGhostText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.textTertiary,
    // letterSpacing: 1.5,
    textTransform: "uppercase",
    textDecorationLine: "underline",
  },

  /* Empty state */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontFamily: undefined,
    fontSize: 14,
    color: colors.text,
    // letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 0,
  },
  primaryBtnText: {
    fontFamily: undefined,
    color: colors.primaryForeground,
    fontSize: 11,
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default OrdersScreen;
