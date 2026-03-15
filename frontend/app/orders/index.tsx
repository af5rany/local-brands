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
  const accentColor = useThemeColor(
    { light: "#DC2626", dark: "#EF4444" },
    "tint",
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
      case "PENDING":
        return "#F59E0B";
      case "PAID":
        return "#3B82F6";
      case "SHIPPED":
        return "#8B5CF6";
      case "DELIVERED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      default:
        return secondaryTextColor;
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
          ${item.totalAmount.toFixed(2)}
        </Text>
      </View>

      <View
        style={[styles.divider, { backgroundColor: secondaryTextColor + "20" }]}
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

  if (!token) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor, justifyContent: "center", alignItems: "center" },
        ]}
      >
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>MY ORDERS</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
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
    </SafeAreaView>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 6,
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
    borderRadius: 30,
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
    borderRadius: 30,
  },
  authBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});

export default OrdersScreen;
