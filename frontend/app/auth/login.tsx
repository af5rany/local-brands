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
  Image,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import Header from "@/components/Header";

const LoginScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      login(token);
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

  const isAnyLoading = loading || guestLoading;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("@/assets/images/local-sooq.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Sign in to continue
          </Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAnyLoading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isAnyLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password (inline) */}
          <Pressable
            onPress={() =>
              !isAnyLoading && router.push("/auth/forgot-password")
            }
            disabled={isAnyLoading}
            style={styles.forgotRow}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </Pressable>

          {/* Login Button */}
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isAnyLoading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Guest Login */}
          <Pressable
            style={[
              styles.guestButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              guestLoading && { opacity: 0.7 },
            ]}
            onPress={handleGuestLogin}
            disabled={isAnyLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.guestButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Continue as Guest
                </Text>
              </>
            )}
          </Pressable>

          {/* Social Auth Divider */}
          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
              Or continue with
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Social Auth Buttons */}
          <Pressable
            style={[
              styles.socialButton,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              Alert.alert("Coming Soon", "Google sign-in coming soon")
            }
            disabled={isAnyLoading}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color="#DB4437"
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.socialButton,
              {
                backgroundColor: "#1877F2",
                borderColor: "#1877F2",
              },
            ]}
            onPress={() =>
              Alert.alert("Coming Soon", "Facebook sign-in coming soon")
            }
            disabled={isAnyLoading}
          >
            <Ionicons
              name="logo-facebook"
              size={20}
              color="#ffffff"
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: "#ffffff" }]}>
              Continue with Facebook
            </Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Don't have an account?
            </Text>
            <Pressable
              onPress={() => !isAnyLoading && router.push("/auth/register")}
              disabled={isAnyLoading}
            >
              <Text
                style={[
                  styles.footerLink,
                  { color: colors.primary },
                  isAnyLoading && { color: colors.textTertiary },
                ]}
              >
                {" "}
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: "center" },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 120, height: 70, marginBottom: 28 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 15, marginBottom: 36, fontWeight: "500" },

  // ── Fields ────────────────────────────────
  fieldGroup: { width: "100%", marginBottom: 18, gap: 7 },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: "500", height: "100%" },
  eyeBtn: { padding: 4 },

  // ── Forgot ────────────────────────────────
  forgotRow: { width: "100%", alignItems: "flex-end", marginBottom: 4 },
  forgotText: { fontSize: 13, fontWeight: "600" },

  // ── Buttons ───────────────────────────────
  button: {
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 13, fontWeight: "500" },
  guestButton: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  guestButtonText: { fontSize: 15, fontWeight: "600" },

  // ── Social Auth ────────────────────────────
  socialButton: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  socialIcon: {
    position: "absolute",
    left: 16,
  },
  socialButtonText: { fontSize: 15, fontWeight: "600" },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 28,
  },
  footerText: { fontSize: 14, fontWeight: "500" },
  footerLink: { fontSize: 14, fontWeight: "700" },
});

export default LoginScreen;
