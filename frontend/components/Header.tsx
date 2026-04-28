import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import SearchModal from "@/components/SearchModal";

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Home", icon: "home-outline", route: "/(tabs)" },
  { label: "Shop", icon: "grid-outline", route: "/(tabs)/shop" },
  { label: "Feed", icon: "images-outline", route: "/(tabs)/feed" },
  { label: "Brands", icon: "storefront-outline", route: "/(tabs)/brands" },
  { label: "Orders", icon: "receipt-outline", route: "/orders" },
];

const INFO_ITEMS: MenuItem[] = [
  { label: "Shipping", icon: "cube-outline", route: "/info/shipping" },
  { label: "Returns & Refunds", icon: "refresh-circle-outline", route: "/info/returns" },
  { label: "About Us", icon: "information-circle-outline", route: "/info/about" },
  { label: "Contact Us", icon: "headset-outline", route: "/info/contact" },
];

const STAGGER_DELAY = 50;
const ITEM_SPRING = { damping: 18, stiffness: 140 };

interface AnimatedMenuItemProps {
  index: number;
  menuOpen: boolean;
  item: MenuItem;
  active: boolean;
  colors: any;
  onPress: () => void;
}

const AnimatedMenuItem: React.FC<AnimatedMenuItemProps> = ({
  index,
  menuOpen,
  item,
  active,
  colors,
  onPress,
}) => {
  const translateX = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (menuOpen) {
      const delay = 150 + index * STAGGER_DELAY;
      translateX.value = withDelay(delay, withTiming(0, { duration: 300 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
    } else {
      translateX.value = -60;
      opacity.value = 0;
    }
  }, [menuOpen]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <ReAnimated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.menuItem,
          active && { backgroundColor: colors.surfaceRaised },
        ]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.menuItemIconWrap}>
          <Ionicons
            name={item.icon}
            size={20}
            color={active ? colors.text : colors.textTertiary}
          />
        </View>
        <Text
          style={[
            styles.menuItemLabel,
            { color: active ? colors.text : colors.textSecondary },
            active && { fontWeight: "700" },
          ]}
        >
          {item.label}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={active ? colors.text : colors.textTertiary}
        />
      </TouchableOpacity>
    </ReAnimated.View>
  );
};

const AnimatedSection: React.FC<{
  menuOpen: boolean;
  delay: number;
  style?: any;
  children: React.ReactNode;
}> = ({ menuOpen, delay, style, children }) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (menuOpen) {
      translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 120 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    } else {
      translateY.value = 20;
      opacity.value = 0;
    }
  }, [menuOpen]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <ReAnimated.View style={[animStyle, style]}>{children}</ReAnimated.View>;
};

export interface HeaderHandle {
  openMenu: () => void;
}

interface HeaderProps {
  notificationCount?: number;
  showBack?: boolean;
  dark?: boolean;
  imperativeRef?: React.MutableRefObject<HeaderHandle | null>;
}

