import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import { useThemeColors } from "@/hooks/useThemeColor";

const EditProfileScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, token, refreshUser } = useAuth();
  const { uploads, uploadImage } = useCloudinaryUpload();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    dateOfBirth: user?.dateOfBirth?.split("T")[0] || "",
    avatar: user?.avatar || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const cloudUrl = await uploadImage(result.assets[0].uri);
        if (cloudUrl) {
          setFormData((prev) => ({ ...prev, avatar: cloudUrl }));
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Name cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        avatar: formData.avatar || undefined,
      };

      // Convert dateOfBirth to ISO if present
      if (formData.dateOfBirth) {
        payload.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
      }

      const response = await fetch(`${getApiUrl()}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update profile");
      }

      await refreshUser();
      Alert.alert("Success", "Profile updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const isUploading = Object.values(uploads).some(
    (u) => u.status === "uploading",
  );

  const latestUpload = uploads[Object.keys(uploads).reverse()[0]];

  const initials = (formData.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.backCircle,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {isUploading && latestUpload ? (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <ImageUploadProgress upload={latestUpload} size={90} />
                </View>
              ) : formData.avatar ? (
                <Image
                  source={{ uri: formData.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[styles.initialsText, { color: colors.primary }]}
                  >
                    {initials}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  styles.cameraBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.background,
                  },
                ]}
                onPress={handleImagePick}
                disabled={isUploading}
              >
                <Ionicons
                  name="camera"
                  size={16}
                  color={colors.primaryForeground}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleImagePick} disabled={isUploading}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Full Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Your full name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Email (read-only) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <View
                style={[
                  styles.input,
                  styles.inputDisabled,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[styles.disabledText, { color: colors.textTertiary }]}
                >
                  {formData.email}
                </Text>
              </View>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Email cannot be changed
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: text }))
                }
                placeholder="+1 234 567 890"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Date of Birth
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={formData.dateOfBirth}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, dateOfBirth: text }))
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            (saving || isUploading) && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={saving || isUploading}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 2,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },

  // ── Avatar ────────────────────────────────
  scrollContent: {
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  initialsText: {
    fontSize: 32,
    fontWeight: "700",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Form ──────────────────────────────────
  formCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
  },
  inputDisabled: {
    justifyContent: "center",
  },
  disabledText: {
    fontSize: 15,
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },

  // ── Footer ────────────────────────────────
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default EditProfileScreen;
