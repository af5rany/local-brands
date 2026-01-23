// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
          headerRight: () => (
            <Pressable
              onPress={logout}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                marginRight: 15,
              })}
            >
              <IconSymbol name="power" size={24} color="red" />
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
