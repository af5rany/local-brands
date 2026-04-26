import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";
import Header from "@/components/Header";

export default function SizeGuidesScreen() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { token } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();

  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("in");
  const [headersRaw, setHeadersRaw] = useState("Size, Chest, Waist, Hip");
  const [rowsRaw, setRowsRaw] = useState(
    "XS, 32, 26, 35\nS, 34, 28, 37\nM, 36, 30, 39\nL, 38, 32, 41\nXL, 40, 34, 43"
  );

  const fetchGuides = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/size-guides`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setGuides(await res.json());
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [brandId, token]);

  useEffect(() => { fetchGuides(); }, [fetchGuides]);

  const openCreate = () => {
    setEditing(null);
    setTitle(""); setDescription(""); setUnit("in");
    setHeadersRaw("Size, Chest, Waist, Hip");
    setRowsRaw("XS, 32, 26, 35\nS, 34, 28, 37\nM, 36, 30, 39\nL, 38, 32, 41\nXL, 40, 34, 43");
    setShowModal(true);
  };

  const openEdit = (guide: any) => {
    setEditing(guide);
    setTitle(guide.title);
    setDescription(guide.description || "");
    setUnit(guide.unit || "in");
    setHeadersRaw(guide.headers?.join(", ") || "");
    const rows = (guide.rows || []).map((r: any) => {
      const vals = (guide.headers || []).slice(1).map((h: string) => r.values?.[h] || "").join(", ");
      return `${r.label}, ${vals}`;
    }).join("\n");
    setRowsRaw(rows);
    setShowModal(true);
  };

  const buildPayload = () => {
    const headers = headersRaw.split(",").map((h) => h.trim()).filter(Boolean);
    const rows = rowsRaw.split("\n").filter((l) => l.trim()).map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const label = parts[0];
      const values: Record<string, string> = {};
      headers.slice(1).forEach((h, i) => { values[h] = parts[i + 1] || ""; });
      return { label, values };
    });
    return { title, description, unit, headers, rows };
  };

  const save = async () => {
    if (!title.trim()) return Alert.alert("Error", "Title is required");
    setSaving(true);
    try {
      const url = editing
        ? `${getApiUrl()}/brands/${brandId}/size-guides/${editing.id}`
        : `${getApiUrl()}/brands/${brandId}/size-guides`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error("Failed");
      setShowModal(false);
      fetchGuides();
    } catch {
      Alert.alert("Error", "Could not save size guide");
    } finally {
      setSaving(false);
    }
  };

  const deleteGuide = (guide: any) => {
    Alert.alert("Delete", `Delete "${guide.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await fetch(`${getApiUrl()}/brands/${brandId}/size-guides/${guide.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchGuides();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Header />
      <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>SIZE GUIDES</Text>
        <TouchableOpacity onPress={openCreate} style={[styles.addBtn, { backgroundColor: colors.text }]}>
          <Ionicons name="add" size={18} color={colors.background} />
          <Text style={[styles.addBtnText, { color: colors.background }]}>NEW</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {guides.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="resize-outline" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No size guides yet</Text>
              <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Create a size chart for your products</Text>
            </View>
          )}
          {guides.map((guide) => (
            <View key={guide.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{guide.title}</Text>
                  {guide.productId && <Text style={[styles.cardSub, { color: colors.textTertiary }]}>Product #{guide.productId}</Text>}
                  {!guide.productId && <Text style={[styles.cardSub, { color: colors.textTertiary }]}>Brand-wide guide</Text>}
                </View>
                <TouchableOpacity onPress={() => openEdit(guide)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteGuide(guide)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                {guide.rows?.length || 0} sizes · {guide.unit}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editing ? "EDIT SIZE GUIDE" : "NEW SIZE GUIDE"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.label, { color: colors.textSecondary }]}>TITLE</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={title} onChangeText={setTitle} placeholder="e.g. Tops Size Guide"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPTION (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={description} onChangeText={setDescription} placeholder="Measurement tips..."
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>UNIT</Text>
              <View style={styles.unitRow}>
                {["in", "cm"].map((u) => (
                  <TouchableOpacity key={u} onPress={() => setUnit(u)}
                    style={[styles.unitBtn, { borderColor: colors.border, backgroundColor: unit === u ? colors.text : colors.surface }]}>
                    <Text style={{ color: unit === u ? colors.background : colors.text, fontSize: 12, fontWeight: "600" }}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>COLUMNS (comma-separated)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={headersRaw} onChangeText={setHeadersRaw}
                placeholder="Size, Chest, Waist"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.label, { color: colors.textSecondary }]}>ROWS (one per line, values comma-separated)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={rowsRaw} onChangeText={setRowsRaw}
                multiline numberOfLines={6}
                placeholder={"XS, 32, 26\nS, 34, 28"}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity onPress={save} disabled={saving}
                style={[styles.saveBtn, { backgroundColor: colors.text }]}>
                {saving ? <ActivityIndicator color={colors.background} /> : (
                  <Text style={[styles.saveBtnText, { color: colors.background }]}>
                    {editing ? "UPDATE" : "CREATE"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 13, fontWeight: "700" },
  cardSub: { fontSize: 11, marginTop: 2 },
  cardMeta: { fontSize: 11 },
  iconBtn: { padding: 6, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  textArea: { height: 120, textAlignVertical: "top" },
  unitRow: { flexDirection: "row", gap: 8 },
  unitBtn: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtn: { borderRadius: 6, paddingVertical: 14, alignItems: "center", marginTop: 24, marginBottom: 8 },
  saveBtnText: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
});
