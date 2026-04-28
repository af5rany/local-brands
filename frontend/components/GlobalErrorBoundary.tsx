import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    router.replace("/(tabs)");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={80} color={Colors.light.accentRed} />
            </View>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              We encountered an unexpected error. Don't worry, your data is
              safe.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.message || "Unknown error occurred"}
              </Text>
            </View>

            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Back to Home</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const C = Colors.light;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: C.surfaceRaised,
    padding: 20,
    borderRadius: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: C.textSecondary,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  errorBox: {
    width: "100%",
    backgroundColor: C.surfaceRaised,
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 32,
  },
  errorText: {
    color: C.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  button: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 0,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: C.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GlobalErrorBoundary;
