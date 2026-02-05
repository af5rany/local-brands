import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Modal,
    ScrollView,
    RefreshControl,
    Alert,
    StatusBar,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { debounce } from "lodash";

import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/user";
import { Brand } from "@/types/brand";
import { UserRole, UserStatus, BrandRole } from "@/types/enums";
import { PaginatedResult } from "@/types/filters";

const UsersListScreen = () => {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [error, setError] = useState<string>("");

    // Modals
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [processing, setProcessing] = useState(false);

    const router = useRouter();

    // Theme colors
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const buttonColor = useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "tint");
    const cardBackground = useThemeColor({ light: "#ffffff", dark: "#1c1c1e" }, "background");
    const secondaryTextColor = useThemeColor({ light: "#666666", dark: "#999999" }, "text");
    const borderColor = useThemeColor({ light: "#E5E5EA", dark: "#38383A" }, "background");

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getApiUrl()}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch users");
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    const fetchBrands = useCallback(async () => {
        try {
            const response = await fetch(`${getApiUrl()}/brands?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data: PaginatedResult<Brand> = await response.json();
                setBrands(data.items);
            }
        } catch (err) {
            console.error("Error fetching brands:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchUsers();
        fetchBrands();
    }, [fetchUsers, fetchBrands]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const updateUserStatus = async (userId: number, status: UserStatus) => {
        try {
            setProcessing(true);
            const response = await fetch(`${getApiUrl()}/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) throw new Error("Failed to update user status");

            Alert.alert("Success", `User ${status} successfully`);
            fetchUsers();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setProcessing(false);
        }
    };

    const updateUserRole = async (userId: number, role: UserRole) => {
        try {
            setProcessing(true);
            const response = await fetch(`${getApiUrl()}/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            if (!response.ok) throw new Error("Failed to update user role");

            Alert.alert("Success", "User role updated successfully");
            fetchUsers();
            setShowRoleModal(false);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setProcessing(false);
        }
    };

    const assignBrandToUser = async (brandId: number, userId: number, role: BrandRole = BrandRole.OWNER) => {
        try {
            setProcessing(true);
            const response = await fetch(`${getApiUrl()}/brands/${brandId}/assign-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    role
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to assign brand");
            }

            const user = users.find(u => u.id === userId);
            if (user && user.role === UserRole.CUSTOMER) {
                await fetch(`${getApiUrl()}/users/${userId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role: UserRole.BRAND_OWNER, status: UserStatus.APPROVED }),
                });
            }

            Alert.alert("Success", "Brand assigned successfully");
            fetchUsers();
            setShowBrandModal(false);
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setProcessing(false);
        }
    };

    const removeUserFromBrand = async (brandId: number, userId: number) => {
        try {
            setProcessing(true);
            const response = await fetch(`${getApiUrl()}/brands/${brandId}/remove-user/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to remove user from brand");
            }

            Alert.alert("Success", "User removed from brand successfully");
            fetchUsers();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setProcessing(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            const matchesStatus = statusFilter === "all" || u.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return "#ef4444";
            case UserRole.BRAND_OWNER: return "#3b82f6";
            default: return "#10b981";
        }
    };

    const getStatusColor = (status: UserStatus) => {
        switch (status) {
            case UserStatus.APPROVED: return "#10b981";
            case UserStatus.PENDING: return "#f59e0b";
            case UserStatus.BLOCKED: return "#ef4444";
            default: return "#6b7280";
        }
    };

    const renderUser = ({ item }: { item: User }) => (
        <View style={[styles.userCard, { backgroundColor: cardBackground, borderColor }]}>
            <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                    <View style={styles.userNameContainer}>
                        <Text style={[styles.userName, { color: textColor }]}>{item.name}</Text>
                        {item.id === currentUser?.id && (
                            <View style={styles.youBadge}>
                                <Text style={styles.youText}>You</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + "20" }]}>
                        <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                            {item.role.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.userEmail, { color: secondaryTextColor }]}>{item.email}</Text>
                <View style={styles.userMetaContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                        <Text style={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: "600" }}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.userMeta, { color: secondaryTextColor, marginLeft: 8 }]}>
                        Joined: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {item.brandUsers && item.brandUsers.length > 0 && (
                    <View style={styles.assignedBrands}>
                        <Text style={[styles.smallLabel, { color: secondaryTextColor }]}>Assigned Brands:</Text>
                        <View style={styles.brandChipContainer}>
                            {item.brandUsers.map(bu => (
                                <View key={bu.id} style={[styles.brandChip, { backgroundColor: borderColor }]}>
                                    <Text style={[styles.brandChipText, { color: textColor }]}>
                                        {bu.brand?.name || `Brand #${bu.brandId}`} ({bu.role})
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert.alert(
                                                "Remove Brand",
                                                `Are you sure you want to remove ${item.name} from ${bu.brand?.name || `this brand`}?`,
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    {
                                                        text: "Remove",
                                                        onPress: () => removeUserFromBrand(bu.brandId, item.id),
                                                        style: "destructive"
                                                    }
                                                ]
                                            );
                                        }}
                                        style={styles.removeChipButton}
                                    >
                                        <Ionicons name="close-circle" size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, { borderColor }, item.id === currentUser?.id && styles.disabledAction]}
                    onPress={() => {
                        setSelectedUser(item);
                        setShowRoleModal(true);
                    }}
                    disabled={item.id === currentUser?.id}
                >
                    <Ionicons name="shield-outline" size={18} color={item.id === currentUser?.id ? secondaryTextColor : buttonColor} />
                    <Text style={[styles.actionText, { color: item.id === currentUser?.id ? secondaryTextColor : buttonColor }]}>Role</Text>
                </TouchableOpacity>

                {item.role === UserRole.BRAND_OWNER && (
                    <TouchableOpacity
                        style={[styles.actionButton, { borderColor }]}
                        onPress={() => {
                            setSelectedUser(item);
                            setShowBrandModal(true);
                        }}
                    >
                        <Ionicons name="business-outline" size={18} color={buttonColor} />
                        <Text style={[styles.actionText, { color: buttonColor }]}>Assign Brand</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, { borderColor }, item.id === currentUser?.id && styles.disabledAction]}
                    onPress={() => {
                        const newStatus = item.status === UserStatus.BLOCKED ? UserStatus.APPROVED : UserStatus.BLOCKED;
                        updateUserStatus(item.id, newStatus);
                    }}
                    disabled={processing || item.id === currentUser?.id}
                >
                    <Ionicons
                        name={item.status === UserStatus.BLOCKED ? "checkmark-circle-outline" : "ban-outline"}
                        size={18}
                        color={item.id === currentUser?.id ? secondaryTextColor : (item.status === UserStatus.BLOCKED ? "#10b981" : "#ef4444")}
                    />
                    <Text style={[
                        styles.actionText,
                        { color: item.id === currentUser?.id ? secondaryTextColor : (item.status === UserStatus.BLOCKED ? "#10b981" : "#ef4444") }
                    ]}>
                        {item.status === UserStatus.BLOCKED ? "Unblock" : "Block"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor }]}>
                <ActivityIndicator size="large" color={buttonColor} />
            </View>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textColor }]}>User Management</Text>
            </View>

            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: cardBackground, borderColor }]}>
                    <Ionicons name="search" size={20} color={secondaryTextColor} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Search users..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={secondaryTextColor}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
                    <Text style={[styles.filterLabel, { color: secondaryTextColor }]}>Roles:</Text>
                    {["all", ...Object.values(UserRole)].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.filterChip,
                                roleFilter === role && { backgroundColor: buttonColor, borderColor: buttonColor },
                                { borderColor }
                            ]}
                            onPress={() => setRoleFilter(role)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: roleFilter === role ? "#fff" : secondaryTextColor }
                            ]}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filters, { marginTop: 8 }]}>
                    <Text style={[styles.filterLabel, { color: secondaryTextColor }]}>Status:</Text>
                    {["all", ...Object.values(UserStatus)].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                statusFilter === status && { backgroundColor: buttonColor, borderColor: buttonColor },
                                { borderColor }
                            ]}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: statusFilter === status ? "#fff" : secondaryTextColor }
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color={secondaryTextColor} />
                        <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No users found</Text>
                    </View>
                }
            />

            <Modal visible={showRoleModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>Change Role</Text>
                        <Text style={[styles.modalSub, { color: secondaryTextColor }]}>
                            Set role for {selectedUser?.name}
                        </Text>
                        {Object.values(UserRole).map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[styles.modalOption, { borderBottomColor: borderColor }]}
                                onPress={() => updateUserRole(selectedUser!.id, role)}
                                disabled={processing}
                            >
                                <Text style={[styles.modalOptionText, { color: textColor }]}>
                                    {role.toUpperCase()}
                                </Text>
                                {selectedUser?.role === role && <Ionicons name="checkmark" size={20} color={buttonColor} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.closeModal}
                            onPress={() => setShowRoleModal(false)}
                        >
                            <Text style={{ color: "#ef4444", fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showBrandModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBackground, height: "70%" }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>Assign Brand</Text>
                        <Text style={[styles.modalSub, { color: secondaryTextColor }]}>
                            Assign a brand to {selectedUser?.name}
                        </Text>
                        <ScrollView style={{ flex: 1 }}>
                            {brands.map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={[styles.modalOption, { borderBottomColor: borderColor }]}
                                    onPress={() => assignBrandToUser(brand.id, selectedUser!.id)}
                                    disabled={processing}
                                >
                                    <View>
                                        <Text style={[styles.modalOptionText, { color: textColor }]}>{brand.name}</Text>
                                        <Text style={{ fontSize: 12, color: secondaryTextColor }}>
                                            Current Owners: {brand.brandUsers?.filter(bu => bu.role === BrandRole.OWNER).length || 0}
                                        </Text>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={24} color={buttonColor} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeModal}
                            onPress={() => setShowBrandModal(false)}
                        >
                            <Text style={{ color: "#ef4444", fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: { marginRight: 12 },
    title: { fontSize: 24, fontWeight: "bold" },
    searchSection: { padding: 16 },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    filterLabel: { fontSize: 13, fontWeight: "600", marginRight: 8, alignSelf: "center" },
    filters: { flexDirection: "row", marginBottom: 4 },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterText: { fontSize: 12, fontWeight: "500" },
    list: { padding: 16, paddingBottom: 40 },
    userCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    userInfo: { marginBottom: 12 },
    userHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    userNameContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
    userName: { fontSize: 18, fontWeight: "bold" },
    youBadge: {
        backgroundColor: "#007AFF20",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    youText: {
        color: "#007AFF",
        fontSize: 10,
        fontWeight: "bold",
    },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleText: { fontSize: 10, fontWeight: "bold" },
    userEmail: { fontSize: 14, marginBottom: 8 },
    userMetaContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    userMeta: { fontSize: 12 },
    assignedBrands: { marginTop: 8, padding: 8, backgroundColor: "rgba(0,0,0,0.02)", borderRadius: 8 },
    smallLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
    brandChipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
    brandChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4
    },
    brandChipText: { fontSize: 11, fontWeight: "500" },
    removeChipButton: {
        marginLeft: 2,
    },
    disabledAction: {
        opacity: 0.5,
    },
    actions: { flexDirection: "row", gap: 8 },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    actionText: { fontSize: 11, fontWeight: "600" },
    emptyState: { alignItems: "center", marginTop: 60 },
    emptyText: { marginTop: 12, fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
        maxHeight: "80%",
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
    modalSub: { fontSize: 14, marginBottom: 20 },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalOptionText: { fontSize: 16, fontWeight: "500" },
    closeModal: { marginTop: 24, alignItems: "center", paddingVertical: 12 },
});

export default UsersListScreen;
