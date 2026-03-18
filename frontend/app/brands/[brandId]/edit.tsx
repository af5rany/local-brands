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
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/types/brand";
import { BrandUser } from "@/types/user";
import { BrandStatus, BrandRole } from "@/types/enums";
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
  const [status, setStatus] = useState<BrandStatus>(BrandStatus.DRAFT);
  const [brandMembers, setBrandMembers] = useState<BrandUser[]>([]);
  const [allUsers, setAllUsers] = useState<{ label: string; value: number }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<BrandRole>(BrandRole.STAFF);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { uploads, uploadImage } = useCloudinaryUpload();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "primary",
  );
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#8e8e93", dark: "#98989d" },
    "text",
  );
  const inputBackground = useThemeColor(
    { light: "#f2f2f7", dark: "#2c2c2e" },
    "background",
  );
  const inputBorderColor = useThemeColor(
    { light: "#e5e5ea", dark: "#3a3a3c" },
    "background",
  );

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
      setStatus(data.status || BrandStatus.DRAFT);
      setBrandMembers(data.brandUsers || []);
    } catch (error) {
      console.error("Error fetching brand:", error);
      Alert.alert("Error", "Failed to fetch brand details.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [brandId, token, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAllUsers(
        data.map((u: any) => ({
          label: u.name ? `${u.name} (${u.email})` : u.email || "Unknown",
          value: u.id,
        })),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token]);

  useEffect(() => {
    if (brandId && token) {
      fetchBrandData();
      fetchUsers();
    }
  }, [brandId, token, fetchBrandData, fetchUsers]);

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`${getApiUrl()}/brands/${brandId}/assign-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to assign user");
      }
      setSelectedUserId(null);
      setSelectedRole(BrandRole.STAFF);
      await fetchBrandData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRemoveMember = (member: BrandUser) => {
    const memberName = member.user?.name || member.user?.email || "this user";
    Alert.alert("Remove Member", `Remove ${memberName} from this brand?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${getApiUrl()}/brands/${brandId}/remove-user/${member.user?.id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.message || "Failed to remove user");
            }
            await fetchBrandData();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access photo library is required!",
        );
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
        status,
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
          { text: "OK", onPress: () => router.replace(`/brands/${brandId}`) },
        ]);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update brand");
      }
    } catch (err: any) {
      console.error("Error updating brand:", err);
      Alert.alert(
        "Error",
        err.message || "An error occurred while updating the brand.",
      );
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
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "default"}
      />
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBackground }]}
            onPress={() => router.replace(`/brands/${brandId}`)}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.header, { color: textColor }]}>
              Edit Brand
            </Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              Update your brand information
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.logoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image-outline" size={20} color={buttonColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Brand Identity
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.logoUploadContainer,
                {
                  backgroundColor: inputBackground,
                  borderColor: logoUrl ? buttonColor : inputBorderColor,
                  borderStyle: logoUrl ? "solid" : "dashed",
                },
              ]}
              onPress={handleImagePick}
            >
              {uploads[
                Object.keys(uploads)
                  .reverse()
                  .find((k) => !logoUrl.includes(k)) || ""
              ] ? (
                <View style={styles.uploadingContainer}>
                  <ImageUploadProgress
                    upload={uploads[Object.keys(uploads).reverse()[0]]}
                    size={150}
                  />
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
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: cardBackground },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={28}
                      color={buttonColor}
                    />
                  </View>
                  <Text
                    style={[styles.logoPlaceholderText, { color: textColor }]}
                  >
                    Upload Brand Logo
                  </Text>
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

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>
                Status
              </Text>
              <View style={styles.statusRow}>
                {Object.values(BrandStatus).map((s) => {
                  const isSelected = status === s;
                  const statusColor =
                    s === BrandStatus.ACTIVE
                      ? "#10b981"
                      : s === BrandStatus.SUSPENDED
                        ? "#ef4444"
                        : s === BrandStatus.ARCHIVED
                          ? "#6b7280"
                          : "#f59e0b";
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isSelected
                            ? statusColor
                            : inputBackground,
                          borderColor: isSelected
                            ? statusColor
                            : inputBorderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: isSelected ? "#fff" : secondaryTextColor },
                        ]}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Team Management */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={buttonColor} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Team Members
            </Text>
          </View>

          {/* Current Members */}
          {brandMembers.map((member) => {
            const roleColor =
              member.role === BrandRole.OWNER
                ? "#10b981"
                : member.role === BrandRole.MANAGER
                  ? "#3b82f6"
                  : member.role === BrandRole.STAFF
                    ? "#f59e0b"
                    : "#6b7280";
            return (
              <View
                key={member.id}
                style={[
                  styles.memberCard,
                  {
                    backgroundColor: inputBackground,
                    borderColor: inputBorderColor,
                  },
                ]}
              >
                <View style={styles.memberInfo}>
                  <View
                    style={[styles.memberAvatar, { backgroundColor: roleColor + "20" }]}
                  >
                    <Ionicons
                      name="person"
                      size={18}
                      color={roleColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.memberName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {member.user?.name || "Unknown"}
                    </Text>
                    <Text
                      style={[styles.memberEmail, { color: secondaryTextColor }]}
                      numberOfLines={1}
                    >
                      {member.user?.email || ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: roleColor + "20" },
                    ]}
                  >
                    <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                      {member.role.toUpperCase()}
                    </Text>
                  </View>
                  {member.role !== BrandRole.OWNER && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(member)}
                      style={styles.removeMemberBtn}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Add Member */}
          <View style={styles.addMemberSection}>
            <Text
              style={[
                styles.inputLabel,
                { color: textColor, marginBottom: 8 },
              ]}
            >
              Add Member
            </Text>
            <View
              style={[
                styles.addMemberRow,
              ]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.dropdownWrapper,
                    {
                      backgroundColor: inputBackground,
                      borderColor: inputBorderColor,
                    },
                  ]}
                >
                  <Dropdown
                    labelField="label"
                    valueField="value"
                    data={allUsers.filter(
                      (u) => !brandMembers.some((m) => m.user?.id === u.value),
                    )}
                    value={selectedUserId}
                    onChange={(item) => setSelectedUserId(item.value)}
                    placeholder="Select user"
                    search={true}
                    searchPlaceholder="Search..."
                    style={styles.dropdown}
                    placeholderStyle={[
                      styles.placeholderStyle,
                      { color: secondaryTextColor },
                    ]}
                    selectedTextStyle={[
                      styles.selectedTextStyle,
                      { color: textColor },
                    ]}
                    inputSearchStyle={[
                      styles.inputSearchStyle,
                      {
                        backgroundColor: cardBackground,
                        color: textColor,
                        borderColor: inputBorderColor,
                      },
                    ]}
                    containerStyle={[
                      styles.dropdownContainer,
                      {
                        backgroundColor: cardBackground,
                        borderColor: inputBorderColor,
                      },
                    ]}
                    itemTextStyle={{ color: textColor, fontSize: 14 }}
                    activeColor={inputBackground}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.roleAndAddRow, { marginTop: 10 }]}>
              <View style={styles.roleChips}>
                {Object.values(BrandRole).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setSelectedRole(r)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: isSelected
                            ? buttonColor
                            : inputBackground,
                          borderColor: isSelected
                            ? buttonColor
                            : inputBorderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          {
                            color: isSelected ? "#fff" : secondaryTextColor,
                          },
                        ]}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={handleAssignUser}
                disabled={!selectedUserId}
                style={[
                  styles.addMemberBtn,
                  {
                    backgroundColor: selectedUserId
                      ? buttonColor
                      : inputBackground,
                  },
                ]}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={selectedUserId ? "#fff" : secondaryTextColor}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, submitting && styles.buttonDisabled]}
          onPress={handleUpdateBrand}
          disabled={
            submitting ||
            Object.values(uploads).some((u) => u.status === "uploading")
          }
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
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
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
    <View
      style={[
        styles.inputWrapper,
        { borderColor: inputBorderColor, backgroundColor: inputBackground },
      ]}
    >
      <Ionicons
        name={`${icon}-outline` as any}
        size={20}
        color={useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "primary")}
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTextContainer: { flex: 1 },
  header: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4, letterSpacing: 0.2 },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  logoSection: { marginBottom: 32 },
  logoUploadContainer: {
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoPreviewContainer: { width: "100%", height: "100%", position: "relative" },
  logoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  logoBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 12,
  },
  logoPlaceholder: { alignItems: "center", padding: 20 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoPlaceholderText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  formFields: { gap: 24 },
  inputContainer: { width: "100%" },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
  },
  inputIcon: { marginLeft: 16, marginRight: 4 },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 12, fontWeight: "500" },
  createButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gradientButton: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  buttonIcon: { marginTop: 2 },
  buttonDisabled: { opacity: 0.7 },
  uploadingContainer: { alignItems: "center", gap: 12 },
  uploadingText: { fontSize: 15, fontWeight: "600" },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  memberCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  removeMemberBtn: {
    padding: 2,
  },
  addMemberSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  addMemberRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleAndAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  addMemberBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownWrapper: {
    borderWidth: 1.5,
    borderRadius: 16,
  },
  dropdown: {
    height: 48,
    paddingHorizontal: 14,
  },
  dropdownContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
    maxHeight: 250,
  },
  placeholderStyle: {
    fontSize: 15,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 15,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 10,
    margin: 8,
  },
});

export default EditBrandScreen;
