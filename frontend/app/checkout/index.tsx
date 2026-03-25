import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

const PAYMENT_METHODS = [
  { key: "credit_card", label: "Credit Card", icon: "card-outline" as const },
  { key: "debit_card", label: "Debit Card", icon: "card-outline" as const },
  { key: "paypal", label: "PayPal", icon: "logo-paypal" as const },
  {
    key: "cash_on_delivery",
    label: "Cash on Delivery",
    icon: "cash-outline" as const,
  },
];

const CheckoutScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();

  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState("credit_card");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [cartRes, addrRes] = await Promise.all([
        fetch(`${getApiUrl()}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCart(cartData);
      }
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData);
        const defaultAddr = addrData.find((a: any) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else if (addrData.length > 0) setSelectedAddressId(addrData[0].id);
      }
    } catch (error) {
      console.error("Error fetching checkout data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const generateIdempotencyKey = () =>
    "key_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert(
        "Shipping Required",
        "Please select or add a shipping address.",
      );
      return;
    }

    setProcessing(true);
    try {
      const idempotencyKey = generateIdempotencyKey();
      const response = await fetch(`${getApiUrl()}/orders/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId,
          paymentMethod: selectedPayment,
          idempotencyKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Checkout failed");
      }

      const order = await response.json();
      Alert.alert(
        "Order Placed",
        `Order ${order.orderNumber || ""} has been placed successfully.`,
        [
          {
            text: "View Order",
            onPress: () =>
              router.replace(
                order.id ? (`/orders/${order.id}` as any) : ("/orders" as any),
              ),
          },
          { text: "Continue Shopping", onPress: () => router.replace("/" as any) },
        ],
      );
    } catch (error: any) {
      Alert.alert("Checkout Failed", error.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // The cart API returns { cartItems, totalAmount, totalItems }
  const cartItems = cart?.cartItems || cart?.items || [];
  const cartTotal = cart?.totalAmount || 0;

  // ── Empty cart ──
  if (!cart || cartItems.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Ionicons
          name="bag-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text
          style={[
            styles.emptyTitle,
            { color: colors.text, marginTop: 12 },
          ]}
        >
          No items to checkout
        </Text>
        <TouchableOpacity
          style={[styles.goBackBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.goBackText, { color: colors.text }]}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Subtotal from items ──
  const subtotal = cartItems.reduce(
    (sum: number, item: any) =>
      sum + Number(item.unitPrice || 0) * (item.quantity || 1),
    0,
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.borderLight }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>CHECKOUT</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Shipping Address ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: colors.textTertiary }]}
            >
              SHIPPING ADDRESS
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/addresses/new" as any)}
            >
              <Text style={[styles.addText, { color: colors.text }]}>
                + ADD NEW
              </Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={[
                styles.emptyAddress,
                { borderColor: colors.border },
              ]}
              onPress={() => router.push("/profile/addresses/new" as any)}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.emptyAddressText,
                  { color: colors.textTertiary },
                ]}
              >
                No address found. Tap to add one.
              </Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected
                        ? colors.text
                        : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedAddressId(addr.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressInfo}>
                    <Text
                      style={[styles.addressName, { color: colors.text }]}
                    >
                      {addr.fullName || addr.label || "Address"}
                    </Text>
                    <Text
                      style={[
                        styles.addressDetails,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {[addr.addressLine1, addr.city, addr.state, addr.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                    {addr.phone && (
                      <Text
                        style={[
                          styles.addressPhone,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {addr.phone}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={
                      isSelected ? "radio-button-on" : "radio-button-off"
                    }
                    size={20}
                    color={isSelected ? colors.text : colors.textTertiary}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Order Items ── */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.textTertiary }]}
          >
            ORDER SUMMARY ({cartItems.length} item
            {cartItems.length !== 1 ? "s" : ""})
          </Text>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {cartItems.map((item: any) => {
              const product = item.product || {};
              const variant = item.variant || {};
              const image =
                variant?.images?.[0] ||
                product?.images?.[0] ||
                "";
              const itemPrice = Number(item.unitPrice || 0);
              const qty = item.quantity || 1;

              return (
                <View key={item.id} style={styles.orderItem}>
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={[
                        styles.itemImage,
                        { backgroundColor: colors.surfaceRaised },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.itemImage,
                        { backgroundColor: colors.surfaceRaised },
                      ]}
                    />
                  )}
                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        styles.itemBrand,
                        { color: colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {product.brand?.name || ""}
                    </Text>
                    <Text
                      style={[styles.itemName, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {product.name || "Product"}
                    </Text>
                    {(item.selectedColor || item.selectedSize || variant?.attributes?.color || variant?.attributes?.size) && (
                      <Text
                        style={[
                          styles.itemVariant,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {[
                          variant?.attributes?.color || item.selectedColor,
                          variant?.attributes?.size || item.selectedSize,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </Text>
                    )}
                    <View style={styles.itemPriceRow}>
                      <Text
                        style={[
                          styles.itemPrice,
                          { color: colors.text },
                        ]}
                      >
                        ${itemPrice.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.itemQty,
                          { color: colors.textTertiary },
                        ]}
                      >
                        x {qty}
                      </Text>
                      <Text
                        style={[
                          styles.itemTotal,
                          { color: colors.text },
                        ]}
                      >
                        ${(itemPrice * qty).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            <View
              style={[styles.divider, { backgroundColor: colors.borderLight }]}
            />

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalLine}>
                <Text
                  style={[styles.totalLineLabel, { color: colors.textTertiary }]}
                >
                  Subtotal
                </Text>
                <Text
                  style={[styles.totalLineValue, { color: colors.text }]}
                >
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text
                  style={[styles.totalLineLabel, { color: colors.textTertiary }]}
                >
                  Tax (8%)
                </Text>
                <Text
                  style={[styles.totalLineValue, { color: colors.text }]}
                >
                  ${tax.toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text
                  style={[styles.totalLineLabel, { color: colors.textTertiary }]}
                >
                  Shipping
                </Text>
                <Text
                  style={[styles.totalLineValue, { color: colors.text }]}
                >
                  Free
                </Text>
              </View>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderLight, marginVertical: 12 },
                ]}
              />
              <View style={styles.totalLine}>
                <Text style={[styles.grandTotalLabel, { color: colors.text }]}>
                  Total
                </Text>
                <Text style={[styles.grandTotalValue, { color: colors.text }]}>
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Payment Method ── */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.textTertiary }]}
          >
            PAYMENT METHOD
          </Text>
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = selectedPayment === pm.key;
            return (
              <TouchableOpacity
                key={pm.key}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.text : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPayment(pm.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pm.icon}
                  size={20}
                  color={isSelected ? colors.text : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {pm.label}
                </Text>
                <Ionicons
                  name={
                    isSelected ? "radio-button-on" : "radio-button-off"
                  }
                  size={18}
                  color={isSelected ? colors.text : colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.footerTotal}>
          <Text style={[styles.footerTotalLabel, { color: colors.textTertiary }]}>
            TOTAL
          </Text>
          <Text style={[styles.footerTotalValue, { color: colors.text }]}>
            ${total.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            { backgroundColor: colors.primary },
            (processing || !selectedAddressId) && { opacity: 0.5 },
          ]}
          onPress={handleCheckout}
          disabled={processing || !selectedAddressId}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                styles.checkoutBtnText,
                { color: colors.primaryForeground },
              ]}
            >
              PLACE ORDER
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  goBackBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
  },
  goBackText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32 },
  title: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  scrollContent: { padding: 20 },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  addText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Address
  emptyAddress: {
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyAddressText: { fontSize: 12 },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
  },
  addressInfo: { flex: 1, marginRight: 12 },
  addressName: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  addressDetails: { fontSize: 12, lineHeight: 18 },
  addressPhone: { fontSize: 12, marginTop: 4 },

  // Order Items
  summaryCard: { borderWidth: 1, padding: 16 },
  orderItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  itemImage: { width: 56, height: 56 },
  itemInfo: { flex: 1 },
  itemBrand: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  itemName: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  itemVariant: { fontSize: 11, marginBottom: 4 },
  itemPriceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemPrice: { fontSize: 13, fontWeight: "700" },
  itemQty: { fontSize: 12 },
  itemTotal: { fontSize: 13, fontWeight: "700", marginLeft: "auto" },
  divider: { height: 1 },

  // Totals
  totalsSection: { marginTop: 4 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLineLabel: { fontSize: 13 },
  totalLineValue: { fontSize: 13, fontWeight: "600" },
  grandTotalLabel: { fontSize: 16, fontWeight: "800" },
  grandTotalValue: { fontSize: 18, fontWeight: "800" },

  // Payment
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  paymentLabel: { flex: 1, fontSize: 14 },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 1,
  },
  footerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  footerTotalLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  footerTotalValue: { fontSize: 20, fontWeight: "800" },
  checkoutBtn: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
});

export default CheckoutScreen;
