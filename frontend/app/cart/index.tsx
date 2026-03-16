import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
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

const CartScreen = () => {
  const router = useRouter();
  const { token, user } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const primaryColor = useThemeColor(
    { light: "#1A1A1A", dark: "#FFFFFF" },
    "text",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#737373", dark: "#A3A3A3" },
    "text",
  );
  const accentColor = useThemeColor(
    { light: "#DC2626", dark: "#EF4444" },
    "primary",
  );

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

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

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
              },
            );
            if (!response.ok) throw new Error("Failed to remove item");
            await fetchCart();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const variant = item.variant;
    const product = item.product;
    const image =
      variant?.images?.[0] ||
      product?.productVariants?.[0]?.images?.[0] ||
      product?.images?.[0] ||
      product?.variants?.[0]?.variantImages?.[0] ||
      product?.variants?.[0]?.images?.[0] ||
      "";

    return (
      <View style={[styles.cartItem, { backgroundColor: cardBackground }]}>
        <Image source={{ uri: image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text
            style={[styles.itemName, { color: textColor }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          {variant && (
            <Text style={[styles.itemVariant, { color: secondaryTextColor }]}>
              {variant.attributes?.color || "Default"}
            </Text>
          )}
          <Text style={[styles.itemPrice, { color: textColor }]}>
            ${Number(item.unitPrice).toFixed(2)}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1 || updatingId === item.id}
          >
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={item.quantity <= 1 ? secondaryTextColor : primaryColor}
            />
          </TouchableOpacity>
          <Text style={[styles.quantityText, { color: textColor }]}>
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              item.quantity
            )}
          </Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={updatingId === item.id}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={primaryColor}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
    );
  };

  if (!token) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Ionicons name="cart-outline" size={64} color={secondaryTextColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          Your collection is empty
        </Text>
        <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
          Login to start curating your finds.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginBtnText}>LOGIN</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>COLLECTION</Text>
        <View style={{ width: 28 }} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={secondaryTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No items gathered
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Your personal collection is currently empty.
          </Text>
          <TouchableOpacity
            style={styles.discoverBtn}
            onPress={() => router.push("/")}
          >
            <Text style={styles.discoverBtnText}>DISCOVER PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <View
            style={[
              styles.footer,
              {
                backgroundColor: cardBackground,
                borderTopColor: secondaryTextColor + "20",
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: secondaryTextColor }]}
              >
                Subtotal
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                ${Number(cart.totalAmount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: secondaryTextColor }]}
              >
                Gathering fee
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                FREE
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.totalLabel, { color: textColor }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: textColor }]}>
                ${Number(cart.totalAmount).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: primaryColor }]}
              onPress={() => router.push("/checkout" as any)}
            >
              <Text
                style={[styles.checkoutBtnText, { color: backgroundColor }]}
              >
                PROCEED TO ACQUISITION
              </Text>
            </TouchableOpacity>
          </View>
        </>
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
  cartItem: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    padding: 8,
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
  discoverBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  discoverBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  loginBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  checkoutBtn: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
});

export default CartScreen;
