import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    View,
    Dimensions,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type: ToastType;
    onHide: () => void;
    duration?: number;
}

const { width } = Dimensions.get("window");

const Toast: React.FC<ToastProps> = ({ message, type, onHide, duration = 3000 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        const hideTimer = setTimeout(() => {
            hide();
        }, duration);

        return () => clearTimeout(hideTimer);
    }, []);

    const hide = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onHide());
    };

    const getBackgroundColor = () => {
        switch (type) {
            case "success":
                return "#10b981"; // Emerald-500
            case "error":
                return "#ef4444"; // Red-500
            case "info":
                return "#3b82f6"; // Blue-500
            default:
                return "#1e293b"; // Slate-800
        }
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return "checkmark-circle";
            case "error":
                return "alert-circle";
            case "info":
                return "information-circle";
            default:
                return "notifications";
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <View style={styles.content}>
                <Ionicons name={getIcon()} size={24} color="#fff" />
                <Text style={styles.message} numberOfLines={2}>
                    {message}
                </Text>
            </View>
            <Pressable onPress={hide} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    message: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 12,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
});

export default Toast;
