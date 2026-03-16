import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBrand } from "@/context/BrandContext";
import { useThemeColors } from "@/hooks/useThemeColor";

const LOGO_IMAGE = require("@/assets/images/local-sooq.png");

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

  return (
    <View style={[styles.headerWrapper, { backgroundColor: colors.surface }]}>
      {/* ── Main Header Row ─────────────────────── */}
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        {/* Logo */}
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

        {/* Right Actions */}
        <View style={styles.headerActions}>
          {isGuest ? (
            <Pressable
              style={[
                styles.loginButton,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => router.push("/auth/login")}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.loginText, { color: colors.primary }]}>
                Sign In
              </Text>
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
                      borderColor: isManagementMode
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={onDashboardPress}
                >
                  <Ionicons
                    name={
                      isManagementMode ? "speedometer" : "speedometer-outline"
                    }
                    size={19}
                    color={
                      isManagementMode ? colors.primary : colors.textSecondary
                    }
                  />
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push("/cart" as any)}
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              <Pressable
                style={styles.avatarBtn}
                onPress={() => router.push("/profile" as any)}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {(userName || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* ── Search Bar (below header row) ───────── */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search products, brands..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => onSearchChange?.("")}
              style={[styles.clearBtn, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Divider ─────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

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
                <View
                  style={[
                    styles.suggestionIconCircle,
                    {
                      backgroundColor:
                        item.type === "Brand"
                          ? colors.primarySoft
                          : colors.successSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.type === "Product"
                        ? "cube-outline"
                        : "storefront-outline"
                    }
                    size={14}
                    color={
                      item.type === "Brand" ? colors.primary : colors.success
                    }
                  />
                </View>
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
                        item.type === "Brand" ? colors.primary : colors.success,
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
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 100,
  },

  // ── Main Row ──────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTablet: {
    paddingHorizontal: 24,
  },

  // ── Logo ──────────────────────────────────
  logoContainer: {
    width: 52,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },

  // ── Right Actions ─────────────────────────
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  authActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  avatarBtn: {
    marginLeft: 2,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  loginText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Search Bar ────────────────────────────
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    fontWeight: "400",
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Divider ───────────────────────────────
  divider: {
    height: 1,
  },

  // ── Suggestions ───────────────────────────
  suggestionBox: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    maxHeight: 280,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  suggestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  suggestionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default Header;
