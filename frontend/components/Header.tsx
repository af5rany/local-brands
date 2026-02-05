import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBrand } from "@/context/BrandContext";

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
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { isManagementMode } = useBrand();
  const isTablet = width > 768;
  const isAdminOrOwner = userRole === "admin" || userRole === "brandOwner";

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        {/* Brand Logo */}
        <Pressable onPress={() => router.push("/(tabs)")} style={styles.logoContainer}>
          <Image
            source={LOGO_IMAGE}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Pressable>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            placeholder="Search products or brands..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange?.("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* Action Icons */}
        <View style={styles.headerIcons}>
          {isGuest ? (
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push("/auth/login")}
            >
              <Ionicons name="log-in-outline" size={20} color="#346beb" />
              <Text style={styles.loginText}>Login</Text>
            </Pressable>
          ) : (
            <View style={styles.authActions}>
              {isAdminOrOwner && (
                <Pressable
                  style={[
                    styles.dashboardBadge,
                    isManagementMode && styles.dashboardBadgeActive
                  ]}
                  onPress={onDashboardPress}
                >
                  <Ionicons
                    name={isManagementMode ? "speedometer" : "speedometer-outline"}
                    size={20}
                    color={isManagementMode ? "#346beb" : "#64748b"}
                  />
                </Pressable>
              )}
              <Pressable style={styles.iconButton} onPress={() => router.push("/profile")}>
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color="#333"
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Autocomplete Suggestions Overlay */}
      {suggestions.length > 0 && searchQuery.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((item, index) => (
            <Pressable
              key={index}
              style={styles.suggestionItem}
              onPress={() => onSuggestionPress?.(item.text)}
            >
              <View style={styles.suggestionLeft}>
                <Ionicons
                  name={item.type === "Product" ? "cube-outline" : "business-outline"}
                  size={16}
                  color="#94a3b8"
                />
                <Text style={styles.suggestionText}>{item.text}</Text>
              </View>
              <View style={[
                styles.typeBadge,
                item.type === "Brand" ? styles.brandBadge : styles.productBadge
              ]}>
                <Text style={[
                  styles.typeText,
                  item.type === "Brand" ? styles.brandText : styles.productText
                ]}>{item.type}</Text>
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
    backgroundColor: "#fff",
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  headerTablet: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    paddingVertical: 0,
  },
  suggestionBox: {
    position: "absolute",
    top: 60,
    left: 68,
    right: 68,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    maxHeight: 250,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  suggestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  productBadge: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  brandBadge: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  productText: {
    color: "#16a34a",
  },
  brandText: {
    color: "#2563eb",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  authActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#346beb15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#346beb30",
    gap: 6,
  },
  loginText: {
    color: "#346beb",
    fontSize: 14,
    fontWeight: "600",
  },
  dashboardBadge: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dashboardBadgeActive: {
    backgroundColor: "#346beb15",
    borderColor: "#346beb30",
  },
});

export default Header;
