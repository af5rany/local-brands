import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import Constants from "expo-constants";

const SECTIONS = [
  {
    title: "PLATFORM",
    items: [
      {
        icon: "people-outline" as const,
        label: "User Management",
        route: "/users",
      },
      {
        icon: "storefront-outline" as const,
        label: "Brand Management",
        route: "/(tabs)/brands",
      },
      {
        icon: "cube-outline" as const,
        label: "Product Management",
        route: "/products",
      },
    ],
  },
  {
    title: "CONTENT",
    items: [
      {
        icon: "shield-outline" as const,
        label: "Privacy Policy",
        route: "/info/privacy",
      },
      {
        icon: "document-text-outline" as const,
        label: "Terms of Service",
        route: "/info/terms",
      },
      {
        icon: "information-circle-outline" as const,
        label: "About",
        route: "/info/about",
      },
    ],
  },
];

const INFO_ROWS = [
  { label: "App Version", value: "1.0.0" },
  {
    label: "Environment",
    value: __DEV__ ? "Development" : "Production",
  },
  {
    label: "Expo SDK",
    value: String(Constants.expoConfig?.sdkVersion ?? "—"),
  },
];

const AdminSettingsScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();

  const showComingSoon = (label: string) =>
    Alert.alert(label, "This feature is coming soon.");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ADMIN SETTINGS</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.row,
                    index < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: colors.surfaceRaised }]}>
                      <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Dangerous actions */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SYSTEM</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
            onPress={() => showComingSoon("Maintenance Mode")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.warningSoft ?? colors.surfaceRaised }]}>
                <Ionicons name="construct-outline" size={18} color={colors.warning ?? colors.textSecondary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Maintenance Mode</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => showComingSoon("Clear App Cache")}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Clear App Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* App info */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>APP INFO</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          {INFO_ROWS.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                index < INFO_ROWS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default AdminSettingsScreen;
