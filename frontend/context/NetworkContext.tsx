import React, { createContext, useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const colors = useThemeColors();
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const slideAnim = useState(() => new Animated.Value(-60))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (!connected) {
        setShowBanner(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (showBanner) {
        // Show "back online" briefly then hide
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowBanner(false));
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [showBanner]);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
      {showBanner && (
        <Animated.View
          style={[
            styles.banner,
            {
              backgroundColor: isConnected ? colors.toastSuccess : colors.primary,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Ionicons
            name={isConnected ? "wifi" : "cloud-offline-outline"}
            size={16}
            color={colors.textInverse}
          />
          <Text style={styles.bannerText}>
            {isConnected ? "Back online" : "No internet connection"}
          </Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 9999,
  },
  bannerText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    // letterSpacing: 0.3,
  },
});
