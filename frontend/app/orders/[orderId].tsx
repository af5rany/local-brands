import React, { useEffect, useState, useMemo } from "react";
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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

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
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showTracking, setShowTracking] = useState(false);

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

  const fetchTracking = async () => {
    if (!order?.trackingNumber) {
      Alert.alert("No Tracking", "No tracking number available for this order.");
      return;
    }
    setTrackingLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/orders/${orderId}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTrackingData(await res.json());
        setShowTracking(true);
      } else {
        Alert.alert("Error", "Could not fetch tracking information");
      }
    } catch {
      Alert.alert("Error", "Could not fetch tracking information");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    const items = order.orderItems || [];
    const addr = order.shippingAddress;

    const itemRows = items
      .map(
        (item: any) => `
        <tr>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;">${item.productName}${item.productColor ? ` <span style="color:#888;font-size:11px;">${item.productColor}</span>` : ""}${item.productSize ? ` <span style="color:#888;font-size:11px;">${item.productSize}</span>` : ""}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.unitPrice ?? item.totalPrice / item.quantity).toFixed(2)}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">$${Number(item.totalPrice).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const addrBlock = addr
      ? `<p style="margin:4px 0;">${addr.fullName || ""}</p>
         <p style="margin:4px 0;">${addr.addressLine1 || ""}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}</p>
         <p style="margin:4px 0;">${[addr.city, addr.state, addr.zipCode].filter(Boolean).join(", ")}</p>
         <p style="margin:4px 0;">${addr.country || ""}</p>`
      : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Helvetica, Arial, sans-serif; color: #111; padding: 40px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 900; letter-spacing: 4px; margin: 0 0 4px; }
    .subtitle { font-size: 10px; letter-spacing: 2px; color: #888; margin-bottom: 32px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .meta-block p { margin: 2px 0; }
    .meta-label { font-size: 9px; letter-spacing: 1.5px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    thead th { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #888; padding: 4px; border-bottom: 2px solid #111; text-align: left; }
    thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .totals { margin-left: auto; width: 240px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 12px; }
    .total-final { display: flex; justify-content: space-between; padding: 10px 0 0; font-size: 16px; font-weight: 900; }
    .footer { margin-top: 48px; font-size: 10px; color: #888; text-align: center; letter-spacing: 1px; }
  </style>
</head>
<body>
  <h1>LOCAL BRANDS</h1>
  <p class="subtitle">INVOICE</p>

  <div class="meta-row">
    <div class="meta-block">
      <p class="meta-label">Order</p>
      <p style="font-size:16px;font-weight:700;">#ORD-${String(order.id).padStart(4, "0")}</p>
      <p style="color:#888;font-size:12px;">${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p style="margin-top:6px;font-size:10px;font-weight:700;letter-spacing:1px;">${order.status?.toUpperCase()}</p>
    </div>
    ${addr ? `<div class="meta-block" style="text-align:right;">
      <p class="meta-label">Ship To</p>
      ${addrBlock}
    </div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>$${Number(order.subtotal).toFixed(2)}</span></div>
    <div class="totals-row"><span>Shipping</span><span>$${Number(order.shippingCost || 0).toFixed(2)}</span></div>
    <div class="totals-row"><span>Tax</span><span>$${Number(order.taxAmount || 0).toFixed(2)}</span></div>
    ${Number(order.discountAmount) > 0 ? `<div class="totals-row"><span>Discount</span><span>-$${Number(order.discountAmount).toFixed(2)}</span></div>` : ""}
    <div class="total-final"><span>Total</span><span>$${Number(order.totalAmount).toFixed(2)}</span></div>
  </div>

  <p class="footer">Thank you for shopping with Local Brands.</p>
</body>
</html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice #ORD-${String(order.id).padStart(4, "0")}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF saved", `Saved to: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "Could not generate invoice PDF.");
    }
  };

  const currentStep =
    STATUS_TO_STEP[order?.status?.toUpperCase() ?? ""] ?? -1;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
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
              <TouchableOpacity style={styles.btnOutlineWhite} onPress={handleDownloadInvoice}>
                <Text style={styles.btnOutlineWhiteText}>
                  DOWNLOAD INVOICE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnFilledWhite} onPress={fetchTracking} disabled={trackingLoading}>
                {trackingLoading ? <ActivityIndicator color={colors.text} size="small" /> : (
                  <Text style={styles.btnFilledWhiteText}>TRACK SHIPMENT</Text>
                )}
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

        {/* Carrier Tracking Events */}
        {showTracking && trackingData && (
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.background, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.surfaceRaised }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1.5, color: colors.text }}>
                SHIPMENT STATUS
              </Text>
              <TouchableOpacity onPress={() => setShowTracking(false)}>
                <Text style={{ fontSize: 11, color: colors.textTertiary }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 4, color: colors.text }}>{trackingData.status}</Text>
            {trackingData.estimatedDelivery && (
              <Text style={{ fontSize: 11, color: colors.textTertiary, marginBottom: 12 }}>
                Est. delivery: {new Date(trackingData.estimatedDelivery).toLocaleDateString()}
              </Text>
            )}
            {(trackingData.events || []).length > 0 && (
              <View style={{ marginTop: 8 }}>
                {(trackingData.events || []).map((e: any, i: number) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: 10, gap: 10 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text, marginTop: 5 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{e.description}</Text>
                      {e.location ? <Text style={{ fontSize: 11, color: colors.textTertiary }}>{e.location}</Text> : null}
                      {e.timestamp ? <Text style={{ fontSize: 10, color: colors.textTertiary }}>{e.timestamp}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
            {(trackingData.events || []).length === 0 && (
              <Text style={{ fontSize: 12, color: colors.textTertiary }}>No tracking events available yet.</Text>
            )}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
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
  notFoundText: {
    fontFamily: undefined,
    fontSize: 12,
    color: colors.textTertiary,
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
    color: colors.text,
    // letterSpacing: -0.5,
    flex: 1,
    marginRight: 12,
  },
  orderPlacedDate: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.textTertiary,
    // letterSpacing: 1,
    marginBottom: 6,
  },
  trackingText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.textTertiary,
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
    borderColor: colors.primary,
  },
  badgeDelivered: {
    borderColor: "rgba(0,0,0,0.3)",
  },
  badgeCancelled: {
    borderColor: colors.danger,
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
    color: colors.danger,
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
    backgroundColor: colors.text,
  },
  timelineBarPending: {
    backgroundColor: colors.border,
  },
  timelineLabel: {
    fontFamily: undefined,
    fontSize: 7,
    textTransform: "uppercase",
    // letterSpacing: 0.5,
  },
  timelineLabelDone: {
    color: colors.text,
    fontWeight: "700",
  },
  timelineLabelPending: {
    color: colors.textTertiary,
  },

  /* ── Section spacing ── */
  sectionGap: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
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
    backgroundColor: colors.surfaceRaised,
    marginRight: 16,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.surfaceRaised,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: undefined,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
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
    color: colors.textTertiary,
    marginBottom: 4,
  },
  itemTotal: {
    fontFamily: undefined,
    fontSize: 12,
    color: colors.text,
    fontWeight: "700",
  },

  /* ── Logistics box ── */
  logisticsBox: {
    backgroundColor: colors.surfaceRaised,
    padding: 20,
    borderRadius: 0,
  },
  logisticsLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
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
    color: colors.textTertiary,
    // letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  logisticsVal: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 0.5,
    lineHeight: 18,
  },

  /* ── Financial summary box ── */
  financialBox: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 0,
  },
  financialLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.primaryForeground,
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
    color: colors.primaryForeground,
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
    color: colors.primaryForeground,
  },

  /* Action buttons */
  actionButtons: {
    gap: 12,
  },
  btnOutlineWhite: {
    borderWidth: 1,
    borderColor: colors.primaryForeground,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 0,
  },
  btnOutlineWhiteText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.primaryForeground,
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
  btnFilledWhite: {
    backgroundColor: colors.background,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 0,
  },
  btnFilledWhiteText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default OrderDetailScreen;
