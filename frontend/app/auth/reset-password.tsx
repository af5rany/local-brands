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
  Image,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import Header from "@/components/Header";

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
          <View style={[styles.iconCircle, { backgroundColor: "#d1fae5" }]}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
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
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
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
              <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
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
                color="#64748b"
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
                placeholderTextColor="#94a3b8"
              />
              <Pressable onPress={() => setShowNew((p) => !p)} style={styles.eyeBtn}>
                <Ionicons
                  name={showNew ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
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
                color="#64748b"
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
                placeholderTextColor="#94a3b8"
              />
              <Pressable
                onPress={() => setShowConfirm((p) => !p)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
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
    borderRadius: 44,
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
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    width: "100%",
    gap: 8,
  },
  errorText: { flex: 1, color: "#ef4444", fontSize: 14 },

  // Inputs
  inputContainer: { width: "100%", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#475569", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#1e293b", height: "100%" },
  eyeBtn: { padding: 4 },

  // Button
  button: {
    backgroundColor: "#346beb",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#346beb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: "#94a3b8", shadowOpacity: 0, elevation: 0 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default ResetPasswordScreen;
