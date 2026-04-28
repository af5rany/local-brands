import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

type Order = {
  id: string;
  status: string;
  total: number;
  date: string;
  items: number;
};

type RecentOrderCardProps = {
  order: Order;
  onPress: () => void;
};

const RecentOrderCard = ({ order, onPress }: RecentOrderCardProps) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return colors.warning;
      case "processing":
        return colors.toastInfo;
      case "shipped":
        return colors.toastInfo;
      case "delivered":
      case "completed":
        return colors.toastSuccess;
      case "cancelled":
        return colors.toastError;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "time-outline";
      case "processing":
        return "refresh-outline";
      case "shipped":
        return "car-outline";
      case "delivered":
      case "completed":
        return "checkmark-circle-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <TouchableOpacity
      style={[styles.card, isTablet && styles.tabletCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(order.status) as any}
            size={12}
            color={colors.textInverse}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Items:</Text>
          <Text style={styles.value}>{order.items}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(order.date)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.link} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    padding: 16,
    marginRight: 16,
    width: 240,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabletCard: {
    width: 320,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textInverse,
    textTransform: "capitalize",
  },
  content: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 16,
    color: colors.toastSuccess,
    fontWeight: "bold",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.link,
    fontWeight: "600",
    marginRight: 4,
  },
});

export default RecentOrderCard;
