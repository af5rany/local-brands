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

const VALUES = [
  {
    icon: "storefront-outline" as const,
    title: "Supporting Local",
    body: "Every brand on Local Sooq is independently owned. We exist to give homegrown designers and makers the platform they deserve.",
  },
  {
    icon: "leaf-outline" as const,
    title: "Conscious Commerce",
    body: "We vet every brand for ethical production practices. Buying local means shorter supply chains and a smaller footprint.",
  },
  {
    icon: "people-outline" as const,
    title: "Community First",
    body: "From pop-up events to brand spotlights, we invest in the community that makes local fashion thrive.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Buyer Protection",
    body: "Shop with confidence. Every purchase is covered by our buyer protection policy — quality guaranteed or your money back.",
  },
];

const STATS = [
  { value: "200+", label: "Local Brands" },
  { value: "50K+", label: "Happy Customers" },
  { value: "15+", label: "Cities Covered" },
  { value: "4.8★", label: "App Rating" },
];

const AboutScreen = () => {
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
          About Us
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.logoMark, { color: colors.text }]}>
            LOCAL SOOQ
          </Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            The home of local fashion.
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            We started Local Sooq because we believed the best clothes weren't
            in malls — they were being made by independent designers who just
            needed a stage.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: colors.text }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Mission */}
        <View
          style={[
            styles.missionCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.missionLabel, { color: colors.textTertiary }]}>
            OUR MISSION
          </Text>
          <Text style={[styles.missionText, { color: colors.text }]}>
            "To make local fashion accessible to everyone — and make it easier
            than ever for independent brands to reach customers who care."
          </Text>
        </View>

        {/* Values */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          What We Stand For
        </Text>
        {VALUES.map((v) => (
          <View
            key={v.title}
            style={[
              styles.valueCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <Ionicons name={v.icon} size={20} color={colors.text} />
            </View>
            <View style={styles.valueBody}>
              <Text style={[styles.valueTitle, { color: colors.text }]}>
                {v.title}
              </Text>
              <Text style={[styles.valueText, { color: colors.textSecondary }]}>
                {v.body}
              </Text>
            </View>
          </View>
        ))}

        {/* Footer note */}
        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          Founded with love for local craftsmanship. © {new Date().getFullYear()} Local Sooq.
        </Text>
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
  logoMark: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "44%",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  missionCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 20,
    gap: 8,
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  missionText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  valueCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  valueBody: {
    flex: 1,
    gap: 4,
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  valueText: {
    fontSize: 13,
    lineHeight: 19,
  },
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
});

export default AboutScreen;
