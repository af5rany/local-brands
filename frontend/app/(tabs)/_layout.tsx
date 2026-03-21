import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Colors } from "@/constants/Colors";
import { HapticTab } from "@/components/HapticTab";

export default function TabLayout() {
    // const colorScheme = useColorScheme();
    // const tintColor = Colors[colorScheme ?? "light"].primary;
    // const inactiveColor = Colors[colorScheme ?? "light"].tabInactive;

  const tintColor = Colors["light"].primary;
  const inactiveColor = "#BBBBBB";

  return (
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
            backgroundColor: "#F8F4EF",
            height: 80,
            shadowColor: "#000000",
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 16,
          },
          default: {
            backgroundColor: "#F8F4EF", // 🎨 same color for Android
            height: 64,
            borderTopWidth: 0,
            elevation: 12,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 14,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="shop" options={{ title: "Shop" }} />
      <Tabs.Screen name="brands" options={{ title: "Brands" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} />
    </Tabs>
  );
}
