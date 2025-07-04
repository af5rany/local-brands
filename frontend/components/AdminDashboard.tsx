import React from "react";
import { View, Text, StyleSheet } from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";

type AdminDashboardProps = {
  navigateTo: (path: string) => void;
  showComingSoon: () => void;
  stats: {
    brands: number | string;
    products: number | string;
    users: number | string;
  };
  loadingStats: boolean;
};

const AdminDashboard = ({
  navigateTo,
  showComingSoon,
  stats,
  loadingStats,
}: AdminDashboardProps) => (
  <>
    {/* Admin Stats Overview */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      <View style={styles.statsContainer}>
        <StatsCard
          title="Total Brands"
          value={loadingStats ? "..." : stats.brands}
          icon="storefront-outline"
          color="#346beb"
          onPress={() => navigateTo("/brands")}
        />
        <StatsCard
          title="Total Products"
          value={loadingStats ? "..." : stats.products}
          icon="cube-outline"
          color="#10b981"
          onPress={() => navigateTo("/products")}
        />
        <StatsCard
          title="Total Users"
          value={loadingStats ? "..." : stats.users}
          icon="people-outline"
          color="#f59e0b"
          onPress={() => navigateTo("/users")}
        />
      </View>
    </View>

    {/* Admin Quick Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Admin Actions</Text>
      <View style={styles.actionsContainer}>
        <QuickActionCard
          title="Manage Brands"
          description="View and manage all brands"
          icon="storefront"
          color="#346beb"
          onPress={() => navigateTo("/brands")}
        />
        <QuickActionCard
          title="Product Management"
          description="Manage all products in system"
          icon="cube"
          color="#10b981"
          onPress={() => navigateTo("/products")}
        />
        <QuickActionCard
          title="User Management"
          description="Manage user accounts and roles"
          icon="people"
          color="#f59e0b"
          onPress={() => navigateTo("/users")}
        />
        <QuickActionCard
          title="System Analytics"
          description="View system reports and analytics"
          icon="analytics"
          color="#8b5cf6"
          onPress={showComingSoon}
        />
        <QuickActionCard
          title="Settings"
          description="System configuration and settings"
          icon="settings"
          color="#ef4444"
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

export default AdminDashboard;
