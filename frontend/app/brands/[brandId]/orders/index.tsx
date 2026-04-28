import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import getApiUrl from "@/helpers/getApiUrl";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";

interface BrandOrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productColor?: string;
  productSize?: string;
}

interface BrandOrder {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  trackingNumber?: string;
  user?: { name?: string; email?: string };
  brandItems?: BrandOrderItem[];
}

const STATUS_COLOR = (status: string, colors: ThemeColors): string => {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
    case "COMPLETED":
      return colors.success;
    case "CANCELLED":
      return colors.danger;
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return colors.info ?? colors.primary;
    default:
      return colors.textSecondary;
  }
};

// What action a brand owner can take from a given status
const NEXT_ACTION: Record<string, { label: string; nextStatus: string; requiresTracking?: boolean } | null> = {
  PENDING: { label: "CONFIRM ORDER", nextStatus: "CONFIRMED" },
  CONFIRMED: { label: "MARK PROCESSING", nextStatus: "PROCESSING" },
  PROCESSING: { label: "MARK AS SHIPPED", nextStatus: "SHIPPED", requiresTracking: true },
  SHIPPED: { label: "MARK DELIVERED", nextStatus: "DELIVERED" },
  DELIVERED: null,
  CANCELLED: null,
};

const BrandOrdersScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { token } = useAuth();

  const { isConnected } = useNetwork();
  const [orders, setOrders] = useState<BrandOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fulfilling, setFulfilling] = useState<number | null>(null);

  // Tracking number modal state
  const [trackingModal, setTrackingModal] = useState<{ orderId: number } | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingSubmitting, setTrackingSubmitting] = useState(false);

  const fetchOrders = useCallback(async (pageNum = 1, replace = true) => {
    if (!token || !brandId) return;
    try {
      const res = await fetch(
        `${getApiUrl()}/orders/brand/${brandId}?page=${pageNum}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(replace ? data.data : (prev) => [...prev, ...data.data]);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setPage(pageNum);
      }
    } catch (e) {
      console.error("Error fetching brand orders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token, brandId]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1);
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchOrders(page + 1, false);
  };

  const fulfillOrder = useCallback(async (
    orderId: number,
    nextStatus: string,
    trackingNumber?: string,
    notes?: string,
  ) => {
    if (!token) return;
    setFulfilling(orderId);
    try {
      const body: Record<string, string> = { status: nextStatus };
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (notes) body.notes = notes;

      const res = await fetch(`${getApiUrl()}/orders/${orderId}/fulfill`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update order");
      }

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: nextStatus, ...(trackingNumber ? { trackingNumber } : {}) }
            : o,
        ),
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not update order status.");
    } finally {
      setFulfilling(null);
    }
  }, [token]);

  const handleActionPress = useCallback((order: BrandOrder) => {
    const action = NEXT_ACTION[order.status?.toUpperCase()];
    if (!action) return;

    if (action.requiresTracking) {
      setTrackingInput("");
      setTrackingModal({ orderId: order.id });
      return;
    }

    Alert.alert(
      action.label,
      `Update order #ORD-${String(order.id).padStart(4, "0")} to ${action.nextStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => fulfillOrder(order.id, action.nextStatus),
        },
      ],
    );
  }, [fulfillOrder]);

  const handleTrackingSubmit = async () => {
    if (!trackingModal) return;
    const tracking = trackingInput.trim();
    if (!tracking) {
      Alert.alert("Required", "Please enter a tracking number.");
      return;
    }
    setTrackingSubmitting(true);
    await fulfillOrder(trackingModal.orderId, "SHIPPED", tracking);
    setTrackingSubmitting(false);
    setTrackingModal(null);
  };

  const renderOrder = ({ item }: { item: BrandOrder }) => {
    const statusColor = STATUS_COLOR(item.status, colors);
    const customerName = item.user?.name || item.user?.email || "Customer";
    const action = NEXT_ACTION[item.status?.toUpperCase()];
    const isFulfilling = fulfilling === item.id;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.orderTop}>
          <Text style={styles.orderNumber}>
            #ORD-{String(item.id).padStart(4, "0")}
          </Text>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>{customerName}</Text>

        {item.brandItems && item.brandItems.length > 0 && (
          <View style={styles.itemsPreview}>
            {item.brandItems.slice(0, 2).map((bi) => (
              <Text key={bi.id} style={styles.itemPreviewText} numberOfLines={1}>
                {bi.productName}{bi.productColor ? ` · ${bi.productColor}` : ""}{bi.productSize ? ` · ${bi.productSize}` : ""} × {bi.quantity}
              </Text>
            ))}
            {item.brandItems.length > 2 && (
              <Text style={styles.moreItems}>+{item.brandItems.length - 2} more</Text>
            )}
          </View>
        )}

        {item.trackingNumber && (
          <Text style={styles.trackingText}>
            Tracking: {item.trackingNumber}
          </Text>
        )}

        <View style={styles.orderBottom}>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.orderTotal}>
            ${Number(item.totalAmount).toFixed(2)}
          </Text>
        </View>

        {action && (
          <TouchableOpacity
            style={[styles.actionBtn, isFulfilling && styles.actionBtnDisabled]}
            onPress={(e) => { e.stopPropagation?.(); handleActionPress(item); }}
            disabled={isFulfilling}
            activeOpacity={0.7}
          >
            {isFulfilling ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.actionBtnText}>{action.label}</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const ListFooter = () =>
    loadingMore ? (
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={{ marginVertical: 16 }}
      />
    ) : null;

  const ListEmpty = () =>
    loading ? null : (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.emptyText}>No orders yet.</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDERS</Text>
        <View style={styles.backBtn} />
      </View>

      {!isConnected && orders.length === 0 ? (
        <OfflinePlaceholder onRetry={() => fetchOrders(1)} />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
        />
      )}

      {/* Tracking number modal */}
      <Modal
        visible={!!trackingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackingModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ENTER TRACKING NUMBER</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1Z999AA10123456784"
              placeholderTextColor={colors.textTertiary}
              value={trackingInput}
              onChangeText={setTrackingInput}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTrackingModal(null)}
                disabled={trackingSubmitting}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, trackingSubmitting && styles.actionBtnDisabled]}
                onPress={handleTrackingSubmit}
                disabled={trackingSubmitting}
              >
                {trackingSubmitting ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.modalConfirmText}>SHIP ORDER</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backBtn: { width: 40 },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
      gap: 12,
    },
    orderCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 6,
    },
    orderTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    statusBadge: {
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusText: {
      fontSize: 9,
      fontWeight: "800",
    },
    customerName: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    itemsPreview: {
      marginTop: 4,
      gap: 2,
    },
    itemPreviewText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    moreItems: {
      fontSize: 11,
      color: colors.textTertiary,
      fontStyle: "italic",
    },
    trackingText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    orderBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    orderDate: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    orderTotal: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    actionBtn: {
      marginTop: 10,
      backgroundColor: colors.text,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 38,
    },
    actionBtnDisabled: {
      opacity: 0.5,
    },
    actionBtnText: {
      color: colors.background,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      width: "100%",
      gap: 16,
    },
    modalTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.8,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalCancelText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    modalConfirmBtn: {
      flex: 2,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: colors.text,
      minHeight: 38,
      justifyContent: "center",
    },
    modalConfirmText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.background,
      letterSpacing: 0.8,
    },
  });

export default BrandOrdersScreen;
