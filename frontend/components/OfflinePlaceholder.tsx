import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

interface OfflinePlaceholderProps {
  onRetry?: () => void;
}

const OfflinePlaceholder: React.FC<OfflinePlaceholderProps> = ({ onRetry }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="wifi-outline" size={48} color={colors.textTertiary} />
      <Text style={styles.title}>NO INTERNET CONNECTION</Text>
      <Text style={styles.subtitle}>CHECK YOUR CONNECTION AND TRY AGAIN</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
      paddingHorizontal: 24,
      gap: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginTop: 8,
    },
    subtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    retryText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 2,
    },
  });

export default OfflinePlaceholder;
