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

const ShippingZonesScreen = () => {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedZone, setExpandedZone] = useState<number | null>(null);

  const fetchZones = useCallback(async () => {
    if (!token || !brandId) return;
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/shipping/zones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setZones(data || []);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId]);

  useFocusEffect(useCallback(() => { fetchZones(); }, [fetchZones]));

  const handleDeleteZone = (id: number) => {
    Alert.alert("Delete Zone", "This will delete the zone and all its rates.", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${getApiUrl()}/brands/${brandId}/shipping/zones/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          setZones((prev) => prev.filter((z) => z.id !== id));
        },
      },
    ]);
  };

  const handleDeleteRate = async (zoneId: number, rateId: number) => {
    await fetch(`${getApiUrl()}/brands/${brandId}/shipping/rates/${rateId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId ? { ...z, rates: z.rates?.filter((r: any) => r.id !== rateId) } : z
      )
    );
  };

  const methodLabel: Record<string, string> = {
    standard: "STANDARD",
    express: "EXPRESS",
    overnight: "OVERNIGHT",
    local_pickup: "LOCAL PICKUP",
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
        <Text style={[styles.title, { color: colors.text }]}>SHIPPING ZONES</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push(`/brands/${brandId}/shipping/zone` as any)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchZones(); }} />}
      >
        {zones.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="airplane-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>NO SHIPPING ZONES</Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
              Add zones to offer shipping to specific regions
            </Text>
            <TouchableOpacity
              style={[styles.createBtn, { borderColor: colors.text }]}
              onPress={() => router.push(`/brands/${brandId}/shipping/zone` as any)}
            >
              <Text style={[styles.createBtnText, { color: colors.text }]}>ADD FIRST ZONE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          zones.map((zone) => (
            <View key={zone.id} style={[styles.zoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Zone header */}
              <TouchableOpacity
                style={styles.zoneHeader}
                onPress={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
              >
                <View style={styles.zoneInfo}>
                  <Text style={[styles.zoneName, { color: colors.text }]}>{zone.name}</Text>
                  <Text style={[styles.zoneCountries, { color: colors.textTertiary }]}>
                    {zone.countries?.join(", ") || "No countries"}
                  </Text>
                </View>
                <View style={styles.zoneRight}>
                  <Text style={[styles.rateCount, { color: colors.textTertiary }]}>
                    {zone.rates?.length || 0} RATES
                  </Text>
                  <Ionicons
                    name={expandedZone === zone.id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textTertiary}
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded rates */}
              {expandedZone === zone.id && (
                <View style={[styles.ratesContainer, { borderTopColor: colors.borderLight }]}>
                  {zone.rates?.length === 0 ? (
                    <Text style={[styles.noRates, { color: colors.textTertiary }]}>No rates yet</Text>
                  ) : (
                    zone.rates?.map((rate: any) => (
                      <View key={rate.id} style={[styles.rateRow, { borderBottomColor: colors.borderLight }]}>
                        <View>
                          <Text style={[styles.rateName, { color: colors.text }]}>
                            {rate.methodName}
                          </Text>
                          <Text style={[styles.rateMeta, { color: colors.textTertiary }]}>
                            {methodLabel[rate.method] || rate.method} · {rate.estimatedDays} days
                          </Text>
                        </View>
                        <View style={styles.rateRight}>
                          <Text style={[styles.ratePrice, { color: colors.text }]}>
                            {Number(rate.price) === 0 ? "FREE" : `$${Number(rate.price).toFixed(2)}`}
                          </Text>
                          <TouchableOpacity onPress={() => handleDeleteRate(zone.id, rate.id)}>
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Zone actions */}
                  <View style={styles.zoneActions}>
                    <TouchableOpacity
                      style={[styles.zoneActionBtn, { borderColor: colors.border }]}
                      onPress={() => router.push(`/brands/${brandId}/shipping/zone?zoneId=${zone.id}` as any)}
                    >
                      <Text style={[styles.zoneActionText, { color: colors.text }]}>+ ADD RATE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.zoneActionBtn, { borderColor: colors.danger }]}
                      onPress={() => handleDeleteZone(zone.id)}
                    >
                      <Text style={[styles.zoneActionText, { color: colors.danger }]}>DELETE ZONE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
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
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 12, fontWeight: "700" },
  emptySubText: { fontSize: 11, textAlign: "center", paddingHorizontal: 32 },
  createBtn: { borderWidth: 1.5, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  createBtnText: { fontSize: 12, fontWeight: "700" },
  zoneCard: { borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  zoneHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  zoneCountries: { fontSize: 11 },
  zoneRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rateCount: { fontSize: 10, fontWeight: "700" },
  ratesContainer: { borderTopWidth: 1, paddingHorizontal: 16, paddingBottom: 8 },
  noRates: { fontSize: 12, paddingVertical: 12 },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rateName: { fontSize: 13, fontWeight: "600", marginBottom: 2 },
  rateMeta: { fontSize: 10 },
  rateRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  ratePrice: { fontSize: 13, fontWeight: "700" },
  zoneActions: { flexDirection: "row", gap: 8, paddingTop: 12 },
  zoneActionBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  zoneActionText: { fontSize: 10, fontWeight: "700" },
});

export default ShippingZonesScreen;
