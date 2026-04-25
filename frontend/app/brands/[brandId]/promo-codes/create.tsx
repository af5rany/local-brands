import React, { useState } from "react";
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

const CreatePromoCodeScreen = () => {
  const { brandId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const result = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setCode(result);
  };

  const handleSave = async () => {
    if (!code.trim() || !value || !expiryDate) {
      Alert.alert("Missing Fields", "Code, value, and expiry date are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/promo-codes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: parseFloat(value),
          minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
          maxUses: maxUses ? parseInt(maxUses) : undefined,
          maxUsesPerUser: parseInt(maxUsesPerUser) || 1,
          startDate: new Date(startDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
          description: description || undefined,
          isActive,
        }),
      });
      if (res.ok) {
        router.back();
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Failed to create promo code");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>CREATE PROMO CODE</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Code */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>CODE</Text>
          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput, { color: colors.text, borderColor: colors.border }]}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="e.g. SUMMER20"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[styles.genBtn, { borderColor: colors.border }]} onPress={generateCode}>
              <Text style={[styles.genBtnText, { color: colors.text }]}>GENERATE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Type */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>TYPE</Text>
          <View style={styles.typeRow}>
            {(["percentage", "fixed"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeBtn,
                  { borderColor: colors.border },
                  type === t && { backgroundColor: colors.text, borderColor: colors.text },
                ]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeBtnText, { color: type === t ? colors.background : colors.text }]}>
                  {t === "percentage" ? "% PERCENTAGE" : "$ FIXED AMOUNT"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Value */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            VALUE {type === "percentage" ? "(%)" : "($)"}
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={value}
            onChangeText={setValue}
            placeholder={type === "percentage" ? "e.g. 20" : "e.g. 15.00"}
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Min order */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>MIN ORDER AMOUNT ($) — OPTIONAL</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={minOrderAmount}
            onChangeText={setMinOrderAmount}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        {type === "percentage" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>MAX DISCOUNT CAP ($) — OPTIONAL</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={maxDiscountAmount}
              onChangeText={setMaxDiscountAmount}
              placeholder="e.g. 100"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
        )}

        {/* Usage limits */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>MAX TOTAL USES — OPTIONAL (blank = unlimited)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={maxUses}
            onChangeText={setMaxUses}
            placeholder="e.g. 100"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>MAX USES PER CUSTOMER</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={maxUsesPerUser}
            onChangeText={setMaxUsesPerUser}
            placeholder="1"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>

        {/* Dates */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>START DATE (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

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

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>DESCRIPTION — OPTIONAL</Text>
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

        {/* Active toggle */}
        <View style={[styles.fieldGroup, styles.switchRow]}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>ACTIVE</Text>
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
            <Text style={[styles.saveBtnText, { color: colors.background }]}>CREATE PROMO CODE</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40 },
  title: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "800" },
  content: { padding: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  codeRow: { flexDirection: "row", gap: 8 },
  codeInput: { flex: 1 },
  genBtn: { borderWidth: 1, paddingHorizontal: 12, justifyContent: "center" },
  genBtnText: { fontSize: 10, fontWeight: "700" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  typeBtnText: { fontSize: 11, fontWeight: "700" },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveBtn: {
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 13, fontWeight: "800" },
});

export default CreatePromoCodeScreen;
