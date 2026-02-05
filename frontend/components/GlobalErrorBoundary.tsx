import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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
                            <Ionicons name="alert-circle" size={80} color="#ef4444" />
                        </View>
                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.subtitle}>
                            We encountered an unexpected error. Don't worry, your data is safe.
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    content: {
        flexGrow: 1,
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainer: {
        marginBottom: 24,
        backgroundColor: "#fee2e2",
        padding: 20,
        borderRadius: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        marginBottom: 32,
        textAlign: "center",
        lineHeight: 24,
    },
    errorBox: {
        width: "100%",
        backgroundColor: "#f1f5f9",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 32,
    },
    errorText: {
        color: "#475569",
        fontSize: 12,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    button: {
        backgroundColor: "#346beb",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default GlobalErrorBoundary;
