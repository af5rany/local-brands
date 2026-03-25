import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
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
      case "CANCELLED":
        return "#C41E3A";
      default:
        return "#000000";
    }
  };

  const copyTrackingNumber = () => {
    if (!order?.trackingNumber) return;
    Alert.alert("Copied", "Tracking number copied to clipboard.");
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
                { backgroundColor: getStatusColor(order.status) + "15" },
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

          {/* Estimated Delivery */}
          {order.estimatedDeliveryDate && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <View style={[styles.deliveryRow, { borderTopColor: secondaryTextColor + "15" }]}>
              <Ionicons name="time-outline" size={14} color={secondaryTextColor} />
              <Text style={[styles.deliveryText, { color: secondaryTextColor }]}>
                ESTIMATED DELIVERY{" "}
                <Text style={{ color: textColor, fontWeight: "700" }}>
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Text>
            </View>
          )}

          {order.status === "DELIVERED" && order.deliveredAt && (
            <View style={[styles.deliveryRow, { borderTopColor: secondaryTextColor + "15" }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#000000" />
              <Text style={[styles.deliveryText, { color: textColor }]}>
                DELIVERED{" "}
                <Text style={{ fontWeight: "700" }}>
                  {new Date(order.deliveredAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* Tracking Number */}
        {order.trackingNumber && (
          <TouchableOpacity
            style={[styles.trackingCard, { backgroundColor: cardBackground }]}
            onPress={copyTrackingNumber}
            activeOpacity={0.7}
          >
            <View style={styles.trackingLeft}>
              <Text style={[styles.trackingLabel, { color: secondaryTextColor }]}>
                TRACKING NUMBER
              </Text>
              <Text style={[styles.trackingValue, { color: textColor }]}>
                {order.trackingNumber}
              </Text>
            </View>
            <Ionicons name="copy-outline" size={18} color={secondaryTextColor} />
          </TouchableOpacity>
        )}

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
                <Text style={[styles.priceValue, { color: "#666666" }]}>
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
                const isCancelled = entry.newStatus === "CANCELLED";
                return (
                  <View key={entry.id} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: isLast
                              ? isCancelled
                                ? "#C41E3A"
                                : "#000000"
                              : "#D4D4D4",
                          },
                        ]}
                      />
                      {index < history.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: "#E5E5E5" },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineStatus,
                          {
                            color: isLast
                              ? isCancelled
                                ? "#C41E3A"
                                : textColor
                              : secondaryTextColor,
                          },
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
    borderRadius: 0,
    padding: 16,
    marginBottom: 8,
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
    borderRadius: 0,
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
    borderRadius: 0,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 0,
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
    width: 10,
    height: 10,
    borderRadius: 0,
    marginTop: 4,
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
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  deliveryText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  trackingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 0,
    marginBottom: 8,
  },
  trackingLeft: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default OrderDetailScreen;
