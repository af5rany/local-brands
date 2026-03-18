import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

const OrdersTab = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return colors.warning;
      case "PAID":
        return colors.info;
      case "SHIPPED":
        return "#8B5CF6";
      case "DELIVERED":
        return colors.success;
      case "CANCELLED":
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
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

  // Refresh on tab focus
  useFocusEffect(
    useCallback(() => {
      if (token) fetchOrders();
    }, [token]),
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/orders/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.text }]}>
            Order #{item.id}
          </Text>
          <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
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
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          {item.orderItems?.length || 0}{" "}
          {item.orderItems?.length === 1 ? "item" : "items"}
        </Text>
        <Text style={[styles.orderTotal, { color: colors.text }]}>
          ${item.totalAmount.toFixed(2)}
        </Text>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border }]}
      />

      <TouchableOpacity
        style={styles.viewDetailsBtn}
        onPress={() => router.push(`/orders/${item.id}` as any)}
      >
        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
          VIEW DETAILS
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (!token) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centeredContent}>
          <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Order history
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Login to view your previous acquisitions.
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.authBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>MY ORDERS</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centeredContent}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No orders yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Begin your journey by discovering our premium collections.
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/shop" as any)}
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
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
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

export default OrdersTab;
