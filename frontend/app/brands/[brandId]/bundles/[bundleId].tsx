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

export default function EditBundleScreen() {
  const { brandId, bundleId } = useLocalSearchParams<{ brandId: string; bundleId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minQuantity, setMinQuantity] = useState("2");
  const [productIdsRaw, setProductIdsRaw] = useState("");

  useEffect(() => {
    fetch(`${getApiUrl()}/brands/${brandId}/bundles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((list: any[]) => {
        const b = list.find((b) => String(b.id) === bundleId);
        if (b) {
          setName(b.name);
          setDescription(b.description || "");
          setDiscountType(b.discountType);
          setDiscountValue(String(b.discountValue));
          setMinQuantity(String(b.minQuantity));
          setProductIdsRaw((b.productIds || []).join(", "));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId, bundleId, token]);

  const save = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name is required");
    const productIds = productIdsRaw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    setSaving(true);
    try {
      await fetch(`${getApiUrl()}/brands/${brandId}/bundles/${bundleId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, discountType,
          discountValue: Number(discountValue),
          minQuantity: parseInt(minQuantity, 10) || 2,
          productIds,
        }),
      });
      router.back();
    } catch {
      Alert.alert("Error", "Could not update bundle");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>EDIT BUNDLE</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={name} onChangeText={setName} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPTION</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={description} onChangeText={setDescription} placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>DISCOUNT TYPE</Text>
        <View style={styles.typeRow}>
          {(["percentage", "fixed"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setDiscountType(t)}
              style={[styles.typeBtn, { borderColor: colors.border, backgroundColor: discountType === t ? colors.text : colors.surface }]}>
              <Text style={{ color: discountType === t ? colors.background : colors.text, fontSize: 12, fontWeight: "600" }}>
                {t === "percentage" ? "% Off" : "$ Off"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>DISCOUNT VALUE</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>MIN QUANTITY</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={minQuantity} onChangeText={setMinQuantity} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>PRODUCT IDs</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={productIdsRaw} onChangeText={setProductIdsRaw} placeholderTextColor={colors.textTertiary} />

        <TouchableOpacity onPress={save} disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.text }]}>
          {saving ? <ActivityIndicator color={colors.background} /> : (
            <Text style={[styles.saveBtnText, { color: colors.background }]}>UPDATE BUNDLE</Text>
          )}
        </TouchableOpacity>
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
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1, borderRadius: 6, paddingVertical: 10, alignItems: "center" },
  saveBtn: { borderRadius: 6, paddingVertical: 14, alignItems: "center", marginTop: 32 },
  saveBtnText: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
});
