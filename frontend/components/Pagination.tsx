import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, currentPage === 1 && styles.disabledButton]}
                onPress={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#94a3b8" : "#1e293b"} />
                <Text style={[styles.buttonText, currentPage === 1 && styles.disabledText]}>Prev</Text>
            </TouchableOpacity>

            <View style={styles.pageInfo}>
                <Text style={styles.pageText}>
                    Page <Text style={styles.boldText}>{currentPage}</Text> of <Text style={styles.boldText}>{totalPages}</Text>
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, currentPage === totalPages && styles.disabledButton]}
                onPress={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <Text style={[styles.buttonText, currentPage === totalPages && styles.disabledText]}>Next</Text>
                <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#94a3b8" : "#1e293b"} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        // Shadow for premium feel
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
    },
    disabledButton: {
        backgroundColor: "#f1f5f9",
    },
    buttonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginHorizontal: 4,
    },
    disabledText: {
        color: "#94a3b8",
    },
    pageInfo: {
        flex: 1,
        alignItems: "center",
    },
    pageText: {
        fontSize: 14,
        color: "#64748b",
    },
    boldText: {
        fontWeight: "700",
        color: "#1e293b",
    },
});

export default Pagination;
