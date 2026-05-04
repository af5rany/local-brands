import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function GuestBanner() {
  const { isGuest } = useAuth();
  const router = useRouter();

  if (!isGuest) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Shopping as guest. Create account to save your order.</Text>
      <Pressable onPress={() => router.push("/auth/register")} style={styles.cta}>
        <Text style={styles.ctaText}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF9C4",
    borderColor: "#F9A825",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: "#5D4037",
  },
  cta: {
    backgroundColor: "#F9A825",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
