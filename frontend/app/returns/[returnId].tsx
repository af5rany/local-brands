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

const STATUS_STEPS = [
  { key: "requested", label: "SUBMITTED" },
  { key: "approved", label: "APPROVED" },
  { key: "shipped_back", label: "SHIPPED BACK" },
  { key: "received", label: "RECEIVED" },
  { key: "refunded", label: "REFUNDED" },
];

const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b",
  approved: "#3b82f6",
  rejected: "#ef4444",
  shipped_back: "#8b5cf6",
  received: "#06b6d4",
  refunded: "#22c55e",
};

const ReturnDetailScreen = () => {
  const { returnId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();

  const [returnRequest, setReturnRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token || !returnId) return;
      try {
        const res = await fetch(`${getApiUrl()}/returns/${returnId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setReturnRequest(await res.json());
      } catch {}
      finally {
        setLoading(false);
      }
    };
    load();
  }, [token, returnId]);

  const handleMarkShipped = async () => {
    setShipping(true);
    try {
      const res = await fetch(`${getApiUrl()}/returns/${returnId}/ship`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: trackingNumber || undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReturnRequest(updated);
        Alert.alert("Updated", "Return marked as shipped back.");
      }
    } catch {}
    finally {
      setShipping(false);
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

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === returnRequest.status);
  const isRejected = returnRequest.status === "rejected";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>RETURN #{returnRequest.id}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statusLabel, { color: STATUS_COLORS[returnRequest.status] || colors.text }]}>
            {returnRequest.status?.replace(/_/g, " ").toUpperCase()}
          </Text>
          {returnRequest.refundAmount && (
            <Text style={[styles.refundAmount, { color: colors.text }]}>
              REFUND: ${Number(returnRequest.refundAmount).toFixed(2)}
            </Text>
          )}
        </View>

        {/* Timeline */}
        {!isRejected && (
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentIdx;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={[styles.dot, { backgroundColor: done ? colors.text : colors.border }]} />
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.line, { backgroundColor: idx < currentIdx ? colors.text : colors.border }]} />
                  )}
                  <Text style={[styles.stepLabel, { color: done ? colors.text : colors.textTertiary }]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {isRejected && returnRequest.adminNotes && (
          <View style={[styles.notesCard, { backgroundColor: "#fef2f2", borderColor: "#ef4444" }]}>
            <Text style={[styles.notesLabel, { color: "#ef4444" }]}>REJECTION REASON</Text>
            <Text style={[styles.notesText, { color: "#7f1d1d" }]}>{returnRequest.adminNotes}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>REASON</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {returnRequest.reason?.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>

          {returnRequest.description && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>DESCRIPTION</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{returnRequest.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>SUBMITTED</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(returnRequest.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {returnRequest.returnTrackingNumber && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>YOUR TRACKING #</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{returnRequest.returnTrackingNumber}</Text>
            </View>
          )}
        </View>

        {/* Ship back action */}
        {returnRequest.status === "approved" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>SHIP IT BACK</Text>
            <Text style={[styles.infoText, { color: colors.textTertiary }]}>
              Please ship the item back to the brand. Enter your tracking number below.
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Tracking number (optional)"
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.text }, shipping && { opacity: 0.5 }]}
              onPress={handleMarkShipped}
              disabled={shipping}
            >
              {shipping ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.actionBtnText, { color: colors.background }]}>MARK AS SHIPPED BACK</Text>
              )}
            </TouchableOpacity>
          </View>
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
  statusCard: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  statusLabel: { fontSize: 18, fontWeight: "800" },
  refundAmount: { fontSize: 14, fontWeight: "700", marginTop: 8 },
  timeline: { flexDirection: "row", alignItems: "flex-start", marginBottom: 24, paddingHorizontal: 8 },
  timelineStep: { flex: 1, alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  line: { position: "absolute", top: 4, left: "50%", right: "-50%", height: 2 },
  stepLabel: { fontSize: 8, fontWeight: "700", textAlign: "center" },
  notesCard: { borderWidth: 1, padding: 16, marginBottom: 24 },
  notesLabel: { fontSize: 10, fontWeight: "800", marginBottom: 6 },
  notesText: { fontSize: 13 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "800", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, gap: 12 },
  detailLabel: { fontSize: 11, fontWeight: "600", flex: 1 },
  detailValue: { fontSize: 12, flex: 2, textAlign: "right" },
  infoText: { fontSize: 12, marginBottom: 12 },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  actionBtn: { paddingVertical: 16, alignItems: "center" },
  actionBtnText: { fontSize: 13, fontWeight: "800" },
});

export default ReturnDetailScreen;
