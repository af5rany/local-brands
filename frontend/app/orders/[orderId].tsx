import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

interface StatusHistoryItem {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  notes: string;
  createdAt: string;
}

const OrderDetailScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
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

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token || !orderId) return;
      try {
        const [orderRes, historyRes] = await Promise.all([
          fetch(`${getApiUrl()}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${getApiUrl()}/orders/${orderId}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [token, orderId]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "#F59E0B";
      case "CONFIRMED":
        return "#3B82F6";
      case "PROCESSING":
        return "#8B5CF6";
      case "SHIPPED":
        return "#6366F1";
      case "DELIVERED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      case "RETURNED":
        return "#F97316";
      default:
        return secondaryTextColor;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "time-outline";
      case "CONFIRMED":
        return "checkmark-circle-outline";
      case "PROCESSING":
        return "construct-outline";
      case "SHIPPED":
        return "airplane-outline";
      case "DELIVERED":
        return "checkmark-done-circle-outline";
      case "CANCELLED":
        return "close-circle-outline";
      case "RETURNED":
        return "return-down-back-outline";
      default:
        return "ellipse-outline";
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>ORDER</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: secondaryTextColor }}>Order not found</Text>
        </View>
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
        <Text style={[styles.title, { color: textColor }]}>ORDER DETAILS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.orderHeaderRow}>
            <View>
              <Text style={[styles.orderNumber, { color: textColor }]}>
                {order.orderNumber || `Order #${order.id}`}
              </Text>
              <Text style={[styles.orderDate, { color: secondaryTextColor }]}>
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            ITEMS
          </Text>
          {(order.orderItems || []).map((item: any) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: cardBackground }]}
            >
              {item.productImage ? (
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.itemImage}
                />
              ) : (
                <View style={[styles.itemImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={24} color="#ccc" />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: textColor }]}>
                  {item.productName}
                </Text>
                {item.brandName && (
                  <Text
                    style={[styles.itemBrand, { color: secondaryTextColor }]}
                  >
                    {item.brandName}
                  </Text>
                )}
                <View style={styles.itemMeta}>
                  {item.productColor && (
                    <Text
                      style={[styles.itemVariant, { color: secondaryTextColor }]}
                    >
                      {item.productColor}
                      {item.productSize ? ` / ${item.productSize}` : ""}
                    </Text>
                  )}
                  <Text
                    style={[styles.itemQty, { color: secondaryTextColor }]}
                  >
                    Qty: {item.quantity}
                  </Text>
                </View>
              </View>
              <Text style={[styles.itemPrice, { color: textColor }]}>
                ${Number(item.totalPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            PRICE BREAKDOWN
          </Text>
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: secondaryTextColor }]}>
                Subtotal
              </Text>
              <Text style={[styles.priceValue, { color: textColor }]}>
                ${Number(order.subtotal).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: secondaryTextColor }]}>
                Shipping
              </Text>
              <Text style={[styles.priceValue, { color: textColor }]}>
                ${Number(order.shippingCost || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: secondaryTextColor }]}>
                Tax
              </Text>
              <Text style={[styles.priceValue, { color: textColor }]}>
                ${Number(order.taxAmount || 0).toFixed(2)}
              </Text>
            </View>
            {Number(order.discountAmount) > 0 && (
              <View style={styles.priceRow}>
                <Text
                  style={[styles.priceLabel, { color: secondaryTextColor }]}
                >
                  Discount
                </Text>
                <Text style={[styles.priceValue, { color: "#10B981" }]}>
                  -${Number(order.discountAmount).toFixed(2)}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.divider,
                { backgroundColor: secondaryTextColor + "20" },
              ]}
            />
            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: textColor }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: textColor }]}>
                ${Number(order.totalAmount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              SHIPPING ADDRESS
            </Text>
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <Text style={[styles.addressName, { color: textColor }]}>
                {order.shippingAddress.fullName}
              </Text>
              <Text
                style={[styles.addressLine, { color: secondaryTextColor }]}
              >
                {order.shippingAddress.addressLine1}
              </Text>
              {order.shippingAddress.addressLine2 && (
                <Text
                  style={[styles.addressLine, { color: secondaryTextColor }]}
                >
                  {order.shippingAddress.addressLine2}
                </Text>
              )}
              <Text
                style={[styles.addressLine, { color: secondaryTextColor }]}
              >
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </Text>
              <Text
                style={[styles.addressLine, { color: secondaryTextColor }]}
              >
                {order.shippingAddress.country}
              </Text>
            </View>
          </View>
        )}

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            ORDER TIMELINE
          </Text>
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            {history.length === 0 ? (
              <Text style={[styles.emptyTimeline, { color: secondaryTextColor }]}>
                No status updates yet.
              </Text>
            ) : (
              history.map((entry, index) => {
                const isLast = index === history.length - 1;
                const statusColor = getStatusColor(entry.newStatus);
                return (
                  <View key={entry.id} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: isLast
                              ? statusColor
                              : statusColor + "40",
                          },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(entry.newStatus) as any}
                          size={14}
                          color={isLast ? "#fff" : statusColor}
                        />
                      </View>
                      {index < history.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: secondaryTextColor + "30" },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineStatus,
                          { color: isLast ? textColor : secondaryTextColor },
                        ]}
                      >
                        {entry.newStatus}
                      </Text>
                      {entry.notes && (
                        <Text
                          style={[
                            styles.timelineNotes,
                            { color: secondaryTextColor },
                          ]}
                        >
                          {entry.notes}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.timelineDate,
                          { color: secondaryTextColor + "80" },
                        ]}
                      >
                        {new Date(entry.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 11,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: "row",
    gap: 12,
  },
  itemVariant: {
    fontSize: 12,
  },
  itemQty: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyTimeline: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 60,
  },
  timelineDotCol: {
    alignItems: "center",
    width: 36,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timelineNotes: {
    fontSize: 13,
    marginTop: 2,
  },
  timelineDate: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default OrderDetailScreen;
