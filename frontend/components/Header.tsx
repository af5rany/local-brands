import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  TextInput,
  Image,
  Animated,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";

const LOGO_IMAGE = require("@/assets/images/local-sooq.png");

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Home", icon: "home-outline", route: "/(tabs)" },
  { label: "Shop", icon: "grid-outline", route: "/(tabs)/shop" },
  { label: "Wishlist", icon: "heart-outline", route: "/(tabs)/wishlist" },
  { label: "Orders", icon: "receipt-outline", route: "/(tabs)/orders" },
  { label: "Profile", icon: "person-outline", route: "/(tabs)/profile" },
  { label: "Brands", icon: "storefront-outline", route: "/(tabs)/shop" },
  { label: "Cart", icon: "bag-handle-outline", route: "/cart" },
  { label: "Settings", icon: "settings-outline", route: "/(tabs)/profile" },
];

interface HeaderProps {
  userName?: string;
  userRole?: string;
  isGuest?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  suggestions?: { text: string; type: "Product" | "Brand" }[];
  onSuggestionPress?: (text: string) => void;
  cartItemCount?: number;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  userRole,
  isGuest = false,
  showSearch = false,
  searchQuery = "",
  onSearchChange,
  suggestions = [],
  onSuggestionPress,
  cartItemCount = 0,
  notificationCount = 0,
}) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { token, logout } = useAuth();
  const isTablet = width > 768;

  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  const searchFocusAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const handleMenuItemPress = (route: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 280);
  };

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
      {/* Gradient Accent Strip */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentStrip}
      />

      {/* Top Row: Logo + Actions */}
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
            <View style={styles.guestActions}>
              {/* <Pressable
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/auth/login")}
              >
                <Ionicons name="log-in-outline" size={16} color="#FFF" />
                <Text style={styles.loginText}>Sign In</Text>
              </Pressable> */}

              <Pressable
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={openMenu}
              >
                <Ionicons name="menu" size={20} color={colors.text} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.authActions}>
              {/* Notification Bell */}
              {/* <Pressable
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={() => router.push("/(tabs)/orders" as any)}
              >
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={colors.text}
                />
                {notificationCount > 0 && (
                  <View style={styles.notificationDot}>
                    {notificationCount <= 9 ? (
                      <Text style={styles.badgeTextSmall}>
                        {notificationCount}
                      </Text>
                    ) : (
                      <Text style={styles.badgeTextSmall}>9+</Text>
                    )}
                  </View>
                )}
              </Pressable> */}

              {/* Cart Icon with Badge */}
              <Pressable
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={() => router.push("/cart" as any)}
              >
                  <Ionicons name="bag-outline" size={24} color={colors.text} />
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Hamburger Menu */}
              <Pressable
                style={[
                  styles.iconBtn,
                  { backgroundColor: colors.surfaceRaised },
                ]}
                onPress={openMenu}
              >
                <Ionicons name="menu" size={20} color={colors.text} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Greeting Row */}
      {!isGuest && userName && !showSearch && (
        <View style={styles.greetingRow}>
          <Text style={[styles.greetingText, { color: colors.textTertiary }]}>
            {getGreeting()},{" "}
            <Text style={[styles.greetingName, { color: colors.text }]}>
              {userName}
            </Text>
          </Text>
        </View>
      )}

      {/* Search Section -- only shown when showSearch is true */}
      {showSearch && (
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
              placeholder="Search products, brands\u2026"
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={onSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => onSearchChange?.("")}
                style={[styles.clearBtn, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={12} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.micBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="mic-outline"
                  size={14}
                  color={colors.textTertiary}
                />
              </Pressable>
            )}
          </Animated.View>

          {/* Autocomplete Suggestions */}
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
      )}

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuDrawer,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
              >
                {/* Menu Header */}
                <View style={styles.menuHeader}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    Menu
                  </Text>
                  <Pressable
                    style={[
                      styles.menuCloseBtn,
                      { backgroundColor: colors.surfaceRaised },
                    ]}
                    onPress={closeMenu}
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                {/* Divider */}
                <View
                  style={[
                    styles.menuDivider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {/* Menu Items */}
                <View style={styles.menuItems}>
                  {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(item.route)}
                      activeOpacity={0.6}
                    >
                      <View
                        style={[
                          styles.menuItemIconWrap,
                          { backgroundColor: colors.surfaceRaised },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[styles.menuItemLabel, { color: colors.text }]}
                      >
                        {item.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Menu Footer */}
                <View style={styles.menuFooter}>
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.menuLogoutBtn,
                      {
                        backgroundColor: token
                          ? colors.dangerSoft
                          : colors.primarySoft,
                        borderColor: token ? colors.danger : colors.primary,
                      },
                    ]}
                    onPress={() => {
                      closeMenu();
                      if (token) {
                        logout();
                      } else {
                        router.push("/auth/login" as any);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={token ? "log-out-outline" : "log-in-outline"}
                      size={18}
                      color={token ? colors.danger : colors.primary}
                    />
                    <Text
                      style={[
                        styles.menuLogoutText,
                        { color: token ? colors.danger : colors.primary },
                      ]}
                    >
                      {token ? "Log Out" : "Log In"}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.menuFooterText,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Local Brands
                  </Text>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 100,
    overflow: "visible",
  },
  accentStrip: {
    height: 3,
    width: "100%",
  },
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  guestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  // Notification dot badge
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
    paddingHorizontal: 3,
  },
  badgeTextSmall: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },

  // Cart badge
  cartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },

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
  micBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
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

  // Side Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  menuDrawer: {
    width: 300,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    paddingTop: 60,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  menuCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 24,
  },
  menuItems: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuItemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  menuFooter: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  menuLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuLogoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuFooterText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 16,
    letterSpacing: 0.5,
  },
});

export default Header;
