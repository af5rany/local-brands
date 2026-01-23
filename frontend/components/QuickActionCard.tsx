import React from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  color,
  onPress,
}) => {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <RectButton style={[styles.rightAction, { backgroundColor: color }]} onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: trans }] }}>
          <Ionicons name="arrow-forward" size={30} color="#fff" />
          <Text style={styles.actionText}>Go</Text>
        </Animated.View>
      </RectButton>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      <Pressable style={styles.actionCard} onPress={onPress}>
        <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#64748b",
  },
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    borderRadius: 12,
    width: 80,
    marginVertical: 4,
    marginRight: 4,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});

export default QuickActionCard;
