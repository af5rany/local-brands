import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const HomeScreen = () => {
  const router = useRouter();
  const { token, loading } = useAuth();

  // Check auth state and redirect if no token
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth/login");
    }
  }, [token, loading]);

  if (loading || !token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const navigateToBrandsList = () => {
    router.push("/brands");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Home Screen</Text>
        <Pressable style={styles.button} onPress={navigateToBrandsList}>
          <Text style={styles.buttonText}>View Brands</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#346beb",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 8,
    marginTop: 10,
    elevation: 2,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
});

export default HomeScreen;
