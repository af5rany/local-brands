import { Tabs, usePathname } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";

const TAB_BAR_CONTENT_HEIGHT = 50;

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const tintColor = colors.tabActive;
  const inactiveColor = colors.tabInactive;
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {!isHome && (
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
          <Header />
        </SafeAreaView>
      )}
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
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="shop" options={{ title: "Shop" }} />
        <Tabs.Screen name="feed" options={{ title: "Feed" }} />
        <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} />
        <Tabs.Screen name="brands" options={{ title: "Brands" }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="index copy" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
