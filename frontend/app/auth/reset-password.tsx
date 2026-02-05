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
    Image,
    ActivityIndicator,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";

const ResetPasswordScreen = () => {
    const router = useRouter();
    const { token } = useLocalSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        Keyboard.dismiss();

        if (!token) {
            Alert.alert("Error", "Invalid or missing reset token");
            return;
        }

        if (!newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        const url = `${getApiUrl()}/auth/reset-password`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const responseData = await res.json();

            if (res.ok) {
                Alert.alert(
                    "Success",
                    "Your password has been reset successfully. Please login with your new password.",
                    [{ text: "Login", onPress: () => router.replace("/auth/login") }]
                );
            } else {
                throw new Error(responseData.message || "Failed to reset password");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong");
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
                    keyboardShouldPersistTaps="handled"
                >
                    <Image
                        source={require("@/assets/images/local-sooq.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter your new password below</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!loading}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!loading}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Reset Password</Text>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    container: { flex: 1 },
    scroll: { flexGrow: 1, padding: 24, justifyContent: "center", alignItems: "center" },
    logo: { width: 140, height: 80, marginBottom: 24 },
    title: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
    subtitle: { fontSize: 16, color: "#64748b", marginBottom: 32, textAlign: "center" },
    inputContainer: { width: "100%", marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "500", color: "#475569", marginBottom: 8 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#1e293b",
        height: "100%",
    },
    button: {
        backgroundColor: "#346beb",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#346beb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#94a3b8",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default ResetPasswordScreen;
