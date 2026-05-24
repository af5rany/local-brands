import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";

type Status = "idle" | "loading" | "success" | "error";

const ResetPasswordScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReset = async () => {
    Keyboard.dismiss();

    if (!token) {
      setStatus("error");
      setErrorMessage("INVALID OR MISSING RESET TOKEN.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setErrorMessage("PLEASE FILL IN ALL FIELDS.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("PASSWORDS DO NOT MATCH.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setErrorMessage("PASSWORD MUST BE AT LEAST 6 CHARACTERS.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage((data.message || "Failed to reset password.").toUpperCase());
      }
    } catch {
      setStatus("error");
      setErrorMessage("SOMETHING WENT WRONG. PLEASE TRY AGAIN.");
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <View style={styles.successContainer}>
          <View style={[styles.checkMark, { borderColor: colors.text }]}>
            <Text style={[styles.checkMarkText, { color: colors.text }]}>✓</Text>
          </View>
          <Text style={[styles.wordmark, { color: colors.text }]}>PASSWORD RESET</Text>
          <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>
            YOUR PASSWORD HAS BEEN UPDATED. YOU CAN NOW SIGN IN WITH YOUR NEW PASSWORD.
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.text }]}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>CONTINUE TO SIGN IN</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back nav ── */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            disabled={status === "loading"}
          >
            <Text style={[styles.backText, { color: colors.textTertiary }]}>← BACK</Text>
          </Pressable>

          {/* ── Wordmark ── */}
          <View style={styles.wordmarkBlock}>
            <Text style={[styles.wordmark, { color: colors.text }]}>LOCAL BRANDS</Text>
            <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
            <Text style={[styles.wordmarkSub, { color: colors.textTertiary }]}>EST · MMXXVI</Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>NEW PASSWORD</Text>

          {/* Error banner */}
          {status === "error" && (
            <View style={[styles.errorBanner, { borderColor: colors.accentRed }]}>
              <Text style={[styles.errorText, { color: colors.accentRed }]}>{errorMessage}</Text>
            </View>
          )}

          {/* New password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>NEW PASSWORD</Text>
            <View style={[styles.underlineField, { borderBottomColor: colors.text }]}>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (status === "error") setStatus("idle");
                }}
                editable={status !== "loading"}
              />
              <Pressable onPress={() => setShowNew((p) => !p)} style={styles.eyeBtn}>
                <Text style={[styles.showHide, { color: colors.textTertiary }]}>
                  {showNew ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>CONFIRM PASSWORD</Text>
            <View style={[styles.underlineField, { borderBottomColor: colors.text }]}>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (status === "error") setStatus("idle");
                }}
                editable={status !== "loading"}
              />
              <Pressable onPress={() => setShowConfirm((p) => !p)} style={styles.eyeBtn}>
                <Text style={[styles.showHide, { color: colors.textTertiary }]}>
                  {showConfirm ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.text }, status === "loading" && { opacity: 0.7 }]}
            onPress={handleReset}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>RESET PASSWORD</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
  },

  backRow: { marginBottom: 32 },
  backText: { fontSize: 9, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  wordmarkBlock: { alignItems: "center", marginBottom: 48 },
  wordmark: { fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 30 },
  wordmarkDivider: { width: 28, height: 1, marginTop: 12, marginBottom: 14 },
  wordmarkSub: { fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: "500" },

  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 28,
  },

  errorBanner: {
    borderWidth: 1,
    borderLeftWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
    width: "100%",
  },
  errorText: { fontSize: 9, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase" },

  fieldGroup: { width: "100%", marginBottom: 24 },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  underlineField: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  input: { fontSize: 14, fontWeight: "500", paddingVertical: 0 },
  eyeBtn: { paddingLeft: 8 },
  showHide: { fontSize: 9, fontWeight: "500", letterSpacing: 2, textTransform: "uppercase" },

  button: {
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── Success ────────────────────────────────
  successContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 40,
    alignItems: "center",
  },
  checkMark: {
    width: 72,
    height: 72,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  checkMarkText: { fontSize: 32, fontWeight: "900" },
  successSub: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "500",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
});

export default ResetPasswordScreen;
