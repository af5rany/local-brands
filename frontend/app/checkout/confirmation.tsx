import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  background: "#f9f9f9",
  black: "#000000",
  white: "#ffffff",
  surfaceContainer: "#eeeeee",
  gray: "#777777",
};

const FONTS = {
  headline: undefined,
  mono: undefined,
  body: "Inter_400Regular",
};

const MARQUEE_TEXT =
  "ORDER CONFIRMED  ·  THANK YOU FOR SHOPPING  ·  NEW ARRIVALS EVERY FRIDAY  ·  ORDER CONFIRMED  ·  THANK YOU FOR SHOPPING  ·  NEW ARRIVALS EVERY FRIDAY  ·  ";

const MarqueeStrip = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -700,
        duration: 16000,
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

// ── Info grid cell ────────────────────────────────────────────────────────────
const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoCell}>
    <Text style={styles.infoCellLabel}>{label}</Text>
    <Text style={styles.infoCellValue}>{value}</Text>
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────
const OrderConfirmationScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { orderId, orderNumber, total, itemCount } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    total: string;
    itemCount: string;
  }>();

  // Block back navigation
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, [navigation]);

  const handleViewOrders = () => {
    router.replace("/orders" as any);
  };

  const handleContinueShopping = () => {
    router.replace("/(tabs)" as any);
  };

  // Estimate arrival: 5-7 business days from today
  const arrivalDate = () => {
    const now = new Date();
    const early = new Date(now);
    early.setDate(early.getDate() + 5);
    const late = new Date(now);
    late.setDate(late.getDate() + 7);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(early)} — ${fmt(late)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Brand mark */}
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>MONOLITH</Text>
      </View>

      {/* Scrollable content */}
      <View style={styles.content}>
        {/* Brutalist checkmark box */}
        <View style={styles.checkBox}>
          <Ionicons name="checkmark" size={36} color={COLORS.black} />
        </View>

        {/* Headline */}
        <Text style={styles.headline}>{"Order\nConfirmed"}</Text>

        {/* Info grid — 2 columns × 2 rows */}
        <View style={styles.infoGrid}>
          <InfoCell
            label="ORDER ID"
            value={orderNumber || orderId || "—"}
          />
          <InfoCell label="ESTIMATED ARRIVAL" value={arrivalDate()} />
          <InfoCell label="SHIPPING METHOD" value="STANDARD COURIER" />
          <InfoCell label="STATUS" value="PROCESSING" />
        </View>

        {/* Totals block */}
        {(total || itemCount) ? (
          <View style={styles.totalsBlock}>
            {itemCount ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>ITEMS</Text>
                <Text style={styles.totalsValue}>{itemCount}</Text>
              </View>
            ) : null}
            {total ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>ORDER TOTAL</Text>
                <Text style={styles.totalsValue}>
                  ${Number(total).toFixed(2)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* CTA buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleViewOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>VIEW MY ORDERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom marquee */}
      <MarqueeStrip />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Brand mark
  brandMark: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  brandMarkText: {
    fontFamily: FONTS.headline,
    fontSize: 14,
    // letterSpacing: 4,
    color: COLORS.black,
    textTransform: "uppercase",
  },

  // Main content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: "center",
  },

  // Brutalist checkmark
  checkBox: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },

  // Headline
  headline: {
    fontFamily: FONTS.headline,
    fontSize: 56,
    lineHeight: 56,
    color: COLORS.black,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 40,
  },

  // Info grid
  infoGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 24,
  },
  infoCell: {
    width: "49%",
    backgroundColor: COLORS.surfaceContainer,
    padding: 16,
    gap: 6,
  },
  infoCellLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    // letterSpacing: 2,
    color: COLORS.gray,
    textTransform: "uppercase",
  },
  infoCellValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.black,
    // letterSpacing: 0.5,
  },

  // Totals
  totalsBlock: {
    width: "100%",
    backgroundColor: COLORS.surfaceContainer,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    // letterSpacing: 2,
    color: COLORS.gray,
    textTransform: "uppercase",
  },
  totalsValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.black,
  },

  // Actions
  actions: {
    width: "100%",
    gap: 12,
    marginTop: "auto",
  },
  primaryBtn: {
    backgroundColor: COLORS.black,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    // letterSpacing: 3,
    color: COLORS.white,
    textTransform: "uppercase",
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    // letterSpacing: 3,
    color: COLORS.black,
    textTransform: "uppercase",
  },

  // Marquee
  marqueeWrap: {
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    overflow: "hidden",
  },
  marqueeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.white,
    // letterSpacing: 3,
    textTransform: "uppercase",
  },
});

export default OrderConfirmationScreen;
