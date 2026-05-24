import React, { useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderVisibility } from "@/context/HeaderVisibilityContext";

const ProfileTab = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const { user, token, logout, refreshUser, isGuest } = useAuth();
  const { reportScroll } = useHeaderVisibility();
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

  // Not signed in
  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.guestWrap}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.guestEyebrow}>NOT SIGNED IN</Text>
          <Text style={styles.guestTitle}>YOUR PROFILE</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track orders, save favourites, and manage your account.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.signInBtnText}>SIGN IN →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Guest session — promote account creation
  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.guestWrap}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.guestEyebrow}>GUEST SESSION</Text>
          <Text style={styles.guestTitle}>YOUR PROFILE</Text>
          <Text style={styles.guestSubtitle}>
            Create an account to save your cart, track orders, and access your wishlist.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.signInBtnText}>CREATE ACCOUNT →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.registerBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const roleDisplay =
    userRole === "brandOwner"
      ? "BRAND OWNER"
      : userRole
      ? userRole.toUpperCase()
      : "CUSTOMER";

  const menuItems = [
    ...(isAdminOrOwner
      ? [
          {
            icon: "speedometer-outline" as const,
            label: "MANAGEMENT DASHBOARD",
            subtitle:
              userRole === "admin"
                ? "Brands, products & users"
                : "Your brands & products",
            onPress: () => {
              setIsManagementMode(true);
              router.push("/manage" as any);
            },
          },
        ]
      : []),
    {
      icon: "person-outline" as const,
      label: "EDIT PROFILE",
      onPress: () => router.push("/profile/edit" as any),
    },
    {
      icon: "location-outline" as const,
      label: "SHIPPING ADDRESSES",
      onPress: () => router.push("/profile/addresses"),
    },
    {
      icon: "gift-outline" as const,
      label: "INVITE FRIENDS",
      onPress: () => router.push("/referral" as any),
    },
    {
      icon: "notifications-outline" as const,
      label: "NOTIFICATIONS",
      onPress: () => router.push("/notifications" as any),
    },
    {
      icon: "settings-outline" as const,
      label: "SETTINGS",
      onPress: () => router.push("/profile/settings" as any),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {/* ── Profile Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerName}>
              {(user?.name || "USER").toUpperCase()}
            </Text>
            <Text style={styles.headerEmail}>{user?.email || ""}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleDisplay}</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: "ORDERS", value: "—" },
            { label: "WISHLIST", value: "—" },
            { label: "BRANDS", value: "—" },
          ].map((s, i, arr) => (
            <View
              key={s.label}
              style={[
                styles.statCol,
                i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border },
              ]}
            >
              <Text style={styles.statIndicator}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {"subtitle" in item && item.subtitle ? (
                    <Text style={styles.menuSub}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 14, color: colors.textTertiary }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Orders shortcut ── */}
        <TouchableOpacity
          style={styles.ordersRow}
          onPress={() => router.push("/orders" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.ordersLeft}>
            <Text style={styles.ordersEyebrow}>RECENT</Text>
            <Text style={styles.ordersTitle}>MY ORDERS</Text>
          </View>
          <Text style={styles.ordersArrow}>→</Text>
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>V 1.0.0 — MONOLITH</Text>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      // paddingBottom injected inline with tabBarHeight
    },

    // ── Guest ──────────────────────────────────────────────────────────────────
    guestWrap: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 56,
      paddingBottom: 60,
      alignItems: "center",
    },
    guestAvatar: {
      width: 160,
      height: 160,
      backgroundColor: colors.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },
    guestEyebrow: {
      fontSize: 9,
      color: colors.textTertiary,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    guestTitle: {
      fontSize: 30,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.5,
      textTransform: "uppercase",
      marginBottom: 14,
      textAlign: "center",
    },
    guestSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 36,
      paddingHorizontal: 8,
    },
    signInBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      marginBottom: 10,
      width: "100%",
      alignItems: "center",
    },
    signInBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primaryForeground,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    registerBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      width: "100%",
      alignItems: "center",
    },
    registerBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 2,
      textTransform: "uppercase",
    },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
      backgroundColor: colors.background,
      paddingTop: 28,
      paddingBottom: 24,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    avatarWrap: {},
    avatar: {
      width: 64,
      height: 64,
    },
    initialsAvatar: {
      width: 64,
      height: 64,
      backgroundColor: colors.text,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.background,
    },
    headerMeta: {
      flex: 1,
    },
    headerName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.5,
      textTransform: "uppercase",
    },
    headerEmail: {
      fontSize: 9,
      color: colors.textSecondary,
      letterSpacing: 1.5,
      marginTop: 3,
      textTransform: "uppercase",
    },
    roleBadge: {
      backgroundColor: colors.text,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 6,
      alignSelf: "flex-start",
    },
    roleBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.background,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },

    // ── Stats ──────────────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statCol: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 16,
    },
    statLabel: {
      fontSize: 8,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginTop: 4,
    },
    statIndicator: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.5,
    },

    // ── Menu ───────────────────────────────────────────────────────────────────
    menuSection: {
      paddingTop: 0,
      paddingBottom: 0,
    },
    menuList: {},
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 18,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemBorder: {},
    menuTextWrap: {
      flex: 1,
      gap: 2,
    },
    menuLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    menuSub: {
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },

    // ── Orders row ─────────────────────────────────────────────────────────────
    ordersRow: {
      marginHorizontal: 18,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 20,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    ordersLeft: {
      gap: 4,
    },
    ordersEyebrow: {
      fontSize: 9,
      color: colors.textTertiary,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    ordersTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.3,
      textTransform: "uppercase",
    },
    ordersArrow: {
      fontSize: 18,
      color: colors.text,
    },

    // ── Logout ─────────────────────────────────────────────────────────────────
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 18,
      marginTop: 20,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    logoutText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },

    // ── Footer ─────────────────────────────────────────────────────────────────
    version: {
      textAlign: "center",
      fontSize: 8,
      color: colors.textTertiary,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginTop: 28,
      marginBottom: 8,
    },
  });

export default ProfileTab;
