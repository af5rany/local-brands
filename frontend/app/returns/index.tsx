import React, { useState, useCallback, useMemo } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import getApiUrl from "@/helpers/getApiUrl";

const ReturnsListScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "requested": return colors.warning;
      case "approved": return colors.toastInfo;
      case "rejected": return colors.toastError;
      case "shipped_back": return colors.toastInfo;
      case "received": return colors.toastInfo;
      case "refunded": return colors.toastSuccess;
      default: return colors.text;
    }
  };

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReturns = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/returns/my-returns`, {
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
  }, [token]);

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
        <Text style={[styles.title, { color: colors.text }]}>MY RETURNS</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} />
        }
        contentContainerStyle={returns.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="return-down-back-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>NO RETURNS YET</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(`/returns/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={[styles.returnId, { color: colors.text }]}>RETURN #{item.id}</Text>
                <Text style={[styles.orderId, { color: colors.textTertiary }]}>
                  ORDER #{item.order?.orderNumber || item.orderId}
                </Text>
              </View>
              <Text style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 80 },
  emptyText: { fontSize: 12, fontWeight: "700" },
  card: { borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  returnId: { fontSize: 15, fontWeight: "800" },
  orderId: { fontSize: 11, marginTop: 2 },
  statusBadge: { fontSize: 10, fontWeight: "800" },
  reason: { fontSize: 12, marginBottom: 6 },
  date: { fontSize: 11 },
});

export default ReturnsListScreen;
