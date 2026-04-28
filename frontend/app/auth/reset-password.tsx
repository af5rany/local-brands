import React, { useState, useMemo } from "react";
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
  Image,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import Header from "@/components/Header";

type Status = "idle" | "loading" | "success" | "error";

const ResetPasswordScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      setErrorMessage("Invalid or missing reset token.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setStatus("error");
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setErrorMessage("Password must be at least 6 characters.");
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
        setErrorMessage(data.message || "Failed to reset password.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
          <Header />
        </SafeAreaView>
        <View style={styles.centeredContainer}>
          <Image
            source={require("@/assets/images/local-sooq.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceRaised }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.text} />
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.subtitle}>
            Your password has been updated. You can now log in with your new
            password.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.buttonText}>Continue to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <Image
            source={require("@/assets/images/local-sooq.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>

          {/* Error banner */}
          {status === "error" && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* New password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(t) => {
                  setNewPassword(t);
                  if (status === "error") setStatus("idle");
                }}
                editable={status !== "loading"}
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable onPress={() => setShowNew((p) => !p)} style={styles.eyeBtn}>
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (status === "error") setStatus("idle");
                }}
                editable={status !== "loading"}
                placeholderTextColor={colors.textTertiary}
              />
              <Pressable
                onPress={() => setShowConfirm((p) => !p)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.button, status === "loading" && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Centered (success) layout
  centeredContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // Form layout
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  logo: { width: 140, height: 80, marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    gap: 8,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 14 },

  // Inputs
  inputContainer: { width: "100%", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: colors.textSecondary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: colors.text, height: "100%" },
  eyeBtn: { padding: 4 },

  // Button
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 0,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { backgroundColor: colors.textTertiary },
  buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: "600" },
});

export default ResetPasswordScreen;
