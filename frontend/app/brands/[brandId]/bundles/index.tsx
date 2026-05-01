import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";

export default function BundlesScreen() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBundles = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/bundles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBundles(await res.json());
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [brandId, token]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const toggle = async (id: number) => {
    await fetch(`${getApiUrl()}/brands/${brandId}/bundles/${id}/toggle`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBundles();
  };

  const remove = (id: number, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await fetch(`${getApiUrl()}/brands/${brandId}/bundles/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchBundles();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>BUNDLES</Text>
        <TouchableOpacity
          onPress={() => router.push(`/brands/${brandId}/bundles/create` as any)}
          style={[styles.addBtn, { backgroundColor: colors.text }]}
        >
          <Ionicons name="add" size={18} color={colors.background} />
          <Text style={[styles.addBtnText, { color: colors.background }]}>NEW</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {bundles.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="gift-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No bundles yet</Text>
              <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Create bundle deals for your products</Text>
            </View>
          )}
          {bundles.map((b) => (
            <View key={b.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{b.name}</Text>
                  <Text style={[styles.cardDiscount, { color: colors.textSecondary }]}>
                    {b.discountType === "percentage"
                      ? `${b.discountValue}% off`
                      : `$${Number(b.discountValue).toFixed(2)} off`}
                    {" — buy "}
                    {b.minQuantity}+
                  </Text>
                  <Text style={[styles.cardProducts, { color: colors.textTertiary }]}>
                    {b.productIds?.length || 0} product{b.productIds?.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => toggle(b.id)} style={styles.iconBtn}>
                    <Ionicons
                      name={b.isActive ? "toggle" : "toggle-outline"}
                      size={22}
                      color={b.isActive ? colors.success : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push(`/brands/${brandId}/bundles/${b.id}` as any)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(b.id, b.name)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              {!b.isActive && (
                <Text style={[styles.inactiveTag, { color: colors.textTertiary }]}>INACTIVE</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  addBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  list: { padding: 20, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptySub: { fontSize: 12 },
  card: { borderRadius: 8, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardName: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  cardDiscount: { fontSize: 12, marginBottom: 2 },
  cardProducts: { fontSize: 11 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 6 },
  inactiveTag: { fontSize: 9, fontWeight: "700", letterSpacing: 1, marginTop: 6 },
});
