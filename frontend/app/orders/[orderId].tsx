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
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";

interface StatusHistoryItem {
  id: number;
  oldStatus: string | null;
  newStatus: string;
  notes: string;
  createdAt: string;
}

const TIMELINE_STEPS = [
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "OUT FOR DELIVERY",
  "DELIVERED",
];

const STATUS_TO_STEP: Record<string, number> = {
  PENDING: 0,
  PLACED: 0,
  CONFIRMED: 1,
  PROCESSING: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  "OUT FOR DELIVERY": 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

const OrderDetailScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const isCancelled = (status: string) =>
    status?.toUpperCase() === "CANCELLED";

  const getStatusBadgeStyle = (status: string) => {
    if (isCancelled(status)) return styles.badgeCancelled;
    const s = status?.toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return styles.badgeDelivered;
    return styles.badgeProcessing;
  };

  const getStatusTextStyle = (status: string) => {
    if (isCancelled(status)) return styles.badgeTextCancelled;
    const s = status?.toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return styles.badgeTextDelivered;
    return styles.badgeTextProcessing;
  };

  const copyTrackingNumber = () => {
    if (!order?.trackingNumber) return;
    Alert.alert("Copied", "Tracking number copied to clipboard.");
  };

  const currentStep =
    STATUS_TO_STEP[order?.status?.toUpperCase() ?? ""] ?? -1;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header showBack={true} />
        <View style={styles.center}>
          <Text style={styles.notFoundText}>ORDER NOT FOUND</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderItems = order.orderItems || [];
  const cancelled = isCancelled(order.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order header ── */}
        <View style={styles.orderHeaderBlock}>
          <View style={styles.orderHeaderTop}>
            <Text style={styles.orderNumberLarge}>
              #ORD-{String(order.id).padStart(4, "0")}
            </Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                {order.status?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.orderPlacedDate}>
            PLACED ON:{" "}
            {new Date(order.createdAt)
              .toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()}
          </Text>
          {order.trackingNumber && (
            <TouchableOpacity onPress={copyTrackingNumber} activeOpacity={0.7}>
              <Text style={styles.trackingText}>
                TRACKING: {order.trackingNumber}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Status timeline ── */}
        {!cancelled && (
          <View style={styles.timelineSection}>
            {TIMELINE_STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineTopBar,
                      done ? styles.timelineBarDone : styles.timelineBarPending,
                    ]}
                  />
                  <Text
                    style={[
                      styles.timelineLabel,
                      done
                        ? styles.timelineLabelDone
                        : styles.timelineLabelPending,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Manifest ── */}
        <View style={styles.sectionGap}>
          <Text style={styles.sectionLabel}>
            MANIFEST ({String(orderItems.length).padStart(2, "0")} ITEMS)
          </Text>
          {orderItems.map((item: any) => (
            <View key={item.id} style={styles.manifestItem}>
              {item.productImage ? (
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.itemImage}
                />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  {[item.brandName, item.productColor, item.productSize]
                    .filter(Boolean)
                    .join(" · ")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.itemPriceCol}>
                <Text style={styles.itemQtyPrice}>
                  {item.quantity} × ${Number(item.unitPrice ?? item.totalPrice / item.quantity).toFixed(2)}
                </Text>
                <Text style={styles.itemTotal}>
                  ${Number(item.totalPrice).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Logistics ── */}
        {order.shippingAddress && (
          <View style={styles.sectionGap}>
            <View style={styles.logisticsBox}>
              <Text style={styles.logisticsLabel}>LOGISTICS</Text>
              <View style={styles.logisticsRow}>
                <Text style={styles.logisticsKey}>DESTINATION</Text>
                <Text style={styles.logisticsVal}>
                  {[
                    order.shippingAddress.fullName,
                    order.shippingAddress.addressLine1,
                    order.shippingAddress.addressLine2,
                    [
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", "),
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join("\n")
                    .toUpperCase()}
                </Text>
              </View>
              {order.shippingMethodName && (
                <View style={styles.logisticsRow}>
                  <Text style={styles.logisticsKey}>SERVICE</Text>
                  <Text style={styles.logisticsVal}>
                    {order.shippingMethodName.toUpperCase()}
                  </Text>
                </View>
              )}
              {!order.shippingMethodName && order.shippingMethod && (
                <View style={styles.logisticsRow}>
                  <Text style={styles.logisticsKey}>METHOD</Text>
                  <Text style={styles.logisticsVal}>
                    {order.shippingMethod.toUpperCase()}
                  </Text>
                </View>
              )}
              {order.shippingCarrier && (
                <View style={styles.logisticsRow}>
                  <Text style={styles.logisticsKey}>CARRIER</Text>
                  <Text style={styles.logisticsVal}>
                    {order.shippingCarrier.toUpperCase()}
                  </Text>
                </View>
              )}
              {order.trackingNumber && (
                <View style={styles.logisticsRow}>
                  <Text style={styles.logisticsKey}>TRACKING</Text>
                  <Text style={styles.logisticsVal}>{order.trackingNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Financial summary ── */}
        <View style={styles.sectionGap}>
          <View style={styles.financialBox}>
            <Text style={styles.financialLabel}>FINANCIAL SUMMARY</Text>
            <View style={styles.financialRow}>
              <Text style={styles.financialKey}>SUBTOTAL</Text>
              <Text style={styles.financialVal}>
                ${Number(order.subtotal).toFixed(2)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialKey}>SHIPPING</Text>
              <Text style={styles.financialVal}>
                ${Number(order.shippingCost || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialKey}>TAX</Text>
              <Text style={styles.financialVal}>
                ${Number(order.taxAmount || 0).toFixed(2)}
              </Text>
            </View>
            {Number(order.discountAmount) > 0 && (
              <View style={styles.financialRow}>
                <Text style={styles.financialKey}>DISCOUNT</Text>
                <Text style={styles.financialVal}>
                  −${Number(order.discountAmount).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                ${Number(order.totalAmount).toFixed(2)}
              </Text>
            </View>

            {/* Buttons inside financial box */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnOutlineWhite}>
                <Text style={styles.btnOutlineWhiteText}>
                  DOWNLOAD INVOICE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnFilledWhite}>
                <Text style={styles.btnFilledWhiteText}>TRACK SHIPMENT</Text>
              </TouchableOpacity>
              {order.status?.toUpperCase() === "DELIVERED" && (
                <TouchableOpacity
                  style={styles.btnOutlineWhite}
                  onPress={() =>
                    router.push(
                      `/returns/create?orderId=${orderId}${order.brandId ? `&brandId=${order.brandId}` : ""}` as any
                    )
                  }
                >
                  <Text style={styles.btnOutlineWhiteText}>REQUEST RETURN</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontFamily: undefined,
    fontSize: 12,
    color: "#888888",
    // letterSpacing: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* ── Order header ── */
  orderHeaderBlock: {
    marginBottom: 40,
  },
  orderHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderNumberLarge: {
    fontFamily: undefined,
    fontSize: 28,
    color: "#000000",
    // letterSpacing: -0.5,
    flex: 1,
    marginRight: 12,
  },
  orderPlacedDate: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#888888",
    // letterSpacing: 1,
    marginBottom: 6,
  },
  trackingText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#888888",
    // letterSpacing: 1,
  },

  /* Status badge */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
  },
  badgeProcessing: {
    borderColor: "#000000",
  },
  badgeDelivered: {
    borderColor: "rgba(0,0,0,0.3)",
  },
  badgeCancelled: {
    borderColor: "#C41E3A",
  },
  statusText: {
    fontFamily: undefined,
    fontSize: 9,
    // letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  badgeTextProcessing: {
    color: "#000000",
  },
  badgeTextDelivered: {
    color: "#888888",
  },
  badgeTextCancelled: {
    color: "#C41E3A",
  },

  /* ── Status timeline ── */
  timelineSection: {
    flexDirection: "row",
    marginBottom: 48,
    gap: 4,
  },
  timelineStep: {
    flex: 1,
  },
  timelineTopBar: {
    height: 3,
    marginBottom: 8,
    borderRadius: 0,
  },
  timelineBarDone: {
    backgroundColor: "#000000",
  },
  timelineBarPending: {
    backgroundColor: "#cccccc",
  },
  timelineLabel: {
    fontFamily: undefined,
    fontSize: 7,
    textTransform: "uppercase",
    // letterSpacing: 0.5,
  },
  timelineLabelDone: {
    color: "#000000",
    fontWeight: "700",
  },
  timelineLabelPending: {
    color: "#aaaaaa",
  },

  /* ── Section spacing ── */
  sectionGap: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 20,
  },

  /* ── Manifest items ── */
  manifestItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: "#eeeeee",
    marginRight: 16,
  },
  itemImagePlaceholder: {
    backgroundColor: "#eeeeee",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: undefined,
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  itemMeta: {
    fontFamily: undefined,
    fontSize: 9,
    color: "#888888",
    // letterSpacing: 0.8,
    lineHeight: 14,
  },
  itemPriceCol: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  itemQtyPrice: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#888888",
    marginBottom: 4,
  },
  itemTotal: {
    fontFamily: undefined,
    fontSize: 12,
    color: "#000000",
    fontWeight: "700",
  },

  /* ── Logistics box ── */
  logisticsBox: {
    backgroundColor: "#eeeeee",
    padding: 20,
    borderRadius: 0,
  },
  logisticsLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 16,
  },
  logisticsRow: {
    marginBottom: 16,
  },
  logisticsKey: {
    fontFamily: undefined,
    fontSize: 9,
    color: "#888888",
    // letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  logisticsVal: {
    fontFamily: undefined,
    fontSize: 11,
    color: "#000000",
    // letterSpacing: 0.5,
    lineHeight: 18,
  },

  /* ── Financial summary box ── */
  financialBox: {
    backgroundColor: "#000000",
    padding: 20,
    borderRadius: 0,
  },
  financialLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 20,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  financialKey: {
    fontFamily: undefined,
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    // letterSpacing: 1,
    textTransform: "uppercase",
  },
  financialVal: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 0.5,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 20,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginBottom: 28,
  },
  grandTotalLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    // letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  grandTotalValue: {
    fontFamily: undefined,
    fontSize: 28,
    color: "#ffffff",
  },

  /* Action buttons */
  actionButtons: {
    gap: 12,
  },
  btnOutlineWhite: {
    borderWidth: 1,
    borderColor: "#ffffff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 0,
  },
  btnOutlineWhiteText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
  btnFilledWhite: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 0,
  },
  btnFilledWhiteText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default OrderDetailScreen;
