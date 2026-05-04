import { Tabs, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";
import { HeaderVisibilityProvider, useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { ScrollToTopProvider, useScrollToTop } from "@/context/ScrollToTopContext";

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

function TabLayoutInner() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const tintColor = colors.tabActive;
  const inactiveColor = colors.tabInactive;
  const pathname = usePathname();
  const { headerTranslateY, setHeaderHeight, resetHeader } = useHeaderVisibility();
  const { trigger: triggerScrollToTop } = useScrollToTop();

  useEffect(() => {
    resetHeader();
  }, [pathname]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    marginTop: headerTranslateY.value,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[{ zIndex: 100 }, headerAnimStyle]}>
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: colors.surface }}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <Header />
        </SafeAreaView>
      </Animated.View>
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
  );
}
