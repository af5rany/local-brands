import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

const SECTIONS = [
  {
    icon: "time-outline" as const,
    title: "Processing Time",
    body: "Orders are processed within 1–2 business days after payment confirmation. You'll receive an email once your order has been dispatched.",
  },
  {
    icon: "bicycle-outline" as const,
    title: "Standard Delivery",
    body: "3–5 business days. Free on orders over $100. A flat rate of $5.99 applies to all other orders.",
  },
  {
    icon: "flash-outline" as const,
    title: "Express Delivery",
    body: "1–2 business days. Available at checkout for $14.99. Order must be placed before 12:00 PM to qualify for same-day dispatch.",
  },
  {
    icon: "earth-outline" as const,
    title: "International Shipping",
    body: "We ship to 40+ countries. Delivery takes 7–14 business days depending on destination. Import duties and taxes are the buyer's responsibility.",
  },
  {
    icon: "location-outline" as const,
    title: "Order Tracking",
    body: "Once dispatched, you'll receive a tracking number via email. Track your order anytime from the Orders section in your account.",
  },
  {
    icon: "alert-circle-outline" as const,
    title: "Delays & Exceptions",
    body: "During peak seasons (sale events, holidays), processing times may be extended by 1–3 business days. We'll notify you if your order is affected.",
  },
];

const ShippingScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Shipping Information
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Ionicons name="cube-outline" size={36} color={colors.text} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            We ship fast, everywhere.
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Local Sooq partners with the region's top couriers to get your order
            to you safely and on time.
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <Ionicons name={section.icon} size={20} color={colors.text} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                {section.body}
              </Text>
            </View>
          </View>
        ))}

        {/* Note */}
        <View
          style={[styles.note, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            Shipping rates and timelines are estimates and may vary based on
            carrier availability and your location.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    // letterSpacing: 0.2,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  hero: {
    borderRadius: 0,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    // letterSpacing: -0.3,
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardText: {
    fontSize: 13,
    lineHeight: 19,
  },
  note: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderRadius: 0,
    borderWidth: 0.5,
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ShippingScreen;
