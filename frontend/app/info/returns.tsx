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

const STEPS = [
  {
    step: "01",
    title: "Start Your Return",
    body: "Go to Orders in your account, select the item you'd like to return, and tap 'Request Return'. Returns must be initiated within 14 days of delivery.",
  },
  {
    step: "02",
    title: "Pack It Up",
    body: "Place the item in its original packaging with all tags attached. Include the packing slip or your order number inside the parcel.",
  },
  {
    step: "03",
    title: "Ship It Back",
    body: "Use the prepaid return label emailed to you. Drop the parcel at any authorised courier point. Keep your receipt as proof of postage.",
  },
  {
    step: "04",
    title: "Refund Issued",
    body: "Once we receive and inspect the item (1–3 business days), your refund is processed. Allow 5–10 business days for it to appear on your statement.",
  },
];

const CONDITIONS = [
  { ok: true, text: "Unworn and unwashed items with original tags" },
  { ok: true, text: "Items returned within 14 days of delivery" },
  { ok: true, text: "Items in original, undamaged packaging" },
  { ok: false, text: "Sale or final-clearance items" },
  { ok: false, text: "Underwear, swimwear & personalised items" },
  { ok: false, text: "Items showing signs of wear, wash, or alteration" },
];

const ReturnsScreen = () => {
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
          Returns & Refunds
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Ionicons name="refresh-circle-outline" size={36} color={colors.text} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Hassle-free returns
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Not the right fit? No problem. We make returns simple so you can
            shop with confidence.
          </Text>
        </View>

        {/* How it works */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          How It Works
        </Text>
        {STEPS.map((s) => (
          <View
            key={s.step}
            style={[
              styles.stepCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.stepNumber, { color: colors.textTertiary }]}>
              {s.step}
            </Text>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {s.title}
              </Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                {s.body}
              </Text>
            </View>
          </View>
        ))}

        {/* Conditions */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Return Conditions
        </Text>
        <View
          style={[
            styles.conditionsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {CONDITIONS.map((c, i) => (
            <View
              key={i}
              style={[
                styles.conditionRow,
                i < CONDITIONS.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <Ionicons
                name={c.ok ? "checkmark-circle" : "close-circle"}
                size={18}
                color={c.ok ? colors.success : colors.danger}
              />
              <Text
                style={[styles.conditionText, { color: colors.textSecondary }]}
              >
                {c.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Refund timing */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={colors.text}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.infoBoxTitle, { color: colors.text }]}>
              Refund Timeline
            </Text>
            <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
              Refunds are returned to your original payment method. Credit/debit
              cards: 5–10 days. Store credit is instant.
            </Text>
          </View>
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
    letterSpacing: 0.2,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  stepNumber: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  stepBody: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 13,
    lineHeight: 19,
  },
  conditionsCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conditionText: {
    fontSize: 13,
    flex: 1,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    marginTop: 4,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

export default ReturnsScreen;
