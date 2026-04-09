import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import AdminDashboard from "@/components/AdminDashboard";
import BrandOwnerDashboard from "@/components/BrandOwnerDashboard";
import getApiUrl from "@/helpers/getApiUrl";

const ManageScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, user } = useAuth();
  const { selectedBrandId, setIsManagementMode } = useBrand();

  const userRole = user?.role || user?.userRole || "customer";
  const [stats, setStats] = useState({
    brands: 0,
    products: 0,
    users: 0,
    myProducts: 0,
    orders: 0,
    revenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const statsUrl =
        userRole === "brandOwner" && selectedBrandId
          ? `${apiUrl}/statistics?brandId=${selectedBrandId}`
          : `${apiUrl}/statistics`;

      const response = await fetch(statsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  }, [token, userRole, selectedBrandId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const navigateTo = (route: any) => {
    router.push(route);
  };

  const showComingSoon = () => {
    Alert.alert("Coming Soon", "This feature is under development!");
  };

  const handleBackToShopping = () => {
    setIsManagementMode(false);
    router.back();
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBackToShopping}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="speedometer" size={18} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Management
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleBackToShopping}
          style={[styles.closeBtn, { backgroundColor: colors.surfaceRaised }]}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {userRole === "admin" ? (
          <AdminDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
            showComingSoon={showComingSoon}
            setIsManagementMode={(val: boolean) => {
              setIsManagementMode(val);
              if (!val) router.back();
            }}
          />
        ) : userRole === "brandOwner" ? (
          <BrandOwnerDashboard
            navigateTo={navigateTo}
            stats={stats}
            loadingStats={loadingStats}
            showComingSoon={showComingSoon}
            setIsManagementMode={(val: boolean) => {
              setIsManagementMode(val);
              if (!val) router.back();
            }}
          />
        ) : null}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ManageScreen;
