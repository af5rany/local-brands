import React from "react";
import { View, Text, StyleSheet } from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";

type CustomerDashboardProps = {
  navigateTo: (path: string) => void;
  stats: {
    myOrders?: number;
    wishlist?: number;
    cartItems?: number;
    [key: string]: number | undefined;
  };
  loadingStats: boolean;
};

const CustomerDashboard = ({
  navigateTo,
  stats,
  loadingStats,
}: CustomerDashboardProps) => (
  <>
    {/* Customer Stats */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shopping Overview</Text>
      <View style={styles.statsContainer}>
        <StatsCard
          title="My Orders"
          value={loadingStats ? "..." : stats.myOrders || 12}
          icon="bag-outline"
          color="#346beb"
          onPress={() => navigateTo("/my-orders")}
        />
        <StatsCard
          title="Wishlist"
          value={loadingStats ? "..." : stats.wishlist || 8}
          icon="heart-outline"
          color="#ef4444"
          onPress={() => navigateTo("/wishlist")}
        />
        <StatsCard
          title="Cart Items"
          value={loadingStats ? "..." : stats.cartItems || 3}
          icon="cart-outline"
          color="#10b981"
          onPress={() => navigateTo("/cart")}
        />
      </View>
    </View>

    {/* Customer Actions */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Shopping</Text>
      <View style={styles.actionsContainer}>
        <QuickActionCard
          title="Browse Products"
          description="Explore available products"
          icon="grid"
          color="#10b981"
          onPress={() => navigateTo("/products")}
        />
        <QuickActionCard
          title="Browse Brands"
          description="Discover your favorite brands"
          icon="storefront"
          color="#346beb"
          onPress={() => navigateTo("/brands")}
        />
        <QuickActionCard
          title="My Orders"
          description="Track your order history"
          icon="receipt"
          color="#f59e0b"
          onPress={() => navigateTo("/my-orders")}
        />
        <QuickActionCard
          title="Wishlist"
          description="View your saved items"
          icon="heart"
          color="#ef4444"
          onPress={() => navigateTo("/wishlist")}
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

export default CustomerDashboard;
