import React from "react";
import { View, Text, StyleSheet, useWindowDimensions, ScrollView } from "react-native";
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
}: AdminDashboardProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Grid layout calculations
  const sidePadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 8;
  const availableWidth = width - (sidePadding * 2) - 8;
  const statsCols = isTablet ? 3 : 1; // On admin, stats are more prominent
  const cardWidth = isTablet ? (availableWidth / statsCols) - (gridGap) : width * 0.8;

  return (
    <>
      {/* Admin Stats Overview */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>System Overview</Text>
        {isTablet ? (
          <View style={[styles.statsContainer, isTablet && styles.statsContainerTablet]}>
            <StatsCard
              title="Total Brands"
              value={loadingStats ? "..." : stats.brands}
              icon="storefront-outline"
              color="#346beb"
              onPress={() => navigateTo("/brands")}
              style={{ width: cardWidth }}
            />
            <StatsCard
              title="Total Products"
              value={loadingStats ? "..." : stats.products}
              icon="cube-outline"
              color="#10b981"
              onPress={() => navigateTo("/products")}
              style={{ width: cardWidth }}
            />
            <StatsCard
              title="Total Users"
              value={loadingStats ? "..." : stats.users}
              icon="people-outline"
              color="#f59e0b"
              onPress={() => navigateTo("/users")}
              style={{ width: cardWidth }}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={cardWidth + gridGap}
            decelerationRate="fast"
            contentContainerStyle={styles.statsScrollContainer}
          >
            <StatsCard
              title="Total Brands"
              value={loadingStats ? "..." : stats.brands}
              icon="storefront-outline"
              color="#346beb"
              onPress={() => navigateTo("/brands")}
              style={{ width: cardWidth, marginRight: gridGap }}
            />
            <StatsCard
              title="Total Products"
              value={loadingStats ? "..." : stats.products}
              icon="cube-outline"
              color="#10b981"
              onPress={() => navigateTo("/products")}
              style={{ width: cardWidth, marginRight: gridGap }}
            />
            <StatsCard
              title="Total Users"
              value={loadingStats ? "..." : stats.users}
              icon="people-outline"
              color="#f59e0b"
              onPress={() => navigateTo("/users")}
              style={{ width: cardWidth }}
            />
          </ScrollView>
        )}
      </View>

      {/* Admin Quick Actions */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Admin Actions</Text>
        <View style={[styles.actionsContainer, isTablet && styles.actionsGrid]}>
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
  statsScrollContainer: {
    paddingRight: 20, // Add some padding at the end of scroll
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

export default AdminDashboard;
