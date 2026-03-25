import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";

export default function TabLayout() {
  const colors = useThemeColors();
  const tintColor = Colors["light"].tabActive;
  const inactiveColor = Colors["light"].tabInactive;

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
              backgroundColor: Colors["light"].bottomTabBackground,
              height: 80,
              borderTopColor: Colors["light"].bottomTabBorder,
              shadowColor: "#000000",
              shadowOpacity: 0.04,
              shadowOffset: { width: 0, height: -2 },
              shadowRadius: 8,
            },
            default: {
              backgroundColor: Colors["light"].bottomTabBackground,
              height: 64,
              borderTopColor: Colors["light"].bottomTabBorder,
              elevation: 4,
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
        <Tabs.Screen name="wishlist" options={{ title: "Wishlist" }} />
        <Tabs.Screen name="brands" options={{ title: "Brands" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}
