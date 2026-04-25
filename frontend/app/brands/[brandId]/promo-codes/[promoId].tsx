import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const PromoCodeDetailScreen = () => {
  const { brandId, promoId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [promo, setPromo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token || !brandId || !promoId) return;
      try {
        const [statsRes] = await Promise.all([
          fetch(`${getApiUrl()}/brands/${brandId}/promo-codes/${promoId}/usage`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setPromo(data.promoCode);
          setStats(data);
          setDescription(data.promoCode?.description || "");
          setExpiryDate(data.promoCode?.expiryDate?.split("T")[0] || "");
        }
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [token, brandId, promoId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/promo-codes/${promoId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        }),
      });
      if (res.ok) {
        Alert.alert("Saved", "Promo code updated.");
      } else {
        Alert.alert("Error", "Failed to update");
      }
    } catch {}
    finally {
      setSaving(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>{promo?.code || "PROMO CODE"}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        {stats && (
          <View style={[styles.statsGrid, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUses}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>TOTAL USES</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${Number(stats.totalDiscountGiven || 0).toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>DISCOUNT GIVEN</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {promo?.maxUses ? `${promo.usesCount}/${promo.maxUses}` : `${promo?.usesCount} / ∞`}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>USES</Text>
            </View>
          </View>
        )}

        {/* Edit */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>EDIT</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>EXPIRY DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2025-12-31"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Shown to customers at checkout"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.text }, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.background }]}>SAVE CHANGES</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Usage history */}
        {stats?.usages?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>RECENT USAGE</Text>
            {stats.usages.slice(0, 10).map((u: any) => (
              <View
                key={u.id}
                style={[styles.usageRow, { borderBottomColor: colors.borderLight }]}
              >
                <Text style={[styles.usageDate, { color: colors.textTertiary }]}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.usageDiscount, { color: colors.text }]}>
                  -${Number(u.discountApplied).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
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
  content: { padding: 16 },
  statsGrid: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 24,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: "700" },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: "800", marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  saveBtn: { paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontSize: 13, fontWeight: "800" },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  usageDate: { fontSize: 12 },
  usageDiscount: { fontSize: 12, fontWeight: "700" },
});

export default PromoCodeDetailScreen;
