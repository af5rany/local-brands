import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";

export default function EditEmailCampaignScreen() {
  const { brandId, campaignId } = useLocalSearchParams<{ brandId: string; campaignId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((list: any[]) => {
        const found = list.find((c) => String(c.id) === campaignId);
        if (found) {
          setCampaign(found);
          setSubject(found.subject);
          setBody(found.body);
          setPreviewText(found.previewText || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId, campaignId, token]);

  const update = async () => {
    if (!subject.trim()) return Alert.alert("Error", "Subject is required");
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns/${campaignId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, previewText }),
      });
      Alert.alert("Saved", "Campaign updated");
      router.back();
    } catch {
      Alert.alert("Error", "Could not update campaign");
    } finally {
      setSaving(false);
    }
  };

  const send = () => {
    Alert.alert("Send Campaign", "Send to all followers now?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send", onPress: async () => {
          const res = await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns/${campaignId}/send`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) { Alert.alert("Sent", "Delivering to followers"); router.back(); }
          else Alert.alert("Error", "Failed to send");
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>EDIT CAMPAIGN</Text>
          {campaign?.status && (
            <Text style={[styles.statusBadge, { color: colors.textSecondary }]}>
              {campaign.status.toUpperCase()}
            </Text>
          )}
        </View>
        {campaign && (
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{campaign.recipientCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>RECIPIENTS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{campaign.sentCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>SENT</Text>
            </View>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>SUBJECT</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={subject} onChangeText={setSubject} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>PREVIEW TEXT</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={previewText} onChangeText={setPreviewText} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>BODY</Text>
        <TextInput style={[styles.input, styles.bodyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={body} onChangeText={setBody} multiline textAlignVertical="top" placeholderTextColor={colors.textTertiary} />

        <View style={styles.btnRow}>
          <TouchableOpacity onPress={update} disabled={saving}
            style={[styles.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            {saving ? <ActivityIndicator /> : <Text style={[styles.btnText, { color: colors.text }]}>UPDATE</Text>}
          </TouchableOpacity>
          {campaign?.status !== "sent" && (
            <TouchableOpacity onPress={send} style={[styles.btn, { backgroundColor: colors.text }]}>
              <Text style={[styles.btnText, { color: colors.background }]}>SEND NOW</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: 2 },
  statusBadge: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  statsRow: { flexDirection: "row", borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 16, gap: 20 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  bodyInput: { height: 200 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  btn: { flex: 1, borderRadius: 6, paddingVertical: 14, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});
