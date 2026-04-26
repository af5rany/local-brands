import React, { useState } from "react";
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

export default function CreateEmailCampaignScreen() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (sendNow = false) => {
    if (!subject.trim()) return Alert.alert("Error", "Subject is required");
    if (!body.trim()) return Alert.alert("Error", "Body is required");
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, previewText }),
      });
      if (!res.ok) throw new Error("Failed");
      const campaign = await res.json();

      if (sendNow) {
        await fetch(`${getApiUrl()}/brands/${brandId}/email-campaigns/${campaign.id}/send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert("Sent", "Campaign is being delivered to followers");
      } else {
        Alert.alert("Saved", "Campaign saved as draft");
      }
      router.back();
    } catch {
      Alert.alert("Error", "Could not save campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>NEW CAMPAIGN</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>SUBJECT LINE</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={subject} onChangeText={setSubject}
          placeholder="Your subject line..."
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>PREVIEW TEXT (optional)</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={previewText} onChangeText={setPreviewText}
          placeholder="Preview shown in inbox..."
          placeholderTextColor={colors.textTertiary}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL BODY (HTML or plain text)</Text>
        <TextInput
          style={[styles.input, styles.bodyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={body} onChangeText={setBody}
          multiline
          placeholder={"<h1>Hello!</h1>\n<p>Check out our latest collection...</p>"}
          placeholderTextColor={colors.textTertiary}
          textAlignVertical="top"
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            onPress={() => save(false)}
            disabled={saving}
            style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Text style={[styles.btnText, { color: colors.text }]}>SAVE DRAFT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => save(true)}
            disabled={saving}
            style={[styles.btn, { backgroundColor: colors.text }]}
          >
            {saving ? <ActivityIndicator color={colors.background} /> : (
              <Text style={[styles.btnText, { color: colors.background }]}>SEND NOW</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: 2, marginBottom: 24 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  bodyInput: { height: 200 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  btn: { flex: 1, borderRadius: 6, paddingVertical: 14, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
});
