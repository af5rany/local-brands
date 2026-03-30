import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useThemePreference } from "@/context/ThemeContext";

const SettingsScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useThemePreference();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Contact Support",
              "Please contact support@localbrands.com to request account deletion.",
            );
          },
        },
      ],
    );
  };

  const notificationSettings = [
    {
      icon: "notifications-outline",
      label: "Push Notifications",
      value: pushNotifications,
      onToggle: setPushNotifications,
    },
    {
      icon: "mail-outline",
      label: "Email Notifications",
      value: emailNotifications,
      onToggle: setEmailNotifications,
    },
    {
      icon: "cube-outline",
      label: "Order Updates",
      value: orderUpdates,
      onToggle: setOrderUpdates,
    },
  ];

  const accountItems = [
    {
      icon: "lock-closed-outline",
      label: "Change Password",
      onPress: () => router.push("/auth/forgot-password" as any),
    },
    {
      icon: "shield-outline",
      label: "Privacy Policy",
      onPress: () => Alert.alert("Privacy Policy", "Coming soon."),
    },
    {
      icon: "document-text-outline",
      label: "Terms of Service",
      onPress: () => Alert.alert("Terms of Service", "Coming soon."),
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.backCircle,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {notificationSettings.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.settingItem,
                index < notificationSettings.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.primaryForeground}
              />
            </View>
          ))}
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {(
            [
              { key: "system", label: "System", icon: "phone-portrait-outline" },
              { key: "light", label: "Light", icon: "sunny-outline" },
              { key: "dark", label: "Dark", icon: "moon-outline" },
            ] as const
          ).map((opt, index) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.menuItem,
                index < 2 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
              onPress={() => setPreference(opt.key)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    {
                      backgroundColor:
                        preference === opt.key
                          ? colors.primarySoft
                          : colors.surfaceRaised,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={
                      preference === opt.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.settingLabel,
                    {
                      color:
                        preference === opt.key ? colors.primary : colors.text,
                      fontWeight: preference === opt.key ? "700" : "500",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
              {preference === opt.key && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          ACCOUNT
        </Text>
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {accountItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < accountItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          DANGER ZONE
        </Text>
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              </View>
              <Text style={[styles.settingLabel, { color: colors.danger }]}>
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            Local Brands v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 2,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },

  // ── Content ───────────────────────────────
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  section: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },

  // ── Setting Items ─────────────────────────
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Footer ────────────────────────────────
  appInfo: {
    alignItems: "center",
    marginTop: 40,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default SettingsScreen;
