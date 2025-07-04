import React, { useState } from "react";
import {
  SafeAreaView,
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
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isAnyLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isAnyLoading}
            />
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
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, justifyContent: "center" },
  scroll: { padding: 20, alignItems: "center" },
  logo: { width: 120, height: 120, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "600", color: "#333", marginBottom: 20 },
  inputContainer: { width: "100%", marginBottom: 15 },
  label: { fontSize: 14, color: "#555", marginBottom: 5 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#346beb",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 8,
    marginTop: 10,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },

  // Divider styles
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666",
    fontSize: 14,
  },

  // Guest button styles
  guestButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#346beb",
    elevation: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    marginBottom: 10,
  },
  guestButtonText: {
    color: "#346beb",
    fontSize: 16,
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  link: { color: "#346beb", fontSize: 14 },
  linkDisabled: {
    color: "#a0a0a0",
  },
});

export default LoginScreen;
