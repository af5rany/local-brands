import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import BrandOwnerDashboard from "@/components/BrandOwnerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { RefreshControl } from "react-native";

const HomeScreen = () => {
  const router = useRouter();
  const { token, loading, user } = useAuth();
  const [stats, setStats] = useState({
    brands: 0,
    products: 0,
    users: 0,
    myProducts: 0,
    orders: 0,
    revenue: 0,
    myOrders: 0,
    wishlist: 0,
    cartItems: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user role from JWT token
  const userRole = user?.role || user?.userRole || "customer";
  // console.log(JSON.stringify(user));
  // Check auth state and redirect if no token
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth/login");
    }
  }, [token, loading]);

  // Fetch dashboard stats based on user role
  const fetchStats = async () => {
    if (!token) return;
    setLoadingStats(true);

    try {
      const response = await fetch(`${getApiUrl()}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      console.log('[DEBUG] Fetched Stats:', data);
      setStats((prev) => {
        const newStats = { ...prev, ...data };
        console.log('[DEBUG] Updated State:', newStats);
        return newStats;
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  // useEffect(() => {
  //   fetchStats();
  // }, [token, userRole]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [token, userRole])
  )

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [token, userRole]);

  if (loading || !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#346beb" />
      </View>
    );
  }

  const navigateTo = (route: any) => {
    router.push(route);
  };

  const showComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is under development!");
  };

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return (
          <AdminDashboard
            navigateTo={navigateTo}
            showComingSoon={showComingSoon}
            stats={stats}
            loadingStats={loadingStats}
          />
        );
      case "brandOwner":
        return (
          <BrandOwnerDashboard
            navigateTo={navigateTo}
            showComingSoon={showComingSoon}
            stats={stats}
            loadingStats={loadingStats}
          />
        );
      case "customer":
      default:
        return (
          <CustomerDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={userRole}
        />

        {/* Role-based Dashboard */}
        {renderDashboard()}

        {/* Recent Activity */}
        {/* <RecentActivity
          activities={getRecentActivity(userRole)}
          showComingSoon={showComingSoon}
        /> */}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
