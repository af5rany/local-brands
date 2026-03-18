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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

const CheckoutScreen = () => {
  const router = useRouter();
  const { token, user } = useAuth();

  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
  const accentColor = useThemeColor(
    { light: "#DC2626", dark: "#EF4444" },
    "primary",
  );

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

  const generateIdempotencyKey = () => {
    return "key_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  };

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
      const response = await fetch(`${getApiUrl()}/orders/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": generateIdempotencyKey(),
        },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod: "CREDIT_CARD", // Mocked for now
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Checkout failed");
      }

      const order = await response.json();
      Alert.alert("Success", "Your acquisition is being processed.", [
        { text: "View Order", onPress: () => router.replace("/orders" as any) },
        { text: "Close", onPress: () => router.replace("/" as any) },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={[styles.title, { color: textColor }]}>
          No items to checkout
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: accentColor }}>GO BACK</Text>
        </TouchableOpacity>
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
        <Text style={[styles.title, { color: textColor }]}>ACQUISITION</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              SHIPPING DESTINATION
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/addresses/new")}
            >
              <Text style={[styles.addText, { color: accentColor }]}>
                ADD NEW
              </Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity
              style={[
                styles.emptyAddress,
                { borderColor: secondaryTextColor + "40" },
              ]}
              onPress={() => router.push("/profile/addresses/new")}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color={secondaryTextColor}
              />
              <Text
                style={[styles.emptyAddressText, { color: secondaryTextColor }]}
              >
                No address selected. Tap to add.
              </Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  { backgroundColor: cardBackground },
                  selectedAddressId === addr.id && {
                    borderColor: textColor,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <View style={styles.addressInfo}>
                  <Text style={[styles.addressName, { color: textColor }]}>
                    {addr.fullName}
                  </Text>
                  <Text
                    style={[
                      styles.addressDetails,
                      { color: secondaryTextColor },
                    ]}
                  >
                    {addr.addressLine1}, {addr.city}
                  </Text>
                </View>
                <Ionicons
                  name={
                    selectedAddressId === addr.id
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    selectedAddressId === addr.id
                      ? textColor
                      : secondaryTextColor
                  }
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            SUMMARY
          </Text>
          <View
            style={[styles.summaryCard, { backgroundColor: cardBackground }]}
          >
            {cart.items.map((item: any) => (
              <View key={item.id} style={styles.summaryItem}>
                <Text
                  style={[styles.summaryItemName, { color: textColor }]}
                  numberOfLines={1}
                >
                  {item.product.name} x {item.quantity}
                </Text>
                <Text style={[styles.summaryItemPrice, { color: textColor }]}>
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View
              style={[
                styles.divider,
                { backgroundColor: secondaryTextColor + "20" },
              ]}
            />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: textColor }]}>
                Final Amount
              </Text>
              <Text style={[styles.totalValue, { color: textColor }]}>
                ${cart.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Mock */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
            METHOD OF TRANSACTION
          </Text>
          <View
            style={[styles.paymentCard, { backgroundColor: cardBackground }]}
          >
            <Ionicons name="card-outline" size={24} color={textColor} />
            <Text style={[styles.paymentText, { color: textColor }]}>
              Mock Payment Gateway
            </Text>
            <View style={styles.activeDot} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: cardBackground }]}>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: textColor }]}
          onPress={handleCheckout}
          disabled={processing || !selectedAddressId}
        >
          {processing ? (
            <ActivityIndicator color={backgroundColor} />
          ) : (
            <Text style={[styles.checkoutBtnText, { color: backgroundColor }]}>
              COMPLETE ACQUISITION
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
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
  },
  addText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyAddress: {
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyAddressText: {
    fontSize: 12,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 13,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItemName: {
    fontSize: 14,
    flex: 1,
    marginRight: 16,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
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

export default CheckoutScreen;
