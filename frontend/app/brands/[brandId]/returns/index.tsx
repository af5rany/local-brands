import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const STATUSES = ["all", "requested", "approved", "rejected", "shipped_back", "received", "refunded"];

const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b",
  approved: "#3b82f6",
  rejected: "#ef4444",
  shipped_back: "#8b5cf6",
  received: "#06b6d4",
  refunded: "#22c55e",
};

const BrandReturnsScreen = () => {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState("all");

  const fetchReturns = useCallback(async () => {
    if (!token || !brandId) return;
    try {
      const statusParam = activeStatus !== "all" ? `&status=${activeStatus}` : "";
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/returns?limit=50${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReturns(data.items || []);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId, activeStatus]);

  useFocusEffect(useCallback(() => { fetchReturns(); }, [fetchReturns]));

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>RETURNS</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Status filters */}
      <FlatList
        horizontal
        data={STATUSES}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { borderColor: colors.border },
              activeStatus === item && { backgroundColor: colors.text, borderColor: colors.text },
            ]}
            onPress={() => setActiveStatus(item)}
          >
            <Text style={[styles.filterText, { color: activeStatus === item ? colors.background : colors.text }]}>
              {item.replace(/_/g, " ").toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} />
        }
        contentContainerStyle={returns.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>NO RETURNS</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(`/brands/${brandId}/returns/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={[styles.returnId, { color: colors.text }]}>RETURN #{item.id}</Text>
                <Text style={[styles.customer, { color: colors.textTertiary }]}>
                  {item.user?.name || "Customer"}
                </Text>
              </View>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] || colors.text }]}>
                {item.status?.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.reason, { color: colors.textTertiary }]}>
              {item.reason?.replace(/_/g, " ").toUpperCase()}
            </Text>
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  title: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "800" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  filterText: { fontSize: 10, fontWeight: "700" },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 12, fontWeight: "700" },
  card: { borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  returnId: { fontSize: 15, fontWeight: "800" },
  customer: { fontSize: 11, marginTop: 2 },
  status: { fontSize: 10, fontWeight: "800" },
  reason: { fontSize: 12, marginBottom: 4 },
  date: { fontSize: 11 },
});

export default BrandReturnsScreen;
