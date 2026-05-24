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
} from "react-native";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    Keyboard.dismiss();
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const responseData = await res.json();
      if (res.ok) {
        Alert.alert("Success", responseData.message, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        throw new Error(responseData.message || "Failed to request password reset");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
          <Pressable onPress={() => router.back()} style={styles.backRow} disabled={loading}>
            <Text style={[styles.backText, { color: colors.textTertiary }]}>← BACK</Text>
          </Pressable>

          {/* ── Wordmark ── */}
          <View style={styles.wordmarkBlock}>
            <Text style={[styles.wordmark, { color: colors.text }]}>LOCAL BRANDS</Text>
            <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
            <Text style={[styles.wordmarkSub, { color: colors.textTertiary }]}>EST · MMXXVI</Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>RESET PASSWORD</Text>

          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            ENTER YOUR EMAIL AND WE'LL SEND A RESET LINK.
          </Text>

          {/* ── Email field ── */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>EMAIL</Text>
            <View style={[styles.underlineField, { borderBottomColor: colors.text }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="hello@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* ── Send button ── */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.text }, loading && { opacity: 0.7 }]}
            onPress={handleRequestReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>SEND RESET LINK</Text>
            )}
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              REMEMBERED IT ?{"  "}
            </Text>
            <Pressable onPress={() => !loading && router.push("/auth/login")} disabled={loading}>
              <Text style={[styles.footerLink, { color: colors.text }]}>SIGN IN</Text>
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
    marginBottom: 16,
  },

  instructions: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "500",
    lineHeight: 16,
    marginBottom: 32,
  },

  fieldGroup: { width: "100%", marginBottom: 32 },
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
  input: { flex: 1, fontSize: 14, fontWeight: "500", paddingVertical: 0 },

  button: {
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  buttonText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  footerText: { fontSize: 10, fontWeight: "500", letterSpacing: 1 },
  footerLink: { fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
});

export default ForgotPasswordScreen;
