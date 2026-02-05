import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";

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
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Grid layout calculations
  const sidePadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 8;
  const availableWidth = width - (sidePadding * 2) - 8;
  const statsCols = isTablet ? 3 : 1;
  const cardWidth = (availableWidth / statsCols) - (gridGap);

  return (
    <>
      {/* Brand Owner Stats */}
      {/* <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>My Brand Overview</Text>
        <View style={[styles.statsContainer, isTablet && styles.statsContainerTablet]}>
          <StatsCard
            title="My Products"
            value={loadingStats ? "..." : stats.myProducts || 0}
            icon="cube-outline"
            color="#10b981"
            onPress={() => navigateTo("/brands/select")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Orders"
            value={loadingStats ? "..." : stats.orders || 0}
            icon="receipt-outline"
            color="#346beb"
            onPress={() => navigateTo("/orders")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Revenue"
            value={loadingStats ? "..." : "$" + (Number(stats.revenue).toLocaleString() || "0")}
            icon="trending-up-outline"
            color="#f59e0b"
            onPress={showComingSoon}
            style={{ width: cardWidth }}
          />
        </View>
      </View> */}

      {/* Brand Owner Actions */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Brand Management</Text>
        <View style={[styles.actionsContainer, isTablet && styles.actionsGrid]}>
          <QuickActionCard
            title="My Products"
            description="Choose a brand to manage"
            icon="cube"
            color="#10b981"
            onPress={() => navigateTo("/brands/select")}
          />
          <QuickActionCard
            title="Order Management"
            description="View and manage orders"
            icon="receipt"
            color="#f59e0b"
            // onPress={() => navigateTo("/orders")}
            onPress={showComingSoon}
          />
          <QuickActionCard
            title="Brand Analytics"
            description="View your brand performance"
            icon="bar-chart"
            color="#8b5cf6"
            onPress={showComingSoon}
          />
          <QuickActionCard
            title="Continue as Customer"
            description="Shop and browse other brands"
            icon="cart"
            color="#346beb"
            onPress={() => setIsManagementMode(false)}
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
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
