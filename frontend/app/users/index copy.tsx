import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

type User = {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string;
};

const UsersScreen = () => {
    const router = useRouter();
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const cardBackground = useThemeColor(
        { light: "#ffffff", dark: "#1c1c1e" },
        "background"
    );
    // const borderColor = useThemeColor(
    //   { light: "#e1e5e9", dark: "#38383a" },
    //   "text"
    // );

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                Alert.alert("Error", "Failed to fetch users");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "An error occurred while fetching users");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = (userId: number) => {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this user? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${getApiUrl()}/users/${userId}`, {
                                method: "DELETE",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            if (response.ok) {
                                Alert.alert("Success", "User deleted successfully");
                                fetchUsers();
                            } else {
                                Alert.alert("Error", "Failed to delete user");
                            }
                        } catch (error) {
                            console.error("Error deleting user:", error);
                            Alert.alert("Error", "An error occurred while deleting user");
                        }
                    },
                },
            ]
        );
    };

    const filteredUsers = users.filter((user) => {
        const nameMatch = user.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || emailMatch;
    });

    const renderItem = ({ item }: { item: User }) => (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                    </Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: textColor }]}>
                        {item.name || "No Name"}
                    </Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.roleContainer}>
                        <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                </View>
            </View>

            {/* Don't allow deleting yourself */}
            {currentUser?.userId !== item.id && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textColor }]}>User Management</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { backgroundColor: cardBackground, color: textColor }]}
                    placeholder="Search users..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchUsers();
                    }}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: textColor }}>No users found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        // borderBottomWidth: 1,
        // borderBottomColor: "#e5e7eb",
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 10,
        position: 'relative',
        justifyContent: 'center'
    },
    searchIcon: {
        position: 'absolute',
        left: 28,
        zIndex: 1,
    },
    searchInput: {
        paddingVertical: 12,
        paddingLeft: 40,
        paddingRight: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        padding: 16,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#e0e7ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#4f46e5",
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    roleContainer: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    roleText: {
        fontSize: 12,
        color: "#4b5563",
        textTransform: "capitalize",
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 40,
    },
});

export default UsersScreen;
