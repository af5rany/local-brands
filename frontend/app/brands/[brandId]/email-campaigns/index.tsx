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

const STATUS_COLORS: Record<string, string> = {
  draft: "#888",
  scheduled: "#f59e0b",
  sending: "#3b82f6",
  sent: "#10b981",
  failed: "#ef4444",
};

export default function EmailCampaignsScreen() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCampaigns(await res.json());
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [brandId, token]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const sendCampaign = async (id: number, subject: string) => {
    Alert.alert("Send Campaign", `Send "${subject}" to all followers now?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send", onPress: async () => {
          const res = await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns/${id}/send`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert("Sent", "Campaign is being delivered"); fetchCampaigns(); }
          else Alert.alert("Error", "Failed to send campaign");
        },
      },
    ]);
  };

  const deleteCampaign = async (id: number, subject: string) => {
    Alert.alert("Delete", `Delete "${subject}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchCampaigns();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>EMAIL CAMPAIGNS</Text>
        <TouchableOpacity
          onPress={() => router.push(`/brands/${brandId}/email-campaigns/create` as any)}
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
          {campaigns.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="mail-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No campaigns yet</Text>
              <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Create an email blast for your followers</Text>
            </View>
          )}
          {campaigns.map((c) => (
            <View key={c.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardSubject, { color: colors.text }]}>{c.subject}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[c.status] + "20" }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[c.status] }]}>
                        {c.status.toUpperCase()}
                      </Text>
                    </View>
                    {c.sentCount > 0 && (
                      <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                        {c.sentCount}/{c.recipientCount} sent
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.actions}>
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <TouchableOpacity onPress={() => sendCampaign(c.id, c.subject)} style={styles.iconBtn}>
                      <Ionicons name="send-outline" size={18} color={colors.text} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => router.push(`/brands/${brandId}/email-campaigns/${c.id}` as any)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCampaign(c.id, c.subject)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.cardDate, { color: colors.textTertiary }]}>
                {c.sentAt ? `Sent ${new Date(c.sentAt).toLocaleDateString()}` : `Created ${new Date(c.createdAt).toLocaleDateString()}`}
              </Text>
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
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  cardSubject: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  metaText: { fontSize: 11 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 6 },
  cardDate: { fontSize: 11 },
});
