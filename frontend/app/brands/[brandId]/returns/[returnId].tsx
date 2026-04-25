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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b",
  approved: "#3b82f6",
  rejected: "#ef4444",
  shipped_back: "#8b5cf6",
  received: "#06b6d4",
  refunded: "#22c55e",
};

const BrandReturnDetailScreen = () => {
  const { brandId, returnId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [returnRequest, setReturnRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !brandId || !returnId) return;
      try {
        const res = await fetch(`${getApiUrl()}/brands/${brandId}/returns/${returnId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setReturnRequest(await res.json());
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [token, brandId, returnId]);

  const doAction = async (action: string, body?: object) => {
    setActing(action);
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/returns/${returnId}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        const updated = await res.json();
        setReturnRequest(updated);
        Alert.alert("Updated", `Return status updated.`);
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message || "Action failed");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!returnRequest) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Return not found</Text>
      </View>
    );
  }

  const r = returnRequest;
  const statusColor = STATUS_COLORS[r.status] || colors.text;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>RETURN #{r.id}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {r.status?.replace(/_/g, " ").toUpperCase()}
          </Text>
          {r.refundAmount && (
            <Text style={[styles.refund, { color: colors.text }]}>
              REFUND: ${Number(r.refundAmount).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>CUSTOMER</Text>
          <Text style={[styles.detail, { color: colors.text }]}>{r.user?.name || "—"}</Text>
          <Text style={[styles.detailSub, { color: colors.textTertiary }]}>{r.user?.email || "—"}</Text>
        </View>

        {/* Return details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>RETURN DETAILS</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>REASON</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {r.reason?.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
          {r.description && (
            <View style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.descText, { color: colors.text }]}>{r.description}</Text>
            </View>
          )}
          {r.returnTrackingNumber && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>RETURN TRACKING</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{r.returnTrackingNumber}</Text>
            </View>
          )}
        </View>

        {/* Customer images */}
        {r.images?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CUSTOMER PHOTOS</Text>
            <View style={styles.imageRow}>
              {r.images.map((img: string, idx: number) => (
                <Image key={idx} source={{ uri: img }} style={styles.image} />
              ))}
            </View>
          </View>
        )}

        {/* Admin notes */}
        {r.adminNotes && (
          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.notesLabel, { color: colors.textTertiary }]}>YOUR NOTES</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{r.adminNotes}</Text>
          </View>
        )}

        {/* Actions */}
        {r.status === "requested" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ACTIONS</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (required for rejection)"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.approveBtn, { backgroundColor: "#22c55e" }, acting === "approve" && { opacity: 0.5 }]}
                onPress={() => doAction("approve", { notes })}
                disabled={!!acting}
              >
                {acting === "approve" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>APPROVE</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectBtn, { borderColor: "#ef4444" }, acting === "reject" && { opacity: 0.5 }]}
                onPress={() => {
                  if (!notes.trim()) { Alert.alert("Notes required", "Please add rejection reason."); return; }
                  doAction("reject", { notes });
                }}
                disabled={!!acting}
              >
                {acting === "reject" ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>REJECT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {r.status === "shipped_back" && (
          <TouchableOpacity
            style={[styles.fullBtn, { backgroundColor: "#06b6d4" }, acting === "received" && { opacity: 0.5 }]}
            onPress={() => doAction("received")}
            disabled={!!acting}
          >
            {acting === "received" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>MARK AS RECEIVED</Text>
            )}
          </TouchableOpacity>
        )}

        {r.status === "received" && (
          <TouchableOpacity
            style={[styles.fullBtn, { backgroundColor: colors.text }, acting === "refund" && { opacity: 0.5 }]}
            onPress={() =>
              Alert.alert("Process Refund", "This will restore stock and mark the return as refunded.", [
                { text: "Cancel" },
                { text: "Process", onPress: () => doAction("refund") },
              ])
            }
            disabled={!!acting}
          >
            {acting === "refund" ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.actionBtnText, { color: colors.background }]}>PROCESS REFUND & RESTORE STOCK</Text>
            )}
          </TouchableOpacity>
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
  statusBanner: {
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  statusText: { fontSize: 18, fontWeight: "800" },
  refund: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "800", marginBottom: 12 },
  detail: { fontSize: 15, fontWeight: "700" },
  detailSub: { fontSize: 12, marginTop: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  detailLabel: { fontSize: 11 },
  detailValue: { fontSize: 12, fontWeight: "600" },
  descCard: { borderWidth: 1, padding: 12, marginTop: 8 },
  descText: { fontSize: 13 },
  imageRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  image: { width: 80, height: 80 },
  notesCard: { borderWidth: 1, padding: 16, marginBottom: 24 },
  notesLabel: { fontSize: 10, fontWeight: "700", marginBottom: 6 },
  notesText: { fontSize: 13 },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  actionRow: { flexDirection: "row", gap: 12 },
  approveBtn: { flex: 1, paddingVertical: 14, alignItems: "center" },
  rejectBtn: { flex: 1, borderWidth: 2, paddingVertical: 14, alignItems: "center" },
  fullBtn: { paddingVertical: 16, alignItems: "center", marginBottom: 12 },
  actionBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },
});

export default BrandReturnDetailScreen;
