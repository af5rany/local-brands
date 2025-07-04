import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
};

const BrandOwnerDashboard = ({
  navigateTo,
  showComingSoon,
  stats,
  loadingStats,
}: BrandOwnerDashboardProps) => (
  <>
    {/* Brand Owner Stats */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My Brand Overview</Text>
      <View style={styles.statsContainer}>
        <StatsCard
          title="My Products"
          value={loadingStats ? "..." : stats.myProducts || 23}
          icon="cube-outline"
          color="#10b981"
          onPress={() => navigateTo("/my-products")}
        />
        <StatsCard
          title="Orders"
          value={loadingStats ? "..." : stats.orders || 45}
          icon="receipt-outline"
          color="#346beb"
          onPress={() => navigateTo("/orders")}
        />
        <StatsCard
          title="Revenue"
          value={loadingStats ? "..." : "$" + (stats.revenue || "2.5k")}
          icon="trending-up-outline"
          color="#f59e0b"
          onPress={showComingSoon}
        />
      </View>
    </View>

    {/* Brand Owner Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Brand Management</Text>
      <View style={styles.actionsContainer}>
        <QuickActionCard
          title="My Products"
          description="Manage your brand's products"
          icon="cube"
          color="#10b981"
          onPress={() => navigateTo("/my-products")}
        />
        <QuickActionCard
          title="Add New Product"
          description="Create and add new products"
          icon="add-circle"
          color="#346beb"
          onPress={() => navigateTo("/add-product")}
        />
        <QuickActionCard
          title="Order Management"
          description="View and manage orders"
          icon="receipt"
          color="#f59e0b"
          onPress={() => navigateTo("/orders")}
        />
        <QuickActionCard
          title="Brand Analytics"
          description="View your brand performance"
          icon="bar-chart"
          color="#8b5cf6"
          onPress={showComingSoon}
        />
      </View>
    </View>
  </>
);

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionsContainer: {
    gap: 12,
  },
});

export default BrandOwnerDashboard;
