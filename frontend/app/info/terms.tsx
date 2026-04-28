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
    title: "Acceptance of Terms",
    body: "By accessing and using the Local Brands platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.",
  },
  {
    title: "Use of the Platform",
    body: "You may use our platform only for lawful purposes and in accordance with these Terms. You agree not to use our platform:\n\n• In any way that violates applicable laws or regulations.\n• To transmit unsolicited promotional material.\n• To impersonate any person or misrepresent your affiliation with any person or organization.\n• To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the platform.",
  },
  {
    title: "User Accounts",
    body: "When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "Purchases and Payments",
    body: "All purchases made through our platform are subject to our order confirmation. We reserve the right to refuse or cancel any order. Prices are subject to change without notice. Payment must be received in full before an order is processed.",
  },
  {
    title: "Returns and Refunds",
    body: "Our return and refund policy is determined on a per-brand basis. Each brand on our platform sets its own return policy. Please review the return policy of the specific brand before making a purchase. For more details, refer to the Returns section on each brand's page.",
  },
  {
    title: "Intellectual Property",
    body: "The platform and its original content, features, and functionality are owned by Local Brands and are protected by intellectual property laws. You may not reproduce, distribute, or create derivative works from any content on our platform without explicit written permission.",
  },
  {
    title: "Brand Seller Terms",
    body: "Brands selling on our platform agree to provide accurate product descriptions, fulfill orders in a timely manner, and comply with all applicable laws. Local Brands reserves the right to remove any brand or product that violates our policies or applicable laws.",
  },
  {
    title: "Limitation of Liability",
    body: "To the fullest extent permitted by law, Local Brands shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform or any content or services provided through the platform.",
  },
  {
    title: "Disclaimer of Warranties",
    body: "Our platform is provided on an 'as is' and 'as available' basis without any warranties of any kind. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components.",
  },
  {
    title: "Governing Law",
    body: "These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in our operating jurisdiction.",
  },
  {
    title: "Changes to Terms",
    body: "We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting an update on our platform. Your continued use of the platform after changes constitutes your acceptance of the new Terms.",
  },
  {
    title: "Contact Us",
    body: "If you have any questions about these Terms of Service, please contact us at legal@localbrands.com.",
  },
];

const TermsScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Terms of Service
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Terms of Service
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Effective date: January 1, 2025
          </Text>
          <Text style={[styles.heroBody, { color: colors.textSecondary }]}>
            Please read these Terms of Service carefully before using the Local
            Brands platform. By using our service, you agree to be bound by
            these terms.
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

export default TermsScreen;
