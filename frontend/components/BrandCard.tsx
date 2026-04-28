import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/types/brand";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

interface BrandCardProps {
  brand: Brand;
  onPress: () => void;
  size?: "small" | "medium";
}

const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  onPress,
  size = "medium",
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isSmall = size === "small";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSmall ? styles.containerSmall : styles.containerMedium,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.logoContainer,
          isSmall ? styles.logoContainerSmall : styles.logoContainerMedium,
        ]}
      >
        {brand.logo ? (
          <Image
            source={{ uri: brand.logo }}
            style={[
              styles.logo,
              isSmall ? styles.logoSmall : styles.logoMedium,
            ]}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              isSmall ? styles.logoSmall : styles.logoMedium,
            ]}
          >
            <Ionicons
              name="business"
              size={isSmall ? 24 : 32}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {brand.name}
      </Text>
      {brand.location && !isSmall && (
        <Text style={styles.location} numberOfLines={1}>
          {brand.location}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 16,
  },
  containerMedium: {
    width: 100,
  },
  containerSmall: {
    width: 80,
  },
  logoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  logoContainerMedium: {
    width: 80,
    height: 80,
  },
  logoContainerSmall: {
    width: 60,
    height: 60,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  logoMedium: {
    width: 80,
    height: 80,
  },
  logoSmall: {
    width: 60,
    height: 60,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    width: "100%",
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    width: "100%",
    marginTop: 2,
  },
});

export default BrandCard;
