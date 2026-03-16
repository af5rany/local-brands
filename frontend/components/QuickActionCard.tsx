import React from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { useThemeColors } from "@/hooks/useThemeColor";

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
  const colors = useThemeColors();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <RectButton
        style={[styles.rightAction, { backgroundColor: color }]}
        onPress={onPress}
      >
        <Animated.View style={{ transform: [{ scale: trans }] }}>
          <Ionicons name="arrow-forward" size={28} color="#fff" />
          <Text style={styles.swipeText}>Go</Text>
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
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
        onPress={onPress}
      >
        <View style={[styles.iconBox, { backgroundColor: color + "18" }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textTertiary }]}>
            {description}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
  },
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    borderRadius: 16,
    width: 80,
    marginVertical: 4,
    marginRight: 4,
  },
  swipeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
});

export default QuickActionCard;
