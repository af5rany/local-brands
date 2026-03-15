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
import { useThemeColor } from "@/hooks/useThemeColor";

const SettingsScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

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

  const renderSettingItem = (
    icon: string,
    label: string,
    value: boolean,
    onToggle: (val: boolean) => void,
  ) => (
    <View style={[styles.settingItem, { backgroundColor: cardBackground }]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={secondaryTextColor} />
        <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#d1d5db", true: "#346beb" }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderMenuItem = (
    icon: string,
    label: string,
    onPress: () => void,
    color?: string,
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color={color || secondaryTextColor}
        />
        <Text
          style={[styles.settingLabel, { color: color || textColor }]}
        >
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={secondaryTextColor} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>SETTINGS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          NOTIFICATIONS
        </Text>
        <View style={styles.section}>
          {renderSettingItem(
            "notifications-outline",
            "Push Notifications",
            pushNotifications,
            setPushNotifications,
          )}
          {renderSettingItem(
            "mail-outline",
            "Email Notifications",
            emailNotifications,
            setEmailNotifications,
          )}
          {renderSettingItem(
            "cube-outline",
            "Order Updates",
            orderUpdates,
            setOrderUpdates,
          )}
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          ACCOUNT
        </Text>
        <View style={styles.section}>
          {renderMenuItem("lock-closed-outline", "Change Password", () =>
            router.push("/auth/forgot-password" as any),
          )}
          {renderMenuItem("shield-outline", "Privacy Policy", () =>
            Alert.alert("Privacy Policy", "Coming soon."),
          )}
          {renderMenuItem("document-text-outline", "Terms of Service", () =>
            Alert.alert("Terms of Service", "Coming soon."),
          )}
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
          DANGER ZONE
        </Text>
        <View style={styles.section}>
          {renderMenuItem(
            "trash-outline",
            "Delete Account",
            handleDeleteAccount,
            "#EF4444",
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: secondaryTextColor }]}>
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
    borderRadius: 12,
    overflow: "hidden",
    gap: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  appInfo: {
    alignItems: "center",
    marginTop: 40,
  },
  appVersion: {
    fontSize: 12,
  },
});

export default SettingsScreen;
