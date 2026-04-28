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
    title: "Information We Collect",
    body: "We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This includes your name, email address, shipping address, payment information, and any other information you choose to provide.",
  },
  {
    title: "How We Use Your Information",
    body: "We use the information we collect to process transactions, send order confirmations and shipping updates, respond to your comments and questions, send promotional communications (with your consent), and improve our platform and services.",
  },
  {
    title: "Information Sharing",
    body: "We do not sell, trade, or otherwise transfer your personally identifiable information to third parties, except to trusted partners who assist us in operating our platform, conducting our business, or servicing you — provided those parties agree to keep this information confidential.\n\nWe may also disclose your information when we believe disclosure is appropriate to comply with the law or protect ours or others' rights, property, or safety.",
  },
  {
    title: "Data Security",
    body: "We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons with special access rights who are required to keep the information confidential.",
  },
  {
    title: "Cookies",
    body: "Our platform may use cookies to enhance your experience. Your web browser places cookies on your device to help remember your preferences. You may choose to set your browser to refuse cookies, but some portions of our platform may not function properly if you do so.",
  },
  {
    title: "Third-Party Links",
    body: "Our platform may contain links to third-party websites. These third-party sites have separate and independent privacy policies. We have no responsibility or liability for the content and activities of these linked sites.",
  },
  {
    title: "Children's Privacy",
    body: "Our platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are under 13, please do not use our platform or provide any information.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access, update, or delete the personal information we hold about you. You can update your account information at any time by logging into your account. To request deletion of your account and associated data, use the Delete Account option in Settings.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the effective date. Your continued use of the platform after any changes constitutes your acceptance of the new policy.",
  },
  {
    title: "Contact Us",
    body: "If you have any questions about this Privacy Policy, please contact us at privacy@localbrands.com.",
  },
];

const PrivacyScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Effective date: January 1, 2025
          </Text>
          <Text style={[styles.heroBody, { color: colors.textSecondary }]}>
            At Local Brands, we take your privacy seriously. This policy
            describes how we collect, use, and protect your information when you
            use our platform.
          </Text>
        </View>

        {SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {section.body}
            </Text>
          </View>
        ))}

        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          © {new Date().getFullYear()} Local Brands. All rights reserved.
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
  },
  content: {
    padding: 20,
    gap: 12,
  },
  hero: {
    borderRadius: 0,
    padding: 24,
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 0,
    borderWidth: 0.5,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
});

export default PrivacyScreen;
