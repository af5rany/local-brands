import React from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";
import RecentOrderCard from "./RecentOrderCard";
import RecommendationCard from "./RecommendationCard";

type CustomerDashboardProps = {
  navigateTo: (path: string) => void;
  stats: {
    myOrders?: number;
    wishlist?: number;
    cartItems?: number;
    totalSpent?: number;
    pendingOrders?: number;
    completedOrders?: number;
    [key: string]: number | undefined;
  };
  loadingStats: boolean;
  recentOrders?: Array<{
    id: string;
    status: string;
    total: number;
    date: string;
    items: number;
  }>;
  recommendations?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    brand: string;
  }>;
  user?: {
    name: string;
    memberSince?: string;
  };
};

const CustomerDashboard = ({
  navigateTo,
  stats,
  loadingStats,
  recentOrders = [],
  recommendations = [],
  user,
}: CustomerDashboardProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  // Grid layout calculations
  const sidePadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 8;
  const availableWidth = width - (sidePadding * 2) - 8; // Adjust for horizontal margins

  const statsCols = isTablet ? 4 : 2;
  const cardWidth = (availableWidth / statsCols) - (gridGap);

  const actionCols = isTablet ? 2 : 1;
  const actionCardWidth = (availableWidth / actionCols) - (gridGap);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      {user && (
        <View style={[styles.welcomeSection, isTablet && styles.welcomeSectionTablet]}>
          <Text style={[styles.welcomeText, isTablet && styles.welcomeTextTablet]}>Welcome back, {user.name}! 👋</Text>
          {user.memberSince && (
            <Text style={[styles.memberSince, isTablet && styles.memberSinceTablet]}>
              Member since {user.memberSince}
            </Text>
          )}
        </View>
      )}

      {/* Enhanced Stats Section */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Shopping Overview</Text>
        <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
          <StatsCard
            title="My Orders"
            value={loadingStats ? "..." : stats.myOrders || 0}
            icon="bag-outline"
            color="#346beb"
            onPress={() => navigateTo("/my-orders")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Wishlist"
            value={loadingStats ? "..." : stats.wishlist || 0}
            icon="heart-outline"
            color="#ef4444"
            onPress={() => navigateTo("/wishlist")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Cart Items"
            value={loadingStats ? "..." : stats.cartItems || 0}
            icon="cart-outline"
            color="#10b981"
            onPress={() => navigateTo("/cart")}
            style={{ width: cardWidth }}
          />
          <StatsCard
            title="Total Spent"
            value={loadingStats ? "..." : `$${Number(stats.totalSpent).toLocaleString() || 0}`}
            icon="cash-outline"
            color="#8b5cf6"
            onPress={() => navigateTo("/order-history")}
            style={{ width: cardWidth }}
          />
        </View>

        {/* Order Status Stats */}
        <View style={[styles.orderStatsContainer, isTablet && styles.orderStatsContainerTablet]}>
          <StatsCard
            title="Pending"
            value={loadingStats ? "..." : stats.pendingOrders || 0}
            icon="time-outline"
            color="#f59e0b"
            size="small"
            onPress={() => navigateTo("/my-orders?status=pending")}
            style={{ width: isTablet ? cardWidth : cardWidth * 0.95 }}
          />
          <StatsCard
            title="Completed"
            value={loadingStats ? "..." : stats.completedOrders || 0}
            icon="checkmark-circle-outline"
            color="#10b981"
            size="small"
            onPress={() => navigateTo("/my-orders?status=completed")}
            style={{ width: isTablet ? cardWidth : cardWidth * 0.95 }}
          />
        </View>
      </View>

      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <View style={[styles.section, isTablet && styles.sectionTablet]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Recent Orders</Text>
            <Text
              style={[styles.seeAllText, isTablet && styles.seeAllTextTablet]}
              onPress={() => navigateTo("/my-orders")}
            >
              See All
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={isTablet && styles.horizontalScrollContent}>
            {recentOrders.slice(0, 3).map((order) => (
              <RecentOrderCard
                key={order.id}
                order={order}
                onPress={() => navigateTo(`/orders/${order.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Actions Section */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Quick Shopping</Text>
        <View style={[styles.actionsContainer, isTablet && styles.actionsGrid]}>
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
            title="Order Status"
            description="Track your current orders"
            icon="location"
            color="#f59e0b"
            onPress={() => navigateTo("/track-orders")}
          />
          <QuickActionCard
            title="Customer Support"
            description="Get help with your orders"
            icon="help-circle"
            color="#6366f1"
            onPress={() => navigateTo("/support")}
          />
        </View>
      </View>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <View style={[styles.section, isTablet && styles.sectionTablet]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Recommended for You</Text>
            <Text
              style={[styles.seeAllText, isTablet && styles.seeAllTextTablet]}
              onPress={() => navigateTo("/products?recommended=true")}
            >
              See All
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={isTablet && styles.horizontalScrollContent}>
            {recommendations.slice(0, 5).map((product) => (
              <RecommendationCard
                key={product.id}
                product={product}
                onPress={() => navigateTo(`/products/${product.id}`)}
                onAddToWishlist={() => {
                  /* Add to wishlist logic */
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Additional Quick Actions */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>Account & Settings</Text>
        <View style={[styles.actionsContainer, isTablet && styles.actionsGrid]}>
          <QuickActionCard
            title="Profile Settings"
            description="Update your personal information"
            icon="person"
            color="#64748b"
            onPress={() => navigateTo("/profile")}
          />
          <QuickActionCard
            title="Order History"
            description="View all your past orders"
            icon="time"
            color="#8b5cf6"
            onPress={() => navigateTo("/order-history")}
          />
          <QuickActionCard
            title="Notifications"
            description="Manage your preferences"
            icon="notifications"
            color="#f97316"
            onPress={() => navigateTo("/notifications")}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  welcomeSection: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeSectionTablet: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginHorizontal: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  welcomeTextTablet: {
    fontSize: 32,
  },
  memberSince: {
    fontSize: 14,
    color: "#64748b",
  },
  memberSinceTablet: {
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTablet: {
    paddingHorizontal: 32,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  seeAllText: {
    fontSize: 14,
    color: "#346beb",
    fontWeight: "600",
  },
  seeAllTextTablet: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  statsGridTablet: {
    marginHorizontal: -8,
  },
  orderStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginHorizontal: -4,
  },
  orderStatsContainerTablet: {
    marginHorizontal: -8,
    marginTop: 16,
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
  horizontalScrollContent: {
    paddingRight: 32,
  },
});

export default CustomerDashboard;
