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
import { useRouter } from "expo-router";

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        Keyboard.dismiss();

        if (!email) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }

        setLoading(true);
        const url = `${getApiUrl()}/auth/forgot-password`;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const responseData = await res.json();

            if (res.ok) {
                Alert.alert(
                    "Success",
                    responseData.message,
                    [{ text: "OK", onPress: () => router.back() }]
                );
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1e293b" />
                    </Pressable>

                    <Image
                        source={require("@/assets/images/local-sooq.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRequestReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Link</Text>
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
    backButton: {
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 1,
        padding: 8,
    },
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

export default ForgotPasswordScreen;
