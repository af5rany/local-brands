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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const ReturnPolicyScreen = () => {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [returnWindowDays, setReturnWindowDays] = useState("30");
  const [conditions, setConditions] = useState("");
  const [requiresImages, setRequiresImages] = useState(false);
  const [restockingFeePercent, setRestockingFeePercent] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token || !brandId) return;
      try {
        const res = await fetch(`${getApiUrl()}/brands/${brandId}/return-policy`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReturnWindowDays(String(data.returnWindowDays ?? 30));
          setConditions(data.conditions || "");
          setRequiresImages(data.requiresImages ?? false);
          setRestockingFeePercent(String(data.restockingFeePercent ?? 0));
          setIsActive(data.isActive ?? true);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [token, brandId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/return-policy`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          returnWindowDays: parseInt(returnWindowDays) || 30,
          conditions: conditions || undefined,
          requiresImages,
          restockingFeePercent: parseFloat(restockingFeePercent) || 0,
          isActive,
        }),
      });
      if (res.ok) {
        Alert.alert("Saved", "Return policy updated.");
      } else {
        Alert.alert("Error", "Failed to save policy");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
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
        <Text style={[styles.title, { color: colors.text }]}>RETURN POLICY</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>RETURN WINDOW (DAYS)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={returnWindowDays}
            onChangeText={setReturnWindowDays}
            placeholder="30"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Customers can request returns within this many days of delivery.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>RESTOCKING FEE (%)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={restockingFeePercent}
            onChangeText={setRestockingFeePercent}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Percentage deducted from refund. 0 = no fee.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>CONDITIONS — OPTIONAL</Text>
          <TextInput
            style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.border }]}
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g. Items must be unused and in original packaging..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
          />
        </View>

        <View style={[styles.fieldGroup, styles.switchRow]}>
          <View>
            <Text style={[styles.label, { color: colors.textTertiary }]}>REQUIRE PHOTOS</Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>Customers must upload photos</Text>
          </View>
          <Switch value={requiresImages} onValueChange={setRequiresImages} />
        </View>

        <View style={[styles.fieldGroup, styles.switchRow]}>
          <View>
            <Text style={[styles.label, { color: colors.textTertiary }]}>ACCEPT RETURNS</Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>Disable to reject all returns</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.text }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.background }]}>SAVE POLICY</Text>
          )}
        </TouchableOpacity>

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
  content: { padding: 20 },
  fieldGroup: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: { height: 120, textAlignVertical: "top", paddingTop: 10 },
  hint: { fontSize: 10, marginTop: 6 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveBtn: { paddingVertical: 18, alignItems: "center" },
  saveBtnText: { fontSize: 13, fontWeight: "800" },
});

export default ReturnPolicyScreen;
