import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  useColorScheme,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useSocialAuth } from "@/hooks/useSocialAuth";

const LoginScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const colorScheme = useColorScheme();

  const { handleGoogle, handleFacebook, handleApple, googleLoading, facebookLoading, appleLoading } =
    useSocialAuth((token) => {
      login(token);
      router.replace("/(tabs)");
    });

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Invalid credentials");
      }
      const { token } = await res.json();
      login(token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    Keyboard.dismiss();
    setGuestLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/guest-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Guest login failed");
      }
      const { token } = await res.json();
      await login(token);
      router.replace("/(tabs)");
      setTimeout(() => {
        Alert.alert(
          "Welcome Guest!",
          "You're browsing as a guest. Create an account anytime for full access.",
          [{ text: "Got it" }],
        );
      }, 1000);
    } catch (err: any) {
      Alert.alert("Guest Login Error", err.message || "Something went wrong");
    } finally {
      setGuestLoading(false);
    }
  };

  const isAnyLoading = loading || guestLoading || googleLoading || facebookLoading || appleLoading;

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
          {/* ── Wordmark ── */}
          <View style={styles.wordmarkBlock}>
            <Text style={[styles.wordmark, { color: colors.text }]}>LOCAL BRANDS</Text>
            <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
            <Text style={[styles.wordmarkSub, { color: colors.textTertiary }]}>EST · MMXXVI</Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SIGN IN</Text>

          {/* ── Email field (underline) ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>EMAIL</Text>
            <View style={[styles.underlineField, { borderBottomColor: colors.text }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="hello@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAnyLoading}
              />
            </View>
          </View>

          {/* ── Password field (underline) ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>PASSWORD</Text>
            <View style={[styles.underlineField, { borderBottomColor: colors.text }]}>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isAnyLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={[styles.showHide, { color: colors.textTertiary }]}>
                  {showPassword ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Forgot */}
          <Pressable
            onPress={() => !isAnyLoading && router.push("/auth/forgot-password")}
            disabled={isAnyLoading}
            style={styles.forgotRow}
          >
            <Text style={[styles.forgotText, { color: colors.text }]}>FORGOT PASSWORD ?</Text>
          </Pressable>

          {/* SIGN IN button */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.text }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isAnyLoading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>SIGN IN</Text>
            )}
          </Pressable>

          {/* CONTINUE AS GUEST */}
          <Pressable
            style={[styles.outlineButton, { borderColor: colors.border }, guestLoading && { opacity: 0.7 }]}
            onPress={handleGuestLogin}
            disabled={isAnyLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.outlineButtonText, { color: colors.text }]}>CONTINUE AS GUEST</Text>
            )}
          </Pressable>

          {/* ── OR divider ── */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Social buttons (side by side) ── */}
          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, { borderColor: colors.text }, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogle}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={14} color="#DB4437" />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>GOOGLE</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.socialButton, { borderColor: colors.text }, facebookLoading && { opacity: 0.7 }]}
              onPress={handleFacebook}
              disabled={isAnyLoading}
            >
              {facebookLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>FACEBOOK</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Apple Sign-In — iOS only */}
          {Platform.OS === "ios" && (
            <View style={styles.appleButtonWrapper} pointerEvents={appleLoading ? "none" : "auto"}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  colorScheme === "dark"
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={0}
                style={[styles.appleButton, appleLoading && { opacity: 0.6 }]}
                onPress={handleApple}
              />
              {appleLoading && (
                <ActivityIndicator
                  color={colorScheme === "dark" ? "#000" : "#fff"}
                  style={styles.appleSpinner}
                />
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              NEW TO LOCAL BRANDS ?{"  "}
            </Text>
            <Pressable onPress={() => !isAnyLoading && router.push("/auth/register")} disabled={isAnyLoading}>
              <Text style={[styles.footerLink, { color: colors.text }]}>REGISTER</Text>
            </Pressable>
          </View>
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
    paddingTop: 70,
    paddingBottom: 40,
  },

  // ── Wordmark ──────────────────────────────
  wordmarkBlock: {
    alignItems: "center",
    marginBottom: 64,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 30,
  },
  wordmarkDivider: {
    width: 28,
    height: 1,
    marginTop: 12,
    marginBottom: 14,
  },
  wordmarkSub: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 24,
  },

  // ── Fields (underline style) ──────────────
  fieldGroup: { width: "100%", marginBottom: 24 },
  label: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    display: "none",
  },
  underlineField: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  input: { flex: 1, fontSize: 14, fontWeight: "500", paddingVertical: 0 },
  eyeBtn: { paddingLeft: 8 },
  showHide: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Forgot ────────────────────────────────
  forgotRow: { alignItems: "flex-end", marginBottom: 28, marginTop: -10 },
  forgotText: { fontSize: 9, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── Primary button ────────────────────────
  button: {
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── Outline button ────────────────────────
  outlineButton: {
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 28,
  },
  outlineButtonText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── OR divider ────────────────────────────
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 22,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 9, letterSpacing: 2.5, fontWeight: "500" },

  // ── Social buttons (side by side) ─────────
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socialButtonText: { fontSize: 10, fontWeight: "600", letterSpacing: 2 },

  // ── Apple ─────────────────────────────────
  appleButtonWrapper: { position: "relative", width: "100%", marginTop: 10 },
  appleButton: { width: "100%", height: 50, marginBottom: 12 },
  appleSpinner: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 30,
  },
  footerText: { fontSize: 10, fontWeight: "500", letterSpacing: 1 },
  footerLink: { fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
});

export default LoginScreen;
