import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HapticTab } from "@/components/HapticTab";
import Header from "@/components/Header";
import { useThemeColors } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => {
            const iconMap: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
              index: { focused: "home", unfocused: "home-outline" },
              shop: { focused: "grid", unfocused: "grid-outline" },
              feed: { focused: "images", unfocused: "images-outline" },
              wishlist: { focused: "heart", unfocused: "heart-outline" },
              brands: { focused: "storefront", unfocused: "storefront-outline" },
            };
            const icons = iconMap[route.name] ?? { focused: "ellipse", unfocused: "ellipse-outline" };
            return (
              <View
                style={{
                  width: 44,
                  height: 32,
                  borderRadius: 9999,
                  backgroundColor: focused ? "#000000" : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? icons.focused : icons.unfocused}
                  size={20}
                  color={focused ? "#ffffff" : "#aaaaaa"}
                />
              </View>
            );
          },
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "#ffffff",
              height: 80,
            },
            default: {
              backgroundColor: "#ffffff",
              height: 80,
              borderTopWidth: 0,
              paddingBottom: 12,
            },
          }),
        })}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="shop" />
        <Tabs.Screen name="feed" />
        <Tabs.Screen name="wishlist" />
        <Tabs.Screen name="brands" />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
