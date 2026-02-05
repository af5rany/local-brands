import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    Image,
    Alert,
    ActivityIndicator,
    Keyboard,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/types/brand";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import * as ImageManipulator from "expo-image-manipulator";

const EditBrandScreen = () => {
    const { token, user } = useAuth();
    const router = useRouter();
    const { brandId } = useLocalSearchParams();

    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const { uploads, uploadImage } = useCloudinaryUpload();

    // Theme colors
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const buttonColor = useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "tint");
    const cardBackground = useThemeColor({ light: "#ffffff", dark: "#1c1c1e" }, "background");
    const secondaryTextColor = useThemeColor({ light: "#8e8e93", dark: "#98989d" }, "text");
    const inputBackground = useThemeColor({ light: "#f2f2f7", dark: "#2c2c2e" }, "background");
    const inputBorderColor = useThemeColor({ light: "#e5e5ea", dark: "#3a3a3c" }, "background");

    const fetchBrandData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch brand data");
            const data: Brand = await response.json();
            setName(data.name);
            setDescription(data.description || "");
            setLogoUrl(data.logo || "");
            setLocation(data.location || "");
        } catch (error) {
            console.error("Error fetching brand:", error);
            Alert.alert("Error", "Failed to fetch brand details.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [brandId, token, router]);

    useEffect(() => {
        if (brandId && token) {
            fetchBrandData();
        }
    }, [brandId, token, fetchBrandData]);

    const handleImagePick = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Permission to access photo library is required!");
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                const cloudUrl = await uploadImage(uri);
                if (cloudUrl) {
                    setLogoUrl(cloudUrl);
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
        }
    };

    const handleUpdateBrand = async () => {
        Keyboard.dismiss();

        if (!name.trim()) {
            Alert.alert("Validation Error", "Brand name is required");
            return;
        }

        setSubmitting(true);

        try {
            const updateData = {
                name: name.trim(),
                description: description.trim(),
                logo: logoUrl,
                location: location.trim(),
            };

            const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                Alert.alert("Success", "Brand updated successfully!", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to update brand");
            }
        } catch (err: any) {
            console.error("Error updating brand:", err);
            Alert.alert("Error", err.message || "An error occurred while updating the brand.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor }]}>
                <ActivityIndicator size="large" color={buttonColor} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
            <ScrollView
                style={[styles.container, { backgroundColor }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: cardBackground }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.header, { color: textColor }]}>Edit Brand</Text>
                        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                            Update your brand information
                        </Text>
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: cardBackground }]}>
                    <View style={styles.logoSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="image-outline" size={20} color={buttonColor} />
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Brand Identity</Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.logoUploadContainer,
                                {
                                    backgroundColor: inputBackground,
                                    borderColor: logoUrl ? buttonColor : inputBorderColor,
                                    borderStyle: logoUrl ? 'solid' : 'dashed'
                                },
                            ]}
                            onPress={handleImagePick}
                        >
                            {uploads[Object.keys(uploads).reverse().find(k => !logoUrl.includes(k)) || ''] ? (
                                <View style={styles.uploadingContainer}>
                                    <ImageUploadProgress upload={uploads[Object.keys(uploads).reverse()[0]]} size={150} />
                                </View>
                            ) : logoUrl ? (
                                <View style={styles.logoPreviewContainer}>
                                    <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
                                    <View style={styles.logoBadge}>
                                        <Ionicons name="camera" size={16} color="white" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <View style={[styles.iconCircle, { backgroundColor: cardBackground }]}>
                                        <Ionicons name="cloud-upload-outline" size={28} color={buttonColor} />
                                    </View>
                                    <Text style={[styles.logoPlaceholderText, { color: textColor }]}>Upload Brand Logo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formFields}>
                        <InputField
                            label="Brand Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter brand name"
                            icon="business"
                            textColor={textColor}
                            secondaryTextColor={secondaryTextColor}
                            inputBorderColor={inputBorderColor}
                            inputBackground={inputBackground}
                        />

                        <InputField
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Tell us about your brand"
                            multiline={true}
                            icon="document-text"
                            textColor={textColor}
                            secondaryTextColor={secondaryTextColor}
                            inputBorderColor={inputBorderColor}
                            inputBackground={inputBackground}
                        />

                        <InputField
                            label="Location"
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Headquarters location"
                            icon="location"
                            textColor={textColor}
                            secondaryTextColor={secondaryTextColor}
                            inputBorderColor={inputBorderColor}
                            inputBackground={inputBackground}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.createButton, submitting && styles.buttonDisabled]}
                    onPress={handleUpdateBrand}
                    disabled={submitting || Object.values(uploads).some(u => u.status === 'uploading')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={submitting ? ["#bbb", "#999"] : [buttonColor, "#1B6ED9"]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Save Changes</Text>
                                <Ionicons name="checkmark-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    icon,
    textColor,
    secondaryTextColor,
    inputBorderColor,
    inputBackground,
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    icon: string;
    textColor: string;
    secondaryTextColor: string;
    inputBorderColor: string;
    inputBackground: string;
}) => (
    <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: textColor }]}>{label}</Text>
        <View style={[styles.inputWrapper, { borderColor: inputBorderColor, backgroundColor: inputBackground }]}>
            <Ionicons
                name={`${icon}-outline` as any}
                size={20}
                color={useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "tint")}
                style={styles.inputIcon}
            />
            <TextInput
                style={[
                    styles.input,
                    { color: textColor, height: multiline ? 100 : 56 },
                    multiline && { textAlignVertical: "top", paddingTop: 16 },
                ]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={secondaryTextColor}
                multiline={multiline}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 20,
        paddingBottom: 40,
    },
    headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
    backButton: {
        width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
        marginRight: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    headerTextContainer: { flex: 1 },
    header: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
    subtitle: { fontSize: 15, marginTop: 4, letterSpacing: 0.2 },
    card: {
        borderRadius: 24, padding: 24, marginBottom: 24, elevation: 5,
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    sectionTitle: { fontSize: 18, fontWeight: "700" },
    logoSection: { marginBottom: 32 },
    logoUploadContainer: { height: 180, borderRadius: 20, borderWidth: 1.5, alignItems: "center", justifyContent: "center", overflow: 'hidden' },
    logoPreviewContainer: { width: "100%", height: "100%", position: 'relative' },
    logoPreview: { width: "100%", height: "100%", resizeMode: 'cover' },
    logoBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 12 },
    logoPlaceholder: { alignItems: "center", padding: 20 },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
        marginBottom: 12, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 4,
    },
    logoPlaceholderText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
    formFields: { gap: 24 },
    inputContainer: { width: '100%' },
    inputLabel: { fontSize: 15, fontWeight: "700", marginBottom: 10, marginLeft: 4 },
    inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 16 },
    inputIcon: { marginLeft: 16, marginRight: 4 },
    input: { flex: 1, fontSize: 16, paddingHorizontal: 12, fontWeight: '500' },
    createButton: {
        borderRadius: 20, overflow: "hidden", elevation: 8,
        shadowColor: "#007AFF", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12,
    },
    gradientButton: { paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
    buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
    buttonIcon: { marginTop: 2 },
    buttonDisabled: { opacity: 0.7 },
    uploadingContainer: { alignItems: 'center', gap: 12 },
    uploadingText: { fontSize: 15, fontWeight: '600' }
});

export default EditBrandScreen;
