import React, { useState, useCallback, useRef } from "react";
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
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";

const COLORS = {
  background: "#f9f9f9",
  black: "#000000",
  white: "#ffffff",
  surfaceContainer: "#eeeeee",
  gray: "#777777",
  error: "#C41E3A",
};

const FONTS = {
  headline: undefined,
  mono: undefined,
  body: "Inter_400Regular",
};

// ── Marquee strip ────────────────────────────────────────────────────────────
const MARQUEE_TEXT =
  "FREE SHIPPING ON ORDERS OVER $150  ·  SECURE CHECKOUT  ·  FREE SHIPPING ON ORDERS OVER $150  ·  SECURE CHECKOUT  ·  ";

const MarqueeStrip = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -600,
        duration: 14000,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.marqueeWrap}>
      <Animated.Text
        style={[styles.marqueeText, { transform: [{ translateX }] }]}
        numberOfLines={1}
      >
        {MARQUEE_TEXT + MARQUEE_TEXT}
      </Animated.Text>
    </View>
  );
};

// ── Stepped section header ───────────────────────────────────────────────────
const StepHeader = ({
  number,
  label,
  action,
  onAction,
}: {
  number: string;
  label: string;
  action?: string;
  onAction?: () => void;
}) => (
  <View style={styles.stepHeader}>
    <Text style={styles.stepLabel}>
      {number} / {label}
    </Text>
    {action && onAction && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.stepAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
const CheckoutScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ discount: number; code: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [availableRates, setAvailableRates] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);
  const [cartExpanded, setCartExpanded] = useState(false);
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
        const chosen = defaultAddr || addrData[0];
        if (chosen) {
          setSelectedAddressId(chosen.id);
          await fetchShippingRates(chosen);
        }
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
    }, [fetchData])
  );

  const fetchShippingRates = async (addr: any) => {
    if (!addr?.country) return;
    try {
      const brandIds = [...new Set((cart?.cartItems || []).map((i: any) => i.product?.brandId).filter(Boolean))];
      if (brandIds.length === 0) return;
      const brandId = brandIds[0];
      const res = await fetch(`${getApiUrl()}/shipping/calculate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, countryCode: addr.country }),
      });
      if (res.ok) {
        const data = await res.json();
        const rates = data.rates || [];
        setAvailableRates(rates);
        if (rates.length > 0) setSelectedRateId(rates[0].id);
      }
    } catch {}
  };

  const handleAddressSelect = async (addr: any) => {
    setSelectedAddressId(addr.id);
    await fetchShippingRates(addr);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(`${getApiUrl()}/promo-codes/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), cartTotal: subtotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromoApplied({ discount: data.discountAmount, code: data.code });
        setPromoError("");
      } else {
        setPromoError(data.message || "Invalid promo code");
        setPromoApplied(null);
      }
    } catch {
      setPromoError("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const generateIdempotencyKey = () =>
    "key_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert("Shipping Required", "Please select or add a shipping address.");
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
          paymentMethod: "credit_card",
          idempotencyKey,
          promoCode: promoApplied?.code,
          shippingCost: selectedRate ? Number(selectedRate.price) : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Checkout failed");
      }

      const orders: any[] = await response.json();
      refreshCart();
      // Multiple orders created (one per brand) — summarise for confirmation screen
      const firstOrder = orders[0] || {};
      const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.totalAmount || 0), 0);
      const totalItems = orders.reduce((s: number, o: any) => s + Number(o.totalItems || 0), 0);
      router.replace({
        pathname: "/checkout/confirmation",
        params: {
          orderId: firstOrder.id?.toString() || "",
          orderNumber: orders.map((o: any) => o.orderNumber).filter(Boolean).join(", "),
          total: totalAmount.toFixed(2),
          itemCount: totalItems.toString(),
          orderCount: orders.length.toString(),
        },
      } as any);
    } catch (error: any) {
      Alert.alert("Checkout Failed", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const cartItems = cart?.cartItems || cart?.items || [];
  const cartTotal = cart?.totalAmount || 0;
  const isEmpty = !cart || cartItems.length === 0;

  const subtotal = cartItems.reduce(
    (sum: number, item: any) =>
      sum + Number(item.unitPrice || 0) * (item.quantity || 1),
    0
  );
  const selectedRate = availableRates.find((r) => r.id === selectedRateId);
  const shippingCost = selectedRate ? Number(selectedRate.price) : 0;
  const promoDiscount = promoApplied?.discount || 0;
  const tax = subtotal * 0.08;
  const total = Math.max(0, subtotal + shippingCost + tax - promoDiscount);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.black} />
        </View>
      </SafeAreaView>
    );
  }

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>NO ITEMS TO CHECKOUT</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} />
      <MarqueeStrip />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 01 / CART SUMMARY ── */}
        <View style={styles.section}>
          <StepHeader
            number="01"
            label="CART SUMMARY"
            action={cartExpanded ? "COLLAPSE" : "EXPAND"}
            onAction={() => setCartExpanded((v) => !v)}
          />

          {/* Collapsed summary */}
          {!cartExpanded ? (
            <TouchableOpacity
              style={styles.collapsedCart}
              onPress={() => setCartExpanded(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.collapsedCartCount}>
                {cartItems.length} ITEM{cartItems.length !== 1 ? "S" : ""}
              </Text>
              <Text style={styles.collapsedCartTotal}>${subtotal.toFixed(2)}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.expandedCart}>
              {cartItems.map((item: any) => {
                const product = item.product || {};
                const variant = item.variant || {};
                const image =
                  variant?.images?.[0] || product?.images?.[0] || "";
                const itemPrice = Number(item.unitPrice || 0);
                const qty = item.quantity || 1;

                return (
                  <View key={item.id} style={styles.cartItem}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.cartItemImage} />
                    ) : (
                      <View
                        style={[
                          styles.cartItemImage,
                          { backgroundColor: COLORS.surfaceContainer },
                        ]}
                      />
                    )}
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemBrand} numberOfLines={1}>
                        {product.brand?.name || ""}
                      </Text>
                      <Text style={styles.cartItemName} numberOfLines={2}>
                        {product.name || "Product"}
                      </Text>
                      {(item.selectedColor ||
                        item.selectedSize ||
                        variant?.attributes?.color ||
                        variant?.attributes?.size) && (
                        <Text style={styles.cartItemVariant}>
                          {[
                            variant?.attributes?.color || item.selectedColor,
                            variant?.attributes?.size || item.selectedSize,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </Text>
                      )}
                    </View>
                    <View style={styles.cartItemRight}>
                      <Text style={styles.cartItemPrice}>
                        ${(itemPrice * qty).toFixed(2)}
                      </Text>
                      <Text style={styles.cartItemQty}>QTY: {qty}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── 02 / SHIPPING ADDRESS ── */}
        <View style={styles.section}>
          <StepHeader
            number="02"
            label="SHIPPING ADDRESS"
            action="+ ADD NEW"
            onAction={() => router.push("/profile/addresses/new" as any)}
          />

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyAddress}
              onPress={() => router.push("/profile/addresses/new" as any)}
            >
              <Text style={styles.emptyAddressText}>
                NO ADDRESS FOUND — TAP TO ADD ONE
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
                    isSelected
                      ? styles.addressCardSelected
                      : styles.addressCardUnselected,
                  ]}
                  onPress={() => handleAddressSelect(addr)}
                  activeOpacity={0.8}
                >
                  {addr.label && (
                    <Text
                      style={[
                        styles.addressLabel,
                        { color: isSelected ? "rgba(255,255,255,0.6)" : COLORS.gray },
                      ]}
                    >
                      {addr.label.toUpperCase()}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.addressName,
                      { color: isSelected ? COLORS.white : COLORS.black },
                    ]}
                  >
                    {(addr.fullName || "").toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.addressLines,
                      { color: isSelected ? "rgba(255,255,255,0.8)" : COLORS.gray },
                    ]}
                  >
                    {[addr.addressLine1, addr.city, addr.state, addr.zipCode]
                      .filter(Boolean)
                      .join("\n")}
                  </Text>
                  {addr.phone && (
                    <Text
                      style={[
                        styles.addressLines,
                        { color: isSelected ? "rgba(255,255,255,0.6)" : COLORS.gray },
                      ]}
                    >
                      {addr.phone}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── 03 / SHIPPING METHOD ── */}
        <View style={styles.section}>
          <StepHeader number="03" label="SHIPPING METHOD" />

          {availableRates.length === 0 ? (
            <View style={styles.shippingOption}>
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingOptionText}>STANDARD SHIPPING</Text>
                <Text style={styles.shippingPrice}>FREE</Text>
              </View>
            </View>
          ) : (
            availableRates.map((rate: any) => (
              <TouchableOpacity
                key={rate.id}
                style={styles.shippingOption}
                onPress={() => setSelectedRateId(rate.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.shippingBullet}>
                  {selectedRateId === rate.id ? "■" : "□"}
                </Text>
                <View style={styles.shippingInfo}>
                  <Text style={styles.shippingOptionText}>
                    {rate.methodName.toUpperCase()} — {rate.estimatedDays} DAYS
                  </Text>
                  <Text style={styles.shippingPrice}>
                    {Number(rate.price) === 0 ? "FREE" : `$${Number(rate.price).toFixed(2)}`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── ORDER SUMMARY ── */}
        <View style={styles.orderSummary}>
          <Text style={styles.orderSummaryTitle}>ORDER SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SUBTOTAL</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SHIPPING</Text>
            <Text style={styles.summaryValue}>
              {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ESTIMATED TAX</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, { marginTop: 24 }]}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
          </View>

          {/* Promo code */}
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.promoInput, promoApplied ? { borderBottomColor: "#22c55e" } : {}]}
              placeholder="PROMO CODE"
              placeholderTextColor={COLORS.gray}
              value={promoCode}
              onChangeText={(t) => { setPromoCode(t); setPromoError(""); if (!t) setPromoApplied(null); }}
              autoCapitalize="characters"
              editable={!promoApplied}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={promoApplied ? () => { setPromoApplied(null); setPromoCode(""); } : handleApplyPromo}
              disabled={promoLoading}
            >
              <Text style={styles.applyText}>{promoApplied ? "REMOVE" : promoLoading ? "..." : "APPLY"}</Text>
            </TouchableOpacity>
          </View>
          {promoError ? <Text style={{ color: COLORS.error, fontSize: 11, fontFamily: FONTS.mono, marginBottom: 8 }}>{promoError}</Text> : null}
          {promoApplied ? <Text style={{ color: "#22c55e", fontSize: 11, fontFamily: FONTS.mono, marginBottom: 8 }}>PROMO APPLIED: -{promoApplied.code}</Text> : null}
          {promoApplied && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#22c55e" }]}>DISCOUNT</Text>
              <Text style={[styles.summaryValue, { color: "#22c55e" }]}>-${promoDiscount.toFixed(2)}</Text>
            </View>
          )}

          {/* Place order button */}
          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              (processing || !selectedAddressId) && { opacity: 0.4 },
            ]}
            onPress={handleCheckout}
            disabled={processing || !selectedAddressId}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.placeOrderText}>PLACE ORDER</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    // letterSpacing: 2,
    color: COLORS.black,
  },
  goBackBtn: {
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  goBackText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.black,
  },

  // Marquee
  marqueeWrap: {
    backgroundColor: COLORS.black,
    paddingVertical: 8,
    overflow: "hidden",
  },
  marqueeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.white,
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // Section
  section: { marginBottom: 48 },

  // Step header
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    paddingBottom: 12,
    marginBottom: 24,
  },
  stepLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.black,
    textTransform: "uppercase",
  },
  stepAction: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    // letterSpacing: 2,
    color: COLORS.black,
    textDecorationLine: "underline",
    textTransform: "uppercase",
  },

  // Collapsed cart
  collapsedCart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
  },
  collapsedCartCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.gray,
  },
  collapsedCartTotal: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.black,
  },

  // Expanded cart items
  expandedCart: { gap: 0 },
  cartItem: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  cartItemImage: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.surfaceContainer,
  },
  cartItemInfo: { flex: 1 },
  cartItemBrand: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    // letterSpacing: 1,
    color: COLORS.gray,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cartItemName: {
    fontFamily: FONTS.headline,
    fontSize: 13,
    color: COLORS.black,
    marginBottom: 4,
  },
  cartItemVariant: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gray,
    // letterSpacing: 1,
  },
  cartItemRight: { alignItems: "flex-end", justifyContent: "space-between" },
  cartItemPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.black,
  },
  cartItemQty: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gray,
    // letterSpacing: 1,
  },

  // Address cards
  addressCard: {
    padding: 20,
    marginBottom: 8,
  },
  addressCardSelected: {
    backgroundColor: COLORS.black,
  },
  addressCardUnselected: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  addressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  addressName: {
    fontFamily: FONTS.headline,
    fontSize: 14,
    // letterSpacing: 0.5,
    marginBottom: 8,
  },
  addressLines: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    lineHeight: 18,
    // letterSpacing: 0.5,
  },
  emptyAddress: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyAddressText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    // letterSpacing: 2,
    color: COLORS.gray,
  },

  // Shipping options
  shippingOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    marginBottom: 4,
  },
  shippingBullet: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.black,
    width: 20,
  },
  shippingInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shippingOptionText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 1,
    color: COLORS.black,
  },
  shippingPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.black,
  },

  // Order summary block
  orderSummary: {
    backgroundColor: COLORS.surfaceContainer,
    padding: 24,
    marginBottom: 0,
  },
  orderSummaryTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    // letterSpacing: 3,
    color: COLORS.gray,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    // letterSpacing: 2,
    color: COLORS.gray,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.black,
  },
  summaryTotalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.black,
    textTransform: "uppercase",
  },
  summaryTotalValue: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.black,
  },

  // Promo
  promoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  promoInput: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.black,
  },
  applyText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    // letterSpacing: 2,
    color: COLORS.black,
    paddingBottom: 8,
  },

  // Place order
  placeOrderBtn: {
    backgroundColor: COLORS.black,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    // letterSpacing: 3,
    color: COLORS.white,
    textTransform: "uppercase",
  },
});

export default CheckoutScreen;
