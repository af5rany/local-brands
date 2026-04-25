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

const SHIPPING_METHODS = [
  { value: "standard", label: "STANDARD" },
  { value: "express", label: "EXPRESS" },
  { value: "overnight", label: "OVERNIGHT" },
  { value: "local_pickup", label: "LOCAL PICKUP" },
];

const ZoneFormScreen = () => {
  const { brandId, zoneId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const isAddingRate = !!zoneId;

  // Zone form
  const [zoneName, setZoneName] = useState("");
  const [countriesInput, setCountriesInput] = useState("");

  // Rate form
  const [methodName, setMethodName] = useState("");
  const [method, setMethod] = useState("standard");
  const [price, setPrice] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");

  const [saving, setSaving] = useState(false);

  const handleCreateZone = async () => {
    if (!zoneName.trim() || !countriesInput.trim()) {
      Alert.alert("Missing Fields", "Zone name and at least one country are required.");
      return;
    }
    const countries = countriesInput.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/shipping/zones`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: zoneName.trim(), countries }),
      });
      if (res.ok) {
        router.back();
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Failed to create zone");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRate = async () => {
    if (!methodName.trim() || !price || !estimatedDays) {
      Alert.alert("Missing Fields", "Method name, price, and estimated days are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/shipping/zones/${zoneId}/rates`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          methodName: methodName.trim(),
          method,
          price: parseFloat(price),
          estimatedDays: parseInt(estimatedDays),
        }),
      });
      if (res.ok) {
        router.back();
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Failed to add rate");
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
        <Text style={[styles.title, { color: colors.text }]}>
          {isAddingRate ? "ADD SHIPPING RATE" : "CREATE SHIPPING ZONE"}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isAddingRate ? (
          <>
            <Text style={[styles.info, { color: colors.textTertiary }]}>
              Adding rate to zone #{zoneId}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>METHOD NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={methodName}
                onChangeText={setMethodName}
                placeholder="e.g. Standard Shipping"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>METHOD TYPE</Text>
              <View style={styles.methodGrid}>
                {SHIPPING_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.methodBtn,
                      { borderColor: colors.border },
                      method === m.value && { backgroundColor: colors.text, borderColor: colors.text },
                    ]}
                    onPress={() => setMethod(m.value)}
                  >
                    <Text style={[styles.methodBtnText, { color: method === m.value ? colors.background : colors.text }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textTertiary }]}>PRICE ($)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textTertiary }]}>EST. DAYS</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={estimatedDays}
                  onChangeText={setEstimatedDays}
                  placeholder="5"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.text }, saving && { opacity: 0.5 }]}
              onPress={handleAddRate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.saveBtnText, { color: colors.background }]}>ADD RATE</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>ZONE NAME</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={zoneName}
                onChangeText={setZoneName}
                placeholder="e.g. Domestic, Europe, Middle East"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>COUNTRIES (ISO codes, comma-separated)</Text>
              <TextInput
                style={[styles.input, styles.textarea, { color: colors.text, borderColor: colors.border }]}
                value={countriesInput}
                onChangeText={setCountriesInput}
                placeholder="US, CA, GB, AE, SA"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
                multiline
                numberOfLines={3}
              />
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Use 2-letter ISO country codes: US, CA, GB, DE, AE, SA, AU...
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.text }, saving && { opacity: 0.5 }]}
              onPress={handleCreateZone}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.saveBtnText, { color: colors.background }]}>CREATE ZONE</Text>
              )}
            </TouchableOpacity>
          </>
        )}

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
  info: { fontSize: 12, marginBottom: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  hint: { fontSize: 10, marginTop: 6 },
  row: { flexDirection: "row", gap: 12 },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  methodBtnText: { fontSize: 11, fontWeight: "700" },
  saveBtn: { paddingVertical: 18, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 13, fontWeight: "800" },
});

export default ZoneFormScreen;
