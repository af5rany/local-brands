import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Button,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../_layout";

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Navigate to BrandsListScreen when button is clicked
  const navigateToBrandsList = () => {
    navigation.navigate("BrandsList");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Home Screen</Text>

        {/* Button that navigates to Brands List Screen */}
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
