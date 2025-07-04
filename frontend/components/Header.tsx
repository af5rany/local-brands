import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Header = ({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.greeting}>Welcome back,</Text>
      <Text style={styles.userName}>{userName || "User"}</Text>
      <Text style={styles.userRole}>{userRole?.toUpperCase() || "USER"}</Text>
    </View>
    <View style={styles.headerIcons}>
      <Pressable style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </Pressable>
      <Pressable style={styles.iconButton}>
        <Ionicons name="person-circle-outline" size={28} color="#333" />
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  greeting: {
    fontSize: 16,
    color: "#64748b",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#346beb",
    fontWeight: "600",
    marginTop: 2,
    backgroundColor: "#346beb20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
  },
});

export default Header;
