import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";
import { useThemeColors } from "@/hooks/useThemeColor";

type BrandOwnerDashboardProps = {
  navigateTo: (path: string) => void;
  showComingSoon: () => void;
  stats: {
    myProducts?: number;
    orders?: number;
    revenue?: number | string;
  };
  loadingStats: boolean;
  setIsManagementMode: (isManagementMode: boolean) => void;
};

const BrandOwnerDashboard = ({
  navigateTo,
  showComingSoon,
  stats,
  loadingStats,
  setIsManagementMode,
}: BrandOwnerDashboardProps) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const sidePadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 8;
  const availableWidth = width - sidePadding * 2 - 8;
  const statsCols = isTablet ? 3 : 1;
  const cardWidth = availableWidth / statsCols - gridGap;

  const actions = [
    {
      title: "My Products",
      description: "Choose a brand to manage",
      icon: "cube" as const,
      color: colors.success,
      onPress: () => navigateTo("/brands/select"),
    },
    {
      title: "Order Management",
      description: "View and manage orders",
      icon: "receipt" as const,
      color: colors.accent,
      onPress: showComingSoon,
    },
    {
      title: "Brand Analytics",
      description: "View your brand performance",
      icon: "bar-chart" as const,
      color: colors.text,
      onPress: showComingSoon,
    },
    {
      title: "Continue as Customer",
      description: "Shop and browse other brands",
      icon: "cart" as const,
      color: colors.primary,
      onPress: () => setIsManagementMode(false),
    },
  ];

  if (loadingStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Brand Owner Stats */}
      {/* <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, { color: colors.text }, isTablet && styles.sectionTitleTablet]}>
          My Brand Overview
        </Text>
        <View style={[styles.statsContainer, isTablet && styles.statsContainerTablet]}>
          <StatsCard
            title="My Products"
            value={loadingStats ? "..." : stats.myProducts || 0}
            icon="cube-outline"
            color={colors.success}
            onPress={() => navigateTo("/brands/select")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Orders"
            value={loadingStats ? "..." : stats.orders || 0}
            icon="receipt-outline"
            color={colors.primary}
            onPress={() => navigateTo("/orders")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Revenue"
            value={loadingStats ? "..." : "$" + (Number(stats.revenue).toLocaleString() || "0")}
            icon="trending-up-outline"
            color={colors.accent}
            onPress={showComingSoon}
            style={{ width: cardWidth }}
          />
        </View>
      </View> */}

      {/* Brand Owner Actions */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
            isTablet && styles.sectionTitleTablet,
          ]}
        >
          Brand Management
        </Text>
        <View style={[styles.actionsContainer, isTablet && styles.actionsGrid]}>
          {actions.map((a) => (
            <QuickActionCard
              key={a.title}
              title={a.title}
              description={a.description}
              icon={a.icon}
              color={a.color}
              onPress={a.onPress}
            />
          ))}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTablet: {
    paddingHorizontal: 32,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionTitleTablet: {
    fontSize: 26,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  statsContainerTablet: {
    marginHorizontal: -8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
});

export default BrandOwnerDashboard;
