import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

const OrdersScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#737373", dark: "#A3A3A3" },
    "text",
  );
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

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "CANCELLED":
        return "#C41E3A";
      default:
        return "#000000";
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: cardBackground }]}
      onPress={() => router.push(`/orders/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: textColor }]}>
            Order #{item.id}
          </Text>
          <Text style={[styles.orderDate, { color: secondaryTextColor }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <Text style={[styles.itemCount, { color: textColor }]}>
          {item.orderItems?.length || 0}{" "}
          {item.orderItems?.length === 1 ? "item" : "items"}
        </Text>
        <Text style={[styles.orderTotal, { color: textColor }]}>
          ${Number(item.totalAmount).toFixed(2)}
        </Text>
      </View>

      {item.estimatedDeliveryDate &&
        item.status !== "DELIVERED" &&
        item.status !== "CANCELLED" && (
          <View style={styles.estimatedRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={secondaryTextColor}
            />
            <Text style={[styles.estimatedText, { color: secondaryTextColor }]}>
              EST. DELIVERY{" "}
              <Text style={{ color: textColor, fontWeight: "700" }}>
                {new Date(item.estimatedDeliveryDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}
              </Text>
            </Text>
          </View>
        )}

      {item.status === "DELIVERED" && item.deliveredAt && (
        <View style={styles.estimatedRow}>
          <Ionicons name="checkmark-circle-outline" size={12} color="#000000" />
          <Text style={[styles.estimatedText, { color: textColor }]}>
            DELIVERED{" "}
            <Text style={{ fontWeight: "700" }}>
              {new Date(item.deliveredAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </Text>
        </View>
      )}

      <View
        style={[styles.divider, { backgroundColor: secondaryTextColor + "15" }]}
      />

      <TouchableOpacity
        style={styles.viewDetailsBtn}
        onPress={() => router.push(`/orders/${item.id}` as any)}
      >
        <Text style={[styles.viewDetailsText, { color: textColor }]}>
          VIEW DETAILS
        </Text>
        <Ionicons name="chevron-forward" size={14} color={textColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: cardBackground }}>
        <Header />
      </SafeAreaView>

      {!token ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Ionicons name="list-outline" size={64} color={secondaryTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Order history
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Login to view your previous acquisitions.
          </Text>
          <TouchableOpacity
            style={styles.authBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.authBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={secondaryTextColor}
          />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No orders yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Begin your journey by discovering our premium collections.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopBtnText}>START EXPLORING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  orderBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCount: {
    fontSize: 14,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 0,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  authBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 0,
  },
  authBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  estimatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  estimatedText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
});

export default OrdersScreen;
