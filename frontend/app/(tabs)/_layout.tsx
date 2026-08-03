import { Tabs, usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, StatusBar as RNStatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";
import { HeaderVisibilityProvider, useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { ScrollToTopProvider, useScrollToTop } from "@/context/ScrollToTopContext";

const TAB_ROUTES = [
  "/(tabs)",
  "/(tabs)/shop",
  "/(tabs)/feed",
  "/(tabs)/wishlist",
  "/(tabs)/brands",
] as const;

const TAB_BAR_CONTENT_HEIGHT = 50;

export default function TabLayout() {
  return (
    <HeaderVisibilityProvider>
      <ScrollToTopProvider>
        <TabLayoutInner />
      </ScrollToTopProvider>
    </HeaderVisibilityProvider>
  );
}

const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_DISTANCE_THRESHOLD = 80;

function getCurrentTabIndex(pathname: string): number {
  if (pathname === "/" || pathname === "/(tabs)" || pathname === "/index") return 0;
  if (pathname.includes("/shop")) return 1;
  if (pathname.includes("/feed")) return 2;
  if (pathname.includes("/wishlist")) return 3;
  if (pathname.includes("/brands")) return 4;
  return -1;
}

function TabLayoutInner() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  // insets.top can be 0 on first render on Android — fall back to the
  // synchronous RN value which is always correct from the start.
  const statusBarHeight =
    insets.top > 0
      ? insets.top
      : Platform.OS === "android"
        ? (RNStatusBar.currentHeight ?? 0)
        : 0;
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const tintColor = colors.tabActive;
  const inactiveColor = colors.tabInactive;
  const pathname = usePathname();
  const router = useRouter();
  const { headerTranslateY, setHeaderHeight, resetHeader } = useHeaderVisibility();
  const { trigger: triggerScrollToTop } = useScrollToTop();
  useEffect(() => {
    resetHeader();
  }, [pathname]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
    marginBottom: headerTranslateY.value,
  }));

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      const isSwipeLeft = e.velocityX < -SWIPE_VELOCITY_THRESHOLD || e.translationX < -SWIPE_DISTANCE_THRESHOLD;
      const isSwipeRight = e.velocityX > SWIPE_VELOCITY_THRESHOLD || e.translationX > SWIPE_DISTANCE_THRESHOLD;
      if (!isSwipeLeft && !isSwipeRight) return;
      const currentIndex = getCurrentTabIndex(pathname);
      if (currentIndex === -1) return;
      const nextIndex = isSwipeLeft ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) return;
      router.navigate(TAB_ROUTES[nextIndex] as any);
    });

  return (
    <GestureDetector gesture={swipeGesture}>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[{ zIndex: 100 }, headerAnimStyle]}>
        <View
          style={{ backgroundColor: colors.surface, paddingTop: statusBarHeight }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <Header />
        </View>
      </Animated.View>
      {/* Absolute tint always covers status bar area — survives header animation */}
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: statusBarHeight,
          backgroundColor: colors.surface,
          zIndex: 200,
        }}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintColor,
          tabBarInactiveTintColor: inactiveColor,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarIcon: () => null,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: colors.bottomTabBackground,
              height: tabBarHeight,
              borderTopColor: colors.bottomTabBorder,
              shadowColor: colors.cardShadow,
              shadowOpacity: 0.04,
              shadowOffset: { width: 0, height: -2 },
              shadowRadius: 8,
            },
            default: {
              backgroundColor: colors.bottomTabBackground,
              height: tabBarHeight,
              borderTopColor: colors.bottomTabBorder,
              elevation: 4,
              paddingBottom: insets.bottom,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            textTransform: "uppercase",
            marginBottom: insets.bottom > 0 ? 0 : 14,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} listeners={({ navigation }) => ({ tabPress: () => { if (navigation.isFocused()) triggerScrollToTop("index"); } })} />
        <Tabs.Screen name="shop" options={{ title: "Shop" }} listeners={({ navigation }) => ({ tabPress: () => { if (navigation.isFocused()) triggerScrollToTop("shop"); } })} />
        <Tabs.Screen name="feed" options={{ title: "Feed" }} listeners={({ navigation }) => ({ tabPress: () => { if (navigation.isFocused()) triggerScrollToTop("feed"); } })} />
        <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} listeners={({ navigation }) => ({ tabPress: () => { if (navigation.isFocused()) triggerScrollToTop("wishlist"); } })} />
        <Tabs.Screen name="brands" options={{ title: "Brands" }} listeners={({ navigation }) => ({ tabPress: () => { if (navigation.isFocused()) triggerScrollToTop("brands"); } })} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
    </GestureDetector>
  );
}
