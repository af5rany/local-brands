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
});

export default AdminDashboard;
