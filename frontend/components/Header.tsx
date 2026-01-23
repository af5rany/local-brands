import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Header = ({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <View style={[styles.header, isTablet && styles.headerTablet]}>
      <View>
        <Text style={[styles.greeting, isTablet && styles.greetingTablet]}>Welcome back,</Text>
        <Text style={[styles.userName, isTablet && styles.userNameTablet]}>{userName || "User"}</Text>
        <Text style={[styles.userRole, isTablet && styles.userRoleTablet]}>{userRole?.toUpperCase() || "USER"}</Text>
      </View>
      <View style={styles.headerIcons}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={isTablet ? 28 : 24} color="#333" />
        </Pressable>
        <Pressable style={styles.iconButton}>
          <Ionicons name="person-circle-outline" size={isTablet ? 32 : 28} color="#333" />
        </Pressable>
      </View>
    </View>
  );
};

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
  headerTablet: {
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  greeting: {
    fontSize: 16,
    color: "#64748b",
  },
  greetingTablet: {
    fontSize: 18,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 2,
  },
  userNameTablet: {
    fontSize: 32,
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
  userRoleTablet: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
  },
  iconButtonTablet: {
    marginLeft: 25,
  },
});

export default Header;
