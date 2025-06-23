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
} from "react-native"; // Added Keyboard import
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/app/_layout";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";

const LoginScreen = () => {
  const { login } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err: any) {
      console.error("Login failed:", err);
      Alert.alert("Login Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled" // Add this prop
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
              editable={!loading}
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
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Pressable
              onPress={() => !loading && navigation.navigate("Register")}
              disabled={loading}
            >
              <Text style={[styles.link, loading && styles.linkDisabled]}>
                Register
              </Text>
            </Pressable>
            <Pressable
              onPress={() => !loading && navigation.navigate("ForgotPassword")}
              disabled={loading}
            >
              <Text style={[styles.link, loading && styles.linkDisabled]}>
                Forgot Password?
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  link: { color: "#346beb", fontSize: 14 },
  linkDisabled: {
    color: "#a0a0a0",
  },
});

export default LoginScreen;
