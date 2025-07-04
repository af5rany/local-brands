import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import BrandOwnerDashboard from "@/components/BrandOwnerDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import RecentActivity from "@/components/RecentActivityItem";
import Header from "@/components/Header";
import { getRecentActivity } from "@/utils/activityUtils";

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
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        // Mock data based on user role
        setTimeout(() => {
          if (userRole === "admin") {
            setStats({
              brands: 24,
              products: 156,
              users: 89,
              myProducts: 0,
              orders: 0,
              revenue: 0,
              myOrders: 0,
              wishlist: 0,
              cartItems: 0,
            });
          } else if (userRole === "brandOwner") {
            setStats({
              brands: 0,
              products: 0,
              users: 0,
              myProducts: 23,
              orders: 45,
              revenue: 2500,
              myOrders: 0,
              wishlist: 0,
              cartItems: 0,
            });
          } else {
            // customer
            setStats({
              brands: 0,
              products: 0,
              users: 0,
              myProducts: 0,
              orders: 0,
              revenue: 0,
              myOrders: 12,
              wishlist: 8,
              cartItems: 3,
            });
          }
          setLoadingStats(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setLoadingStats(false);
      }
    };

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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Header
          userName={user?.name || user?.email?.split("@")[0]}
          userRole={userRole}
        />

        {/* Role-based Dashboard */}
        {renderDashboard()}

        {/* Recent Activity */}
        <RecentActivity
          activities={getRecentActivity(userRole)}
          showComingSoon={showComingSoon}
        />

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
