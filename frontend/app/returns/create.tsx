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

const REASONS = [
  { value: "defective", label: "DEFECTIVE / DAMAGED" },
  { value: "wrong_item", label: "WRONG ITEM RECEIVED" },
  { value: "not_as_described", label: "NOT AS DESCRIBED" },
  { value: "changed_mind", label: "CHANGED MY MIND" },
  { value: "size_fit", label: "SIZE / FIT ISSUE" },
  { value: "damaged_in_shipping", label: "DAMAGED IN SHIPPING" },
  { value: "other", label: "OTHER" },
];

const CreateReturnScreen = () => {
  const { orderId, brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [order, setOrder] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token || !orderId) return;
      try {
        const res = await fetch(`${getApiUrl()}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setOrder(await res.json());
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [token, orderId]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Missing", "Please select a reason for the return.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/returns`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: parseInt(orderId as string),
          brandId: brandId ? parseInt(brandId as string) : undefined,
          reason: selectedReason,
          description: description || undefined,
        }),
      });
      if (res.ok) {
        Alert.alert("Return Submitted", "Your return request has been submitted. We'll review it shortly.", [
          { text: "OK", onPress: () => router.replace("/returns" as any) },
        ]);
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Failed to submit return");
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
        <Text style={[styles.title, { color: colors.text }]}>REQUEST RETURN</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {order && (
          <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.orderLabel, { color: colors.textTertiary }]}>ORDER</Text>
            <Text style={[styles.orderNumber, { color: colors.text }]}>{order.orderNumber}</Text>
            <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>REASON FOR RETURN</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.reasonBtn,
                { borderColor: colors.border },
                selectedReason === r.value && { backgroundColor: colors.text, borderColor: colors.text },
              ]}
              onPress={() => setSelectedReason(r.value)}
            >
              <Text style={[
                styles.reasonText,
                { color: selectedReason === r.value ? colors.background : colors.text },
              ]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ADDITIONAL DETAILS — OPTIONAL</Text>
          <TextInput
            style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in more detail..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.text }, saving && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.submitBtnText, { color: colors.background }]}>SUBMIT RETURN REQUEST</Text>
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
  title: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "800" },
  content: { padding: 16 },
  orderCard: { borderWidth: 1, padding: 16, marginBottom: 24 },
  orderLabel: { fontSize: 10, fontWeight: "700", marginBottom: 4 },
  orderNumber: { fontSize: 16, fontWeight: "800" },
  orderDate: { fontSize: 11, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "800", marginBottom: 12 },
  reasonBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  reasonText: { fontSize: 12, fontWeight: "600" },
  textarea: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    height: 120,
    textAlignVertical: "top",
  },
  submitBtn: { paddingVertical: 18, alignItems: "center" },
  submitBtnText: { fontSize: 13, fontWeight: "800" },
});

export default CreateReturnScreen;
