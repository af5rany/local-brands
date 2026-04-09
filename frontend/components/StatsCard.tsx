import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  onPress?: () => void;
  size?: "normal" | "small";
  style?: ViewStyle;
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  onPress,
  size = "normal",
  style,
}) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const isSmall = size === "small";

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
        isSmall && styles.cardSmall,
        isTablet && styles.cardTablet,
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.value,
              { color: colors.text },
              isSmall && styles.valueSmall,
              isTablet && styles.valueTablet,
            ]}
          >
            {value}
          </Text>
          <Text
            style={[
              styles.title,
              { color: colors.textTertiary },
              isSmall && styles.titleSmall,
              isTablet && styles.titleTablet,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: colors.surfaceRaised },
            isSmall && styles.iconBoxSmall,
            isTablet && styles.iconBoxTablet,
          ]}
        >
          <Ionicons
            name={icon}
            size={isTablet ? 30 : isSmall ? 20 : 24}
            color={color}
          />
        </View>
      </View>

      {/* Accent bar at bottom */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    padding: 18,
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardSmall: {
    padding: 14,
  },
  cardTablet: {
    padding: 24,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  valueSmall: {
    fontSize: 20,
  },
  valueTablet: {
    fontSize: 34,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  titleSmall: {
    fontSize: 11,
    marginTop: 2,
  },
  titleTablet: {
    fontSize: 15,
    marginTop: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxSmall: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  iconBoxTablet: {
    width: 60,
    height: 60,
    borderRadius: 0,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});

export default StatsCard;
