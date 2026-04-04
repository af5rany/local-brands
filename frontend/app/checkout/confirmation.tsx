import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useThemeColors } from "@/hooks/useThemeColor";

const OrderConfirmationScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { orderId, orderNumber, total, itemCount } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    total: string;
    itemCount: string;
  }>();

  // ── Animations ──
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  useEffect(() => {
    // Ring expands first
    ringScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    ringOpacity.value = withTiming(1, { duration: 300 });

    // Checkmark pops in after ring
    checkOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));
    checkScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 }),
      ),
    );
  }, []);

  // ── Block back navigation ──
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, [navigation]);

  const handleViewOrder = () => {
    router.replace(orderId ? (`/orders/${orderId}` as any) : ("/orders" as any));
  };

  const handleContinueShopping = () => {
    router.replace("/" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.content}>
        {/* Success animation */}
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.text },
              ringStyle,
            ]}
          />
          <Animated.View style={[styles.checkContainer, checkStyle]}>
            <Ionicons name="checkmark" size={48} color={colors.text} />
          </Animated.View>
        </View>

        {/* Order info */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={styles.infoSection}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            ORDER PLACED
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Thank you for your purchase
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(650).duration(400)}
          style={[styles.detailsCard, { borderColor: colors.border }]}
        >
          {orderNumber && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                Order Number
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {orderNumber}
              </Text>
            </View>
          )}
          {itemCount && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                Items
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {itemCount}
              </Text>
            </View>
          )}
          {total && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                Total
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                ${Number(total).toFixed(2)}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(800).duration(400)}
          style={[styles.emailNote, { color: colors.textTertiary }]}
        >
          A confirmation email has been sent to your inbox.
        </Animated.Text>

        {/* CTAs */}
        <Animated.View
          entering={FadeInUp.delay(900).duration(400)}
          style={styles.actions}
        >
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleViewOrder}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              VIEW ORDER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.text }]}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              CONTINUE SHOPPING
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  // Animation
  animationContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  ring: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  checkContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Info
  infoSection: { alignItems: "center", marginBottom: 32 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
  },

  // Details
  detailsCard: {
    width: "100%",
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  emailNote: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 40,
  },

  // Actions
  actions: { width: "100%", gap: 12 },
  primaryBtn: {
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  secondaryBtn: {
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
});

export default OrderConfirmationScreen;