const Header: React.FC<HeaderProps> = ({ notificationCount = 0, showBack = false, dark = false, imperativeRef }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconColor = dark ? colors.textInverse : colors.text;
  const bgColor = dark ? colors.primary : colors.surface;
  const logoColor = dark ? colors.textInverse : colors.text;
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuth();
  const { count: cartItemCount } = useCart();
  const isTablet = width > 768;

  const isActiveRoute = (route: string) => {
    if (route === "/(tabs)") return pathname === "/" || pathname === "/(tabs)";
    const clean = route.replace("/(tabs)", "");
    return pathname === clean || pathname === route || pathname.startsWith(clean + "/");
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  if (imperativeRef) imperativeRef.current = { openMenu };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -300, // ← slide back off-screen to the LEFT
      duration: 220,
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

  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: bgColor,
        },
      ]}
    >
      {/* Top Row: Logo + Actions */}
      <View style={[styles.topRow, isTablet && styles.topRowTablet]}>
        <View style={[styles.authActions, isTablet && styles.topRowTablet]}>
          {/* LEFT — Menu or Back */}
          <View style={styles.rightActions}>
            {showBack ? (
              <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={iconColor} />
              </Pressable>
            ) : (
              <Pressable style={styles.iconBtn} onPress={openMenu}>
                <Ionicons name="menu" size={20} color={iconColor} />
              </Pressable>
            )}
            <Pressable
              style={styles.iconBtn}
              onPress={() => setSearchVisible(true)}
            >
              <Ionicons name="search" size={20} color={iconColor} />
            </Pressable>
          </View>

          {/* CENTER — Logo */}
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={styles.logoContainer}
          >
            <Text style={[styles.logoText, { color: logoColor, fontFamily: undefined }]}>
              MONOLITH
            </Text>
          </Pressable>

          {/* RIGHT — Profile + Cart */}
          <View style={styles.rightActions}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/(tabs)/profile" as any)}
            >
              <Ionicons name="person-outline" size={20} color={iconColor} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push("/cart" as any)}
            >
              <Ionicons name="bag-outline" size={22} color={iconColor} />
              {cartItemCount > 0 && (
                <View
                  style={[
                    styles.cartBadge,
                    {
                      backgroundColor: colors.danger,
                      borderColor: colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cartBadgeText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

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
                <AnimatedSection menuOpen={menuVisible} delay={80}>
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
                </AnimatedSection>

                {/* Menu Items */}
                <View style={styles.menuItems}>
                  {MENU_ITEMS.map((item, index) => (
                    <AnimatedMenuItem
                      key={index}
                      index={index}
                      menuOpen={menuVisible}
                      item={item}
                      active={isActiveRoute(item.route)}
                      colors={colors}
                      onPress={() => handleMenuItemPress(item.route)}
                    />
                  ))}
                </View>

                {/* Info Section */}
                <AnimatedSection menuOpen={menuVisible} delay={150 + MENU_ITEMS.length * STAGGER_DELAY}>
                  <View style={[styles.menuDivider, { backgroundColor: colors.border, marginVertical: 8 }]} />
                  <Text style={[styles.menuSectionLabel, { color: colors.textTertiary }]}>INFO</Text>
                </AnimatedSection>
                <View style={styles.menuItems}>
                  {INFO_ITEMS.map((item, index) => (
                    <AnimatedMenuItem
                      key={`info-${index}`}
                      index={MENU_ITEMS.length + index}
                      menuOpen={menuVisible}
                      item={item}
                      active={isActiveRoute(item.route)}
                      colors={colors}
                      onPress={() => handleMenuItemPress(item.route)}
                    />
                  ))}
                </View>

                {/* Menu Footer */}
                <AnimatedSection menuOpen={menuVisible} delay={150 + MENU_ITEMS.length * STAGGER_DELAY + 100} style={{ marginTop: "auto" }}>
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
                        { color: colors.textTertiary, fontFamily: undefined },
                      ]}
                    >
                      MONOLITH
                    </Text>
                  </View>
                </AnimatedSection>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Search Modal */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headerWrapper: {
    zIndex: 100,
    overflow: "visible",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 6,
  },
  topRowTablet: {
    paddingHorizontal: 28,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: "800",
    // letterSpacing: 3,
  },
  // logoImage: {
  //   width: "100%",
  //   height: "100%",
  // },
  authActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 0,
    gap: 8,
  },
  loginText: {
    fontSize: 14,
    fontWeight: "700",
    // letterSpacing: 0.3,
  },

  // Notification dot badge
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 3,
  },
  badgeTextSmall: {
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
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 13,
  },

  // Side Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: colors.surfaceOverlay,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  menuDrawer: {
    width: 300,
    height: "100%",
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
    // letterSpacing: -0.3,
  },
  menuCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
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
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 1.2,
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 0,
  },
  menuItemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    // letterSpacing: 0.1,
  },
  menuFooter: {
    paddingBottom: 40,
  },
  menuLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 0,
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
    // letterSpacing: 0.5,
  },
});

export default Header;
