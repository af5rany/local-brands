import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import getApiUrl from "@/helpers/getApiUrl";

const MARQUEE_TEXT =
  "FREE SHIPPING ON ORDERS OVER $150 · COMPLIMENTARY GIFT WRAPPING · FREE SHIPPING ON ORDERS OVER $150 · COMPLIMENTARY GIFT WRAPPING · ";

const MarqueeStrip = () => {
  const translateX = useRef(new Animated.Value(0)).current;
  const textWidth = useRef(0);

  useEffect(() => {
    const startAnimation = () => {
      translateX.setValue(0);
      Animated.loop(
        Animated.timing(translateX, {
          toValue: -textWidth.current / 2,
          duration: 18000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    if (textWidth.current > 0) {
      startAnimation();
    }
  }, [translateX]);

  return (
    <View style={styles.marqueeContainer}>
      <Animated.Text
        style={[styles.marqueeText, { transform: [{ translateX }] }]}
        onLayout={(e) => {
          textWidth.current = e.nativeEvent.layout.width;
          translateX.setValue(0);
          Animated.loop(
            Animated.timing(translateX, {
              toValue: -e.nativeEvent.layout.width / 2,
              duration: 18000,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ).start();
        }}
        numberOfLines={1}
      >
        {MARQUEE_TEXT + MARQUEE_TEXT}
      </Animated.Text>
    </View>
  );
};

const CartScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingId(itemId);
    try {
      const response = await fetch(`${getApiUrl()}/cart/items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update quantity");
      await fetchCart();
      refreshCart();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `${getApiUrl()}/cart/items/${itemId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!response.ok) throw new Error("Failed to remove item");
            await fetchCart();
            refreshCart();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const variant = item.variant;
    const product = item.product;
    const image = product?.images?.[0] || product?.mainImage || "";

    const variantParts = [
      variant?.color ? variant.color.toUpperCase() : null,
      variant?.size ? `SIZE ${variant.size}` : null,
    ].filter(Boolean);

    return (
      <View style={[styles.cartItem, index > 0 && styles.cartItemGap]}>
        <View style={styles.cartItemRow}>
          <Image
            source={{ uri: image || "" }}
            style={styles.itemImage}
          />
          <View style={styles.itemDetails}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemName} numberOfLines={2}>
                {product.name.toUpperCase()}
              </Text>
              <Text style={styles.itemPrice}>
                ${Number(item.unitPrice).toFixed(2)}
              </Text>
            </View>
            {variantParts.length > 0 && (
              <Text style={styles.itemVariant}>
                {variantParts.join(" / ")}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.quantityRow}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || updatingId === item.id}
              style={styles.qtyBtn}
            >
              <Text
                style={[
                  styles.qtyBtnText,
                  item.quantity <= 1 && styles.qtyBtnDisabled,
                ]}
              >
                −
              </Text>
            </TouchableOpacity>

            <View style={styles.qtyCountBox}>
              {updatingId === item.id ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.qtyCount}>{item.quantity}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={updatingId === item.id}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Text style={styles.removeText}>REMOVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isEmpty = !cart || !cart.items || cart.items.length === 0;
  const itemCount = cart?.items?.length ?? 0;
  const refLabel = cart?.id
    ? `Ref. CART_${String(cart.id).padStart(4, "0")}`
    : `Ref. ${itemCount} ITEM${itemCount !== 1 ? "S" : ""}`;

  const renderContent = () => {
    if (!token) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>YOUR COLLECTION</Text>
          <Text style={styles.emptySubtitle}>
            Login to start curating your finds.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.actionBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>NO ITEMS GATHERED</Text>
          <Text style={styles.emptySubtitle}>
            Your personal collection is currently empty.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/" as any)}
          >
            <Text style={styles.actionBtnText}>DISCOVER PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={styles.collectionHeadline}>MY COLLECTION</Text>
          <Text style={styles.refLabel}>{refLabel}</Text>
        </View>

        <View style={styles.itemsList}>
          {cart.items.map((item: any, index: number) =>
            renderItem({ item, index })
          )}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SUBTOTAL</Text>
            <Text style={styles.summaryValue}>
              ${Number(cart.totalAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SHIPPING</Text>
            <Text style={styles.summaryValueSmall}>
              CALCULATED AT NEXT STEP
            </Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              ${Number(cart.totalAmount).toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push("/checkout" as any)}
          >
            <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
          </TouchableOpacity>

          <Text style={styles.checkoutNote}>
            ORDERS ARE PROCESSED WITHIN 24 HOURS. FREE RETURNS WITHIN 14 DAYS.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Header showBack={true} />
      <MarqueeStrip />
      <View style={styles.container}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },

  // Marquee
  marqueeContainer: {
    backgroundColor: "#000000",
    height: 32,
    overflow: "hidden",
    justifyContent: "center",
  },
  marqueeText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 3,
    textTransform: "uppercase",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },

  // Page title
  pageTitle: {
    paddingTop: 32,
    marginBottom: 40,
  },
  collectionHeadline: {
    fontFamily: undefined,
    fontSize: 32,
    color: "#000000",
    textTransform: "uppercase",
    // letterSpacing: -0.5,
    lineHeight: 36,
  },
  refLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#777777",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 8,
  },

  // Items list
  itemsList: {
    marginBottom: 48,
  },
  cartItem: {
    backgroundColor: "#f9f9f9",
  },
  cartItemGap: {
    marginTop: 32,
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    backgroundColor: "#eeeeee",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "flex-start",
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  itemName: {
    fontFamily: undefined,
    fontSize: 13,
    color: "#000000",
    // letterSpacing: 1,
    textTransform: "uppercase",
    flex: 1,
    lineHeight: 18,
  },
  itemPrice: {
    fontFamily: undefined,
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
    // letterSpacing: -0.5,
  },
  itemVariant: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#777777",
    // letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 6,
  },

  // Quantity row
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingLeft: 96, // align with text content (80px image + 16px gap)
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  qtyBtnText: {
    fontFamily: undefined,
    fontSize: 16,
    color: "#000000",
    lineHeight: 20,
  },
  qtyBtnDisabled: {
    color: "#cccccc",
  },
  qtyCountBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 36,
    alignItems: "center",
  },
  qtyCount: {
    fontFamily: undefined,
    fontSize: 13,
    color: "#000000",
    fontWeight: "700",
  },
  removeText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#C41E3A",
    // letterSpacing: 2,
    textTransform: "uppercase",
    textDecorationLine: "underline",
  },

  // Summary box
  summaryBox: {
    backgroundColor: "#eeeeee",
    padding: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: undefined,
    fontSize: 11,
    color: "#777777",
    // letterSpacing: 3,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontFamily: undefined,
    fontSize: 16,
    color: "#000000",
    fontWeight: "700",
    // letterSpacing: -0.5,
  },
  summaryValueSmall: {
    fontFamily: undefined,
    fontSize: 9,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#c6c6c6",
    paddingTop: 20,
    marginBottom: 24,
  },
  totalLabel: {
    fontFamily: undefined,
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
    // letterSpacing: 3,
    textTransform: "uppercase",
  },
  totalValue: {
    fontFamily: undefined,
    fontSize: 22,
    color: "#000000",
    // letterSpacing: -0.5,
  },

  // Checkout button
  checkoutBtn: {
    backgroundColor: "#000000",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    fontFamily: undefined,
    fontSize: 12,
    color: "#ffffff",
    // letterSpacing: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  checkoutNote: {
    fontFamily: undefined,
    fontSize: 9,
    color: "#777777",
    // letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },

  // Empty / loading states
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: undefined,
    fontSize: 24,
    color: "#000000",
    textTransform: "uppercase",
    // letterSpacing: 1,
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  actionBtn: {
    backgroundColor: "#000000",
    paddingVertical: 20,
    paddingHorizontal: 48,
  },
  actionBtnText: {
    fontFamily: undefined,
    fontSize: 12,
    color: "#ffffff",
    // letterSpacing: 4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
});

export default CartScreen;
