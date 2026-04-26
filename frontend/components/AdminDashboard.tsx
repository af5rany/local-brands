import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import StatsCard from "./StatsCard";
import QuickActionCard from "./QuickActionCard";
import { useThemeColors } from "@/hooks/useThemeColor";

type AdminDashboardProps = {
  navigateTo: (path: string) => void;
  showComingSoon: () => void;
  stats: {
    brands: number | string;
    products: number | string;
    users: number | string;
    totalRevenue?: number;
    revenueThisMonth?: number;
    revenueLastMonth?: number;
    ordersTotal?: number;
    ordersThisMonth?: number;
    newUsersThisMonth?: number;
    userGrowthPercent?: number;
    ordersByStatus?: Record<string, number>;
    topBrands?: { brandId: number; brandName: string; revenue: number }[];
    gmvByMonth?: { month: string; gmv: number }[];
  };
  loadingStats: boolean;
  setIsManagementMode: (isManagementMode: boolean) => void;
};

const AdminDashboard = ({
  navigateTo,
  showComingSoon,
  stats,
  loadingStats,
  setIsManagementMode,
}: AdminDashboardProps) => {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const sidePadding = isTablet ? 32 : 20;
  const gridGap = isTablet ? 16 : 10;
  const availableWidth = width - sidePadding * 2;
  const statsCols = isTablet ? 3 : 1;
  const cardWidth = isTablet
    ? availableWidth / statsCols - gridGap
    : width * 0.78;

  const statsData = [
    {
      title: "Total Brands",
      value: stats.brands,
      icon: "storefront-outline" as const,
      color: colors.primary,
    },
    {
      title: "Total Products",
      value: stats.products,
      icon: "cube-outline" as const,
      color: colors.success,
    },
    {
      title: "Total Users",
      value: stats.users,
      icon: "people-outline" as const,
      color: colors.accent,
    },
  ];

  const actions = [
    {
      title: "Manage Brands",
      description: "View and manage all brands",
      icon: "storefront" as const,
      color: colors.primary,
      onPress: () => navigateTo("/(tabs)/brands"),
    },
    {
      title: "Product Management",
      description: "Manage all products in system",
      icon: "cube" as const,
      color: colors.success,
      onPress: () => navigateTo("/products"),
    },
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: "people" as const,
      color: colors.accent,
      onPress: () => navigateTo("/users"),
    },
    {
      title: "System Analytics",
      description: "View system reports and analytics",
      icon: "analytics" as const,
      color: colors.text,
      onPress: showComingSoon,
    },
    {
      title: "Settings",
      description: "System configuration and settings",
      icon: "settings" as const,
      color: colors.danger,
      onPress: showComingSoon,
    },
    {
      title: "Continue as Customer",
      description: "Shop and browse as a customer",
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
      {/* Stats */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
            isTablet && styles.sectionTitleTablet,
          ]}
        >
          System Overview
        </Text>
        {isTablet ? (
          <View style={styles.statsRow}>
            {statsData.map((s) => (
              <StatsCard
                key={s.title}
                title={s.title}
                value={s.value}
                icon={s.icon}
                color={s.color}
                onPress={() =>
                  navigateTo(
                    s.title.includes("Brand")
                      ? "/(tabs)/brands"
                      : s.title.includes("Product")
                        ? "/products"
                        : "/users",
                  )
                }
                style={{ width: cardWidth }}
              />
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + gridGap}
            decelerationRate="fast"
            contentContainerStyle={styles.statsScroll}
          >
            {statsData.map((s, i) => (
              <StatsCard
                key={s.title}
                title={s.title}
                value={s.value}
                icon={s.icon}
                color={s.color}
                onPress={() =>
                  navigateTo(
                    s.title.includes("Brand")
                      ? "/(tabs)/brands"
                      : s.title.includes("Product")
                        ? "/products"
                        : "/users",
                  )
                }
                style={{
                  width: cardWidth,
                  marginRight: i < statsData.length - 1 ? gridGap : 0,
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Analytics Section */}
      {stats.totalRevenue !== undefined && (
        <View style={[styles.section, isTablet && styles.sectionTablet]}>
          <Text style={[styles.sectionTitle, { color: colors.text }, isTablet && styles.sectionTitleTablet]}>
            System Analytics
          </Text>
          {/* Revenue Cards */}
          <View style={styles.analyticsRow}>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>TOTAL REVENUE</Text>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>${stats.totalRevenue?.toFixed(2)}</Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>THIS MONTH</Text>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>${stats.revenueThisMonth?.toFixed(2)}</Text>
              {(stats.revenueLastMonth ?? 0) > 0 && (
                <Text style={[styles.analyticsSub, { color: (stats.revenueThisMonth ?? 0) >= (stats.revenueLastMonth ?? 0) ? colors.success : colors.danger }]}>
                  vs ${stats.revenueLastMonth?.toFixed(2)} last month
                </Text>
              )}
            </View>
          </View>
          <View style={styles.analyticsRow}>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>TOTAL ORDERS</Text>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>{stats.ordersTotal}</Text>
              <Text style={[styles.analyticsSub, { color: colors.textTertiary }]}>{stats.ordersThisMonth} this month</Text>
            </View>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>NEW USERS</Text>
              <Text style={[styles.analyticsValue, { color: colors.text }]}>{stats.newUsersThisMonth}</Text>
              {(stats.userGrowthPercent ?? 0) !== 0 && (
                <Text style={[styles.analyticsSub, { color: (stats.userGrowthPercent ?? 0) >= 0 ? colors.success : colors.danger }]}>
                  {(stats.userGrowthPercent ?? 0) >= 0 ? "+" : ""}{stats.userGrowthPercent}% vs last month
                </Text>
              )}
            </View>
          </View>
          {/* GMV Chart (simple bar) */}
          {stats.gmvByMonth && stats.gmvByMonth.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>GMV — LAST 6 MONTHS</Text>
              <View style={styles.barChart}>
                {(() => {
                  const maxGmv = Math.max(...(stats.gmvByMonth || []).map((m) => m.gmv), 1);
                  return (stats.gmvByMonth || []).map((m) => (
                    <View key={m.month} style={styles.barWrapper}>
                      <View style={[styles.bar, { height: Math.max(4, (m.gmv / maxGmv) * 80), backgroundColor: colors.text }]} />
                      <Text style={[styles.barLabel, { color: colors.textTertiary }]}>{m.month}</Text>
                    </View>
                  ));
                })()}
              </View>
            </View>
          )}
          {/* Top Brands */}
          {stats.topBrands && stats.topBrands.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>TOP BRANDS BY REVENUE</Text>
              {stats.topBrands.map((b, i) => (
                <View key={b.brandId} style={styles.topBrandRow}>
                  <Text style={[styles.topBrandRank, { color: colors.textTertiary }]}>{i + 1}</Text>
                  <Text style={[styles.topBrandName, { color: colors.text }]}>{b.brandName}</Text>
                  <Text style={[styles.topBrandRevenue, { color: colors.textSecondary }]}>${b.revenue.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.section, isTablet && styles.sectionTablet]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text },
            isTablet && styles.sectionTitleTablet,
          ]}
        >
          Admin Actions
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
    // letterSpacing: -0.3,
  },
  sectionTitleTablet: {
    fontSize: 26,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsScroll: {
    paddingRight: 20,
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
  analyticsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  analyticsCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  analyticsLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  analyticsSub: {
    fontSize: 10,
    marginTop: 2,
  },
  chartCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 12,
    height: 90,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  topBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  topBrandRank: {
    fontSize: 11,
    fontWeight: "700",
    width: 16,
  },
  topBrandName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  topBrandRevenue: {
    fontSize: 12,
  },
});

export default AdminDashboard;
