import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { useThemeColors } from "@/hooks/useThemeColor";

const ProfileTab = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, token, logout, refreshUser } = useAuth();
  const { setIsManagementMode } = useBrand();
  const [refreshing, setRefreshing] = useState(false);

  const userRole = user?.role || user?.userRole;
  const isAdminOrOwner = userRole === "admin" || userRole === "brandOwner";

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  // Guest state
  if (!token) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centeredContent}>
          <View
            style={[
              styles.guestAvatar,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>
            Welcome to Local Brands
          </Text>
          <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
            Sign in to manage your profile, track orders, and save your
            favorites.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFF" />
            <Text style={styles.signInBtnText}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.primary }]}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const menuItems = [
    // Management entry point for admin/brand owner
    ...(isAdminOrOwner
      ? [
          {
            icon: "speedometer-outline",
            label: "Management Dashboard",
            subtitle:
              userRole === "admin"
                ? "Manage brands, products & users"
                : "Manage your brands & products",
            color: colors.primary,
            bg: colors.primarySoft,
            onPress: () => {
              setIsManagementMode(true);
              router.push("/manage" as any);
            },
          },
        ]
      : []),
    {
      icon: "person-outline",
      label: "Edit Profile",
      color: colors.info,
      bg: colors.infoSoft,
      onPress: () => router.push("/profile/edit" as any),
    },
    {
      icon: "location-outline",
      label: "Shipping Addresses",
      color: colors.warning,
      bg: colors.warningSoft,
      onPress: () => router.push("/profile/addresses"),
    },
    {
      icon: "gift-outline",
      label: "Invite Friends",
      color: colors.success,
      bg: colors.successSoft,
      onPress: () => router.push("/referral" as any),
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      color: colors.accent,
      bg: colors.accentSoft,
      onPress: () => router.push("/notifications" as any),
    },
    {
      icon: "settings-outline",
      label: "Settings",
      color: colors.textSecondary,
      bg: colors.surfaceRaised,
      onPress: () => router.push("/profile/settings" as any),
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.initialsAvatar,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text style={[styles.initialsText, { color: colors.primary }]}>
                  {initials}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name || "User"}
          </Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>
            {user?.email || "No email provided"}
          </Text>

          <View
            style={[styles.roleBadge, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {userRole
                ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
                : "Customer"}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View
          style={[
            styles.menuContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.color}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {item.label}
                </Text>
                {"subtitle" in item && item.subtitle ? (
                  <Text
                    style={[
                      styles.menuSubtext,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            Log Out
          </Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    gap: 8,
    marginBottom: 12,
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  registerBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  initialsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 14,
    marginBottom: 14,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  menuContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ProfileTab;
