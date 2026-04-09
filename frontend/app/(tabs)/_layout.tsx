import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";

export default function TabLayout() {
  const colors = useThemeColors();
  const tintColor = colors.tabActive;
  const inactiveColor = colors.tabInactive;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>
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
              height: 94,
              borderTopColor: colors.bottomTabBorder,
            },
            default: {
              backgroundColor: colors.bottomTabBackground,
              height: 94,
              borderTopColor: colors.bottomTabBorder,
              paddingBottom: 16,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 1.6,
            textTransform: "uppercase",
            marginBottom: 14,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="shop" options={{ title: "Shop" }} />
        <Tabs.Screen name="feed" options={{ title: "Feed" }} />
        <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} />
        <Tabs.Screen name="brands" options={{ title: "Brands" }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
