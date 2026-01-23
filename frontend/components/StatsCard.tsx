import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  onPress?: () => void;
  size?: "normal" | "small";
  style?: any;
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
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const isSmall = size === "small";

  return (
    <Pressable
      style={[
        styles.statsCard,
        { borderLeftColor: color },
        isSmall && styles.smallCard,
        isTablet && styles.tabletCard,
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.statsContent}>
        <View style={styles.textContainer}>
          <Text style={[
            styles.statsValue,
            isSmall && styles.smallStatsValue,
            isTablet && styles.tabletStatsValue
          ]}>
            {value}
          </Text>
          <Text
            style={[
              styles.statsTitle,
              isSmall && styles.smallStatsTitle,
              isTablet && styles.tabletStatsTitle
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View
          style={[
            styles.statsIcon,
            { backgroundColor: color + "20" },
            isSmall && styles.smallStatsIcon,
            isTablet && styles.tabletStatsIcon,
          ]}
        >
          <Ionicons name={icon} size={isTablet ? 32 : (isSmall ? 20 : 24)} color={color} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallCard: {
    padding: 12,
    borderLeftWidth: 3,
  },
  tabletCard: {
    padding: 24,
    borderLeftWidth: 6,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  tabletStatsValue: {
    fontSize: 32,
  },
  smallStatsValue: {
    fontSize: 18,
  },
  statsTitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  tabletStatsTitle: {
    fontSize: 14,
  },
  smallStatsTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tabletStatsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  smallStatsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default StatsCard;
