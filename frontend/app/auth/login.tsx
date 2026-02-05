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

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleLogin = async () => {
    // Dismiss the keyboard first
    Keyboard.dismiss();

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    const url = `${getApiUrl()}/auth/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Invalid credentials");
      }

      const responseData = await res.json();
      // console.log("Login response:", JSON.stringify(responseData, null, 2));
      const { token } = responseData;
      login(token);
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Login failed:", err);
      Alert.alert("Login Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // Dismiss the keyboard first
    Keyboard.dismiss();

    setGuestLoading(true);
    const url = `${getApiUrl()}/auth/guest-login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Guest login failed");
      }

      const responseData = await res.json();
      const { token } = responseData;

      // Store guest token and navigate
      login(token);
      router.replace("/(tabs)");

      // Optional: Show a welcome message for guests
      setTimeout(() => {
        Alert.alert(
          "Welcome Guest!",
          "You're browsing as a guest. Some features may be limited. You can create an account anytime to unlock full access.",
          [{ text: "Got it", style: "default" }]
        );
      }, 1000);
    } catch (err: any) {
      console.error("Guest login failed:", err);
      Alert.alert("Guest Login Error", err.message || "Something went wrong");
    } finally {
      setGuestLoading(false);
    }
  };

  const isAnyLoading = loading || guestLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isAnyLoading}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isAnyLoading}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isAnyLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Login Button */}
          <Pressable
            style={[styles.guestButton, guestLoading && styles.buttonDisabled]}
            onPress={handleGuestLogin}
            disabled={isAnyLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color="#346beb" />
            ) : (
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Pressable
              onPress={() => !isAnyLoading && router.push("/auth/forgot-password")}
              disabled={isAnyLoading}
            >
              <Text style={[styles.link, isAnyLoading && styles.linkDisabled]}>
                Forgot Password?
              </Text>
            </Pressable>
            <View style={styles.footerDivider} />
            <Pressable
              onPress={() => !isAnyLoading && router.push("/auth/register")}
              disabled={isAnyLoading}
            >
              <Text style={[styles.link, isAnyLoading && styles.linkDisabled]}>
                Register
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, justifyContent: "center" },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  logo: { width: 140, height: 80, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#64748b", marginBottom: 32 },
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
  },
  button: {
    backgroundColor: "#346beb",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#346beb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Divider styles
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },

  // Guest button styles
  guestButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guestButtonText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 24,
  },
  link: { color: "#346beb", fontSize: 14, fontWeight: "600" },
  linkDisabled: {
    color: "#94a3b8",
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },
});

export default LoginScreen;
