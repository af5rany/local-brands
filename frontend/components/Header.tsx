import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  TextInput,
  Image,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBrand } from "@/context/BrandContext";
import { useThemeColors } from "@/hooks/useThemeColor";

const LOGO_IMAGE = require("@/assets/images/local-sooq.png");

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

interface HeaderProps {
  userName?: string;
  userRole?: string;
  isGuest?: boolean;
  onDashboardPress?: () => void;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  suggestions?: { text: string; type: "Product" | "Brand" }[];
  onSuggestionPress?: (text: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  userRole,
  isGuest = false,
  onDashboardPress,
  searchQuery = "",
  onSearchChange,
  suggestions = [],
  onSuggestionPress,
}) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { isManagementMode } = useBrand();
  const isTablet = width > 768;
  const isAdminOrOwner = userRole === "admin" || userRole === "brandOwner";

  const searchFocusAnim = useRef(new Animated.Value(0)).current;

  const handleSearchFocus = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 0,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();
  };

  const searchBorderColor = searchFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const searchShadowOpacity = searchFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={[styles.headerWrapper, { backgroundColor: colors.surface }]}>
      {/* ── Gradient Accent Strip ──────────────────── */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStrip}
      />

      {/* ── Top Row: Logo + Actions ────────────────── */}
      <View style={[styles.topRow, isTablet && styles.topRowTablet]}>
        <Pressable
          onPress={() => router.push("/(tabs)")}
          style={styles.logoContainer}
        >
          <Image
            source={LOGO_IMAGE}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.headerActions}>
          {isGuest ? (
            <Pressable
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/auth/login")}
            >
              <Ionicons name="log-in-outline" size={16} color="#FFF" />
              <Text style={styles.loginText}>Sign In</Text>
            </Pressable>
          ) : (
            <View style={styles.authActions}>
              {isAdminOrOwner && (
                <Pressable
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isManagementMode
                        ? colors.primarySoft
                        : colors.surfaceRaised,
                    },
                  ]}
                  onPress={onDashboardPress}
                >
                  <Ionicons
                    name={
                      isManagementMode ? "speedometer" : "speedometer-outline"
                    }
                    size={18}
                    color={
                      isManagementMode ? colors.primary : colors.textSecondary
                    }
                  />
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={() => router.push("/cart" as any)}
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={18}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                style={styles.avatarBtn}
                onPress={() => router.push("/profile" as any)}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientRing}
                >
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text
                      style={[styles.avatarText, { color: colors.primary }]}
                    >
                      {(userName || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* ── Greeting Row ───────────────────────────── */}
      {!isGuest && userName && (
        <View style={styles.greetingRow}>
          <Text style={[styles.greetingText, { color: colors.textTertiary }]}>
            {getGreeting()},{" "}
            <Text style={[styles.greetingName, { color: colors.text }]}>
              {userName}
            </Text>
          </Text>
        </View>
      )}

      {/* ── Search Section ─────────────────────────── */}
      <View style={styles.searchSection}>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: searchBorderColor,
              shadowColor: colors.primary,
              shadowOpacity: searchShadowOpacity,
            },
          ]}
        >
          <View
            style={[
              styles.searchIconWrap,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="search" size={14} color={colors.primary} />
          </View>
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange?.("")}
              style={[styles.clearBtn, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={12} color={colors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>

        {/* ── Autocomplete Suggestions ────────────── */}
        {suggestions.length > 0 && searchQuery.length > 0 && (
          <View
            style={[
              styles.suggestionBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
              },
            ]}
          >
            {suggestions.map((item, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  { borderBottomColor: colors.borderLight },
                  pressed && { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={() => onSuggestionPress?.(item.text)}
              >
                <View style={styles.suggestionLeft}>
                  <LinearGradient
                    colors={
                      item.type === "Brand"
                        ? [colors.primary, colors.primaryMuted]
                        : [colors.success, "#10B981"]
                    }
                    style={styles.suggestionIconCircle}
                  >
                    <Ionicons
                      name={
                        item.type === "Product"
                          ? "cube-outline"
                          : "storefront-outline"
                      }
                      size={13}
                      color="#FFF"
                    />
                  </LinearGradient>
                  <Text
                    style={[styles.suggestionText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.text}
                  </Text>
                </View>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor:
                        item.type === "Brand"
                          ? colors.primarySoft
                          : colors.successSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      {
                        color:
                          item.type === "Brand"
                            ? colors.primary
                            : colors.success,
                      },
                    ]}
                  >
                    {item.type}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 100,
    overflow: "visible",
  },

  // ── Gradient Accent Strip ───────────────
  accentStrip: {
    height: 3,
    width: "100%",
  },

  // ── Top Row ─────────────────────────────
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  topRowTablet: {
    paddingHorizontal: 28,
  },

  // ── Logo ────────────────────────────────
  logoContainer: {
    width: 56,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },

  // ── Right Actions ───────────────────────
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  authActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBtn: {},
  avatarGradientRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#4338CA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },

  // ── Greeting ────────────────────────────
  greetingRow: {
    paddingHorizontal: 20,
    paddingBottom: 2,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  greetingName: {
    fontWeight: "700",
  },

  // ── Search Section ──────────────────────
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingLeft: 6,
    paddingRight: 14,
    height: 48,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Suggestions ─────────────────────────
  suggestionBox: {
    position: "absolute",
    top: 66,
    left: 20,
    right: 20,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  suggestionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    letterSpacing: 0.1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

export default Header;
