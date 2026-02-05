import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import * as ImageManipulator from "expo-image-manipulator";

const ProfileScreen = () => {
    const router = useRouter();
    const { user, logout, token, refreshUser } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [updating, setUpdating] = useState(false);
    const { uploads, uploadImage } = useCloudinaryUpload();

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace("/");
                    }
                }
            ]
        );
    };

    const handleImagePick = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Permission to access camera roll is required!");
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                const cloudUrl = await uploadImage(uri);
                if (cloudUrl) {
                    await updateProfile({ avatar: cloudUrl });
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
        }
    };



    const updateProfile = async (updateData: any) => {
        try {
            setUpdating(true);
            const response = await fetch(`${getApiUrl()}/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) throw new Error("Failed to update profile");

            await refreshUser();
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setUpdating(false);
        }
    };

    const InitialsAvatar = ({ name }: { name: string }) => {
        const initials = name
            ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
            : "U";

        return (
            <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{initials}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {uploads[Object.keys(uploads).reverse().find(k => !user?.avatar?.includes(k)) || ''] ? (
                            <View style={styles.avatarLoading}>
                                <ImageUploadProgress upload={uploads[Object.keys(uploads).reverse()[0]]} size={100} />
                            </View>
                        ) : user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <InitialsAvatar name={user?.name || user?.email} />
                        )}
                        <TouchableOpacity
                            style={styles.editAvatarButton}
                            onPress={handleImagePick}
                            disabled={Object.values(uploads).some(u => u.status === 'uploading')}
                        >
                            <Ionicons name="camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {isEditing ? (
                        <View style={styles.editNameContainer}>
                            <TextInput
                                style={styles.nameInput}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                autoFocus
                            />
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={[styles.smallButton, styles.cancelButton]}
                                    onPress={() => {
                                        setIsEditing(false);
                                        setName(user?.name || "");
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.smallButton, styles.saveButton]}
                                    onPress={() => updateProfile({ name })}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.name}>{user?.name || "User"}</Text>
                            <Text style={styles.email}>{user?.email || "No email provided"}</Text>
                        </>
                    )}

                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Customer"}
                        </Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => setIsEditing(true)}>
                        <View style={[styles.iconBox, { backgroundColor: "#e0f2fe" }]}>
                            <Ionicons name="person-outline" size={22} color="#0284c7" />
                        </View>
                        <Text style={styles.menuText}>Update Personal Details</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { }}>
                        <View style={[styles.iconBox, { backgroundColor: "#f0fdf4" }]}>
                            <Ionicons name="bag-handle-outline" size={22} color="#16a34a" />
                        </View>
                        <Text style={styles.menuText}>My Orders</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { }}>
                        <View style={[styles.iconBox, { backgroundColor: "#fff1f2" }]}>
                            <Ionicons name="heart-outline" size={22} color="#e11d48" />
                        </View>
                        <Text style={styles.menuText}>Wishlist</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/addresses')}>
                        <View style={[styles.iconBox, { backgroundColor: "#fefce8" }]}>
                            <Ionicons name="location-outline" size={22} color="#ca8a04" />
                        </View>
                        <Text style={styles.menuText}>Shipping Addresses</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { }}>
                        <View style={[styles.iconBox, { backgroundColor: "#f3f4f6" }]}>
                            <Ionicons name="settings-outline" size={22} color="#4b5563" />
                        </View>
                        <Text style={styles.menuText}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        paddingVertical: 32,
        backgroundColor: "#fff",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    initialsAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#e2e8f0",
        justifyContent: "center",
        alignItems: "center",
    },
    initialsText: {
        fontSize: 36,
        fontWeight: "700",
        color: "#64748b",
    },
    avatarLoading: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#e2e8f0",
        justifyContent: "center",
        alignItems: "center",
    },
    editAvatarButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#346beb",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    editNameContainer: {
        width: "100%",
        paddingHorizontal: 20,
        alignItems: "center",
    },
    nameInput: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1e293b",
        borderBottomWidth: 2,
        borderBottomColor: "#346beb",
        width: "100%",
        textAlign: "center",
        paddingVertical: 8,
        marginBottom: 12,
    },
    editActions: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    smallButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#059669",
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    cancelButton: {
        backgroundColor: "#f1f5f9",
    },
    cancelButtonText: {
        color: "#64748b",
        fontWeight: "600",
        fontSize: 14,
    },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },
    menuContainer: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f1f5f9",
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: "#334155",
        fontWeight: "500",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fef2f2",
        marginHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#fee2e2",
        marginBottom: 24,
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: "600",
        color: "#ef4444",
    },
    versionText: {
        textAlign: "center",
        color: "#94a3b8",
        fontSize: 12,
    },
});

export default ProfileScreen;
