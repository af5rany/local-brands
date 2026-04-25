import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

const PREFS_CONFIG = [
  { key: "push", label: "PUSH NOTIFICATIONS", sub: "Receive alerts on your device" },
  { key: "email", label: "EMAIL NOTIFICATIONS", sub: "Receive updates via email" },
  { key: "orderUpdates", label: "ORDER UPDATES", sub: "Shipping, delivery, and status changes" },
  { key: "promotions", label: "PROMOTIONS & OFFERS", sub: "Promo codes and special deals" },
];

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const { token, user } = useAuth();
  const colors = useThemeColors();

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    push: true,
    email: true,
    orderUpdates: true,
    promotions: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((user as any)?.notificationPreferences) {
      setPrefs((prev) => ({ ...prev, ...(user as any).notificationPreferences }));
    }
  }, [user]);

  const handleToggle = (key: string, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/users/notification-preferences`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: prefs }),
      });
      if (res.ok) {
        Alert.alert("Saved", "Notification preferences updated.");
      } else {
        Alert.alert("Error", "Failed to save preferences");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>NOTIFICATIONS</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {PREFS_CONFIG.map((item) => (
          <View
            key={item.key}
            style={[styles.row, { borderBottomColor: colors.borderLight }]}
          >
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.rowSub, { color: colors.textTertiary }]}>{item.sub}</Text>
            </View>
            <Switch
              value={prefs[item.key] ?? true}
              onValueChange={(v) => handleToggle(item.key, v)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.text }, loading && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.background }]}>SAVE PREFERENCES</Text>
          )}
        </TouchableOpacity>
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
  title: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "800" },
  content: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  rowInfo: { flex: 1, marginRight: 16 },
  rowLabel: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  rowSub: { fontSize: 11 },
  saveBtn: { paddingVertical: 18, alignItems: "center", marginTop: 32 },
  saveBtnText: { fontSize: 13, fontWeight: "800" },
});

export default NotificationSettingsScreen;
