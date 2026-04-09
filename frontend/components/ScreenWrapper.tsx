import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenWrapper({ children, style }: Props) {
  return (
    <SafeAreaView edges={["bottom"]} style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}
