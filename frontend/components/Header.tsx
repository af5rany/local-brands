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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  styles: ReturnType<typeof createStyles>;
  small?: boolean;
}

const AnimatedMenuItem: React.FC<AnimatedMenuItemProps> = ({
  index,
  menuOpen,
  item,
  active,
  colors,
  onPress,
  styles,
  small,
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
        style={[styles.menuItem, small && styles.menuItemSmall]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <Text
          style={[
            small ? styles.menuItemLabelSmall : styles.menuItemLabel,
            { color: active ? colors.text : colors.textTertiary },
            active && !small && { fontWeight: "800" },
          ]}
        >
          {item.label}
        </Text>
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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.headerWrapper, { backgroundColor: bgColor }]}>
      {/* Top Row: Left | Center Logo | Right */}
      <View style={[styles.topRow, { paddingHorizontal: isTablet ? 28 : 16 }]}>
        {/* LEFT — fixed 80px so logo stays centered */}
        <View style={styles.sideActionsLeft}>
          {showBack ? (
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={iconColor} />
            </Pressable>
          ) : (
            <Pressable style={styles.iconBtn} onPress={openMenu}>
              <Ionicons name="menu" size={20} color={iconColor} />
            </Pressable>
          )}
          {pathname !== "/shop" && (
            <Pressable style={styles.iconBtn} onPress={() => setSearchVisible(true)}>
              <Ionicons name="search" size={20} color={iconColor} />
            </Pressable>
          )}
        </View>

        {/* CENTER — Logo */}
        <Pressable onPress={() => router.push("/(tabs)")} style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: logoColor, fontFamily: undefined }]}>
            MONOLITH
          </Text>
        </Pressable>

        {/* RIGHT — fixed 80px matching left */}
        <View style={styles.sideActionsRight}>
          <Pressable style={styles.iconBtn} onPress={() => router.push("/(tabs)/profile" as any)}>
            <Ionicons name="person-outline" size={20} color={iconColor} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push("/cart" as any)}>
            <Ionicons name="bag-outline" size={22} color={iconColor} />
            {cartItemCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.danger }]}>
                <Text style={[styles.cartBadgeText, { color: colors.textInverse }]}>
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </Text>
              </View>
            )}
          </Pressable>
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
                    paddingTop: insets.top + 12,
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
                      style={styles.menuCloseBtn}
                      onPress={closeMenu}
                    >
                      <Ionicons name="close" size={20} color={colors.text} />
                    </Pressable>
                  </View>
                </AnimatedSection>

                {/* Scrollable nav items */}
                <ScrollView
                  style={styles.menuScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.menuScrollContent}
                >
                  {/* Primary nav */}
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
                        styles={styles}
                      />
                    ))}
                  </View>

                  {/* Info items — demoted style */}
                  <View style={[styles.menuItems, { marginTop: 24 }]}>
                    {INFO_ITEMS.map((item, index) => (
                      <AnimatedMenuItem
                        key={`info-${index}`}
                        index={MENU_ITEMS.length + index}
                        menuOpen={menuVisible}
                        item={item}
                        active={isActiveRoute(item.route)}
                        colors={colors}
                        onPress={() => handleMenuItemPress(item.route)}
                        styles={styles}
                        small
                      />
                    ))}
                  </View>
                </ScrollView>

                {/* Footer — pinned at bottom */}
                <AnimatedSection menuOpen={menuVisible} delay={150 + MENU_ITEMS.length * STAGGER_DELAY + 100}>
                  <View style={[styles.menuFooter, { paddingBottom: insets.bottom + 24 }]}>
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: "800",
  },
  sideActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  sideActionsLeft: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  sideActionsRight: {
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
    flexDirection: "column",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  menuCloseBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingBottom: 12,
  },
  menuItems: {
    paddingHorizontal: 24,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemSmall: {
    paddingVertical: 8,
  },
  menuItemLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  menuItemLabelSmall: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  menuLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
  },
  menuLogoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Header;
