import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const PromoCodesScreen = () => {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPromoCodes = useCallback(async () => {
    if (!token || !brandId) return;
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.items || []);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId]);

  useFocusEffect(useCallback(() => { fetchPromoCodes(); }, [fetchPromoCodes]));

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/promo-codes/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPromoCodes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
        );
      }
    } catch {}
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Promo Code", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await fetch(`${getApiUrl()}/brands/${brandId}/promo-codes/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setPromoCodes((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  const getStatusLabel = (promo: any) => {
    if (!promo.isActive) return { label: "INACTIVE", color: colors.textTertiary };
    if (isExpired(promo.expiryDate)) return { label: "EXPIRED", color: colors.danger };
    if (promo.maxUses && promo.usesCount >= promo.maxUses) return { label: "USED UP", color: colors.danger };
    return { label: "ACTIVE", color: colors.success };
  };

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
        <Text style={[styles.title, { color: colors.text }]}>PROMO CODES</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/brands/${brandId}/promo-codes/create` as any)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPromoCodes(); }} />}
      >
        {promoCodes.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>NO PROMO CODES YET</Text>
            <TouchableOpacity
              style={[styles.createBtn, { borderColor: colors.text }]}
              onPress={() => router.push(`/brands/${brandId}/promo-codes/create` as any)}
            >
              <Text style={[styles.createBtnText, { color: colors.text }]}>CREATE FIRST CODE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          promoCodes.map((promo) => {
            const status = getStatusLabel(promo);
            return (
              <TouchableOpacity
                key={promo.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/brands/${brandId}/promo-codes/${promo.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={[styles.code, { color: colors.text }]}>{promo.code}</Text>
                    <Text style={[styles.desc, { color: colors.textTertiary }]}>
                      {promo.type === "percentage" ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                      {promo.minOrderAmount ? ` · MIN $${promo.minOrderAmount}` : ""}
                    </Text>
                  </View>
                  <Text style={[styles.statusBadge, { color: status.color }]}>{status.label}</Text>
                </View>

                <View style={styles.cardMeta}>
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {promo.usesCount}{promo.maxUses ? `/${promo.maxUses}` : ""} uses
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    EXP: {new Date(promo.expiryDate).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handleToggle(promo.id, promo.isActive)}
                  >
                    <Text style={[styles.actionText, { color: colors.text }]}>
                      {promo.isActive ? "DEACTIVATE" : "ACTIVATE"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.danger }]}
                    onPress={() => handleDelete(promo.id)}
                  >
                    <Text style={[styles.actionText, { color: colors.danger }]}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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
  addBtn: { width: 40, alignItems: "flex-end" },
  content: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 12, fontWeight: "700" },
  createBtn: { borderWidth: 1.5, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnText: { fontSize: 12, fontWeight: "700" },
  card: { borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  code: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  desc: { fontSize: 11, fontWeight: "500" },
  statusBadge: { fontSize: 10, fontWeight: "800" },
  cardMeta: { flexDirection: "row", gap: 16, marginBottom: 12 },
  metaText: { fontSize: 11 },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  actionText: { fontSize: 10, fontWeight: "700" },
});

export default PromoCodesScreen;
