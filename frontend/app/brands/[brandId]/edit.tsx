import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  useColorScheme,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/types/brand";
import { BrandUser } from "@/types/user";
import { BrandStatus, BrandRole, UserRole } from "@/types/enums";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";

const EditBrandScreen = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const { brandId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<BrandStatus>(BrandStatus.DRAFT);
  const [brandMembers, setBrandMembers] = useState<BrandUser[]>([]);
  const [allUsers, setAllUsers] = useState<
    { label: string; value: number; role: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<BrandRole>(BrandRole.STAFF);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { uploads, uploadImage } = useCloudinaryUpload();
  const dropdownRef = useRef<any>(null);

  // B&W theme
  const bg = isDark ? "#000000" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#000000";
  const secondary = isDark ? "#8E8E93" : "#6B6B6B";
  const border = isDark ? "#2C2C2E" : "#E5E5E5";
  const inputBg = isDark ? "#1C1C1E" : "#F5F5F5";

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
      const response = await fetch(
        `${getApiUrl()}/users?excludeGuests=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setAllUsers(
        data.map((u: any) => ({
          label: u.name ? `${u.name} (${u.email})` : u.email || "Unknown",
          value: u.id,
          role: u.role || "",
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

      const result = await ImagePicker.launchImageLibraryAsync({
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

  const roleFilters = [
    { key: "all", label: "ALL" },
    { key: "brandOwner", label: "BRAND OWNERS" },
    { key: "customer", label: "CUSTOMERS" },
    { key: "admin", label: "ADMINS" },
  ];

  const availableUsers = allUsers.filter(
    (u) => !brandMembers.some((m) => m.user?.id === u.value),
  );

  const filteredUsers =
    roleFilter === "all"
      ? availableUsers
      : availableUsers.filter((u) => u.role === roleFilter);

  const isUploading = Object.values(uploads).some(
    (u) => u.status === "uploading",
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="small" color={text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.replace(`/brands/${brandId}`)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={text} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: text }]}>EDIT BRAND</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>LOGO</Text>
          <TouchableOpacity
            style={[
              styles.logoUpload,
              {
                borderColor: logoUrl ? text : border,
                backgroundColor: inputBg,
              },
            ]}
            onPress={handleImagePick}
          >
            {uploads[
              Object.keys(uploads)
                .reverse()
                .find((k) => !logoUrl.includes(k)) || ""
            ] ? (
              <ImageUploadProgress
                upload={uploads[Object.keys(uploads).reverse()[0]]}
                size={100}
              />
            ) : logoUrl ? (
              <View style={styles.logoPreviewWrap}>
                <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
                <View
                  style={[
                    styles.logoOverlay,
                    { backgroundColor: isDark ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={14}
                    color={isDark ? "#000000" : "#FFFFFF"}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={28} color={secondary} />
                <Text
                  style={[styles.logoPlaceholderText, { color: secondary }]}
                >
                  Tap to upload
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>
            BRAND NAME <Text style={{ color: "#C41E3A" }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: text, borderColor: border },
            ]}
            placeholder="Enter brand name"
            placeholderTextColor={secondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>DESCRIPTION</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: inputBg, color: text, borderColor: border },
            ]}
            placeholder="Tell us about this brand"
            placeholderTextColor={secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>LOCATION</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: text, borderColor: border },
            ]}
            placeholder="Headquarters location"
            placeholderTextColor={secondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>STATUS</Text>
          <View style={styles.chipRow}>
            {Object.values(BrandStatus).map((s) => {
              const isSelected = status === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? text : "transparent",
                      borderColor: isSelected ? text : border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? bg : secondary },
                    ]}
                  >
                    {s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: border }]} />

        {/* Team Members */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            TEAM MEMBERS
          </Text>

          {brandMembers.map((member) => (
            <View
              key={member.id}
              style={[styles.memberCard, { borderBottomColor: border }]}
            >
              <View
                style={[styles.memberAvatar, { backgroundColor: inputBg }]}
              >
                <Text style={[styles.memberAvatarText, { color: secondary }]}>
                  {(
                    member.user?.name?.charAt(0) ||
                    member.user?.email?.charAt(0) ||
                    "?"
                  ).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.memberName, { color: text }]}
                  numberOfLines={1}
                >
                  {member.user?.name || "Unknown"}
                </Text>
                <Text
                  style={[styles.memberEmail, { color: secondary }]}
                  numberOfLines={1}
                >
                  {member.user?.email || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      member.role === BrandRole.OWNER ? text : inputBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    {
                      color:
                        member.role === BrandRole.OWNER ? bg : secondary,
                    },
                  ]}
                >
                  {member.role.toUpperCase()}
                </Text>
              </View>
              {(member.role !== BrandRole.OWNER ||
                user?.role === UserRole.ADMIN) &&
                member.user?.id !== user?.id && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 10 }}
                  >
                    <Ionicons name="close" size={16} color="#C41E3A" />
                  </TouchableOpacity>
                )}
            </View>
          ))}
        </View>

        {/* Add Member */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: secondary }]}>
            ADD MEMBER
          </Text>

          {/* Role filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterRow, { zIndex: 2 }]}
            contentContainerStyle={styles.filterRowContent}
          >
            {roleFilters.map((f) => {
              const isActive = roleFilter === f.key;
              const count =
                f.key === "all"
                  ? availableUsers.length
                  : availableUsers.filter((u) => u.role === f.key).length;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? text : "transparent",
                      borderColor: isActive ? text : border,
                    },
                  ]}
                  onPress={() => {
                    dropdownRef.current?.close();
                    setRoleFilter(f.key);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? bg : secondary },
                    ]}
                  >
                    {f.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User dropdown */}
          <View style={{ zIndex: 1 }}>
          <Dropdown
            ref={dropdownRef}
            mode="default"
            labelField="label"
            valueField="value"
            data={filteredUsers}
            value={selectedUserId}
            onChange={(item) => setSelectedUserId(item.value)}
            placeholder={
              filteredUsers.length === 0
                ? "No users found"
                : `Select from ${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`
            }
            search
            searchPlaceholder="Search by name or email..."
            style={[
              styles.dropdown,
              { backgroundColor: inputBg, borderColor: border },
            ]}
            placeholderStyle={[styles.dropdownPlaceholder, { color: secondary }]}
            selectedTextStyle={[styles.dropdownSelected, { color: text }]}
            inputSearchStyle={[
              styles.dropdownSearch,
              {
                backgroundColor: inputBg,
                color: text,
                borderColor: border,
              },
            ]}
            containerStyle={[
              styles.dropdownContainer,
              { backgroundColor: bg, borderColor: border },
            ]}
            itemTextStyle={{ color: text, fontSize: 14 }}
            activeColor={inputBg}
            renderItem={(item) => {
              const isSelected = item.value === selectedUserId;
              const roleLabel =
                item.role === "brandOwner"
                  ? "BRAND OWNER"
                  : item.role?.toUpperCase();
              return (
                <View
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: border },
                    isSelected && { backgroundColor: inputBg },
                  ]}
                >
                  <View style={styles.dropdownItemLeft}>
                    <View
                      style={[
                        styles.dropdownAvatar,
                        { backgroundColor: isSelected ? text : inputBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownAvatarText,
                          { color: isSelected ? bg : secondary },
                        ]}
                      >
                        {(item.label?.charAt(0) || "?").toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.dropdownItemContent}>
                      <Text
                        style={[
                          styles.dropdownItemName,
                          { color: text },
                          isSelected && { fontWeight: "800" },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {roleLabel && (
                        <Text
                          style={[styles.dropdownItemRole, { color: secondary }]}
                        >
                          {roleLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={text} />
                  )}
                </View>
              );
            }}
          />
          </View>

          {/* Role selection + Add button */}
          {selectedUserId && (
            <View style={styles.assignRow}>
              <Text style={[styles.assignLabel, { color: secondary }]}>
                ASSIGN AS
              </Text>
              <View style={styles.roleChips}>
                {Object.values(BrandRole).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setSelectedRole(r)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? text : "transparent",
                          borderColor: isSelected ? text : border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? bg : secondary },
                        ]}
                      >
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={handleAssignUser}
                style={[styles.addButton, { backgroundColor: text }]}
              >
                <Text style={[styles.addButtonText, { color: bg }]}>
                  ADD MEMBER
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: text },
            (submitting || isUploading) && styles.submitDisabled,
          ]}
          onPress={handleUpdateBrand}
          disabled={submitting || isUploading}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={bg} />
          ) : (
            <Text style={[styles.submitText, { color: bg }]}>
              SAVE CHANGES
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 40,
  },

  // Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  header: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },

  // Input
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500",
  },
  textArea: {
    height: 110,
    paddingTop: 14,
    paddingBottom: 14,
  },

  // Logo
  logoUpload: {
    height: 140,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoPreviewWrap: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  logoPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logoOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  logoPlaceholderText: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Members
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
  },
  memberEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Filter
  filterRow: {
    marginBottom: 10,
  },
  filterRowContent: {
    gap: 8,
  },

  // Dropdown
  dropdown: {
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 0,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownSelected: {
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownSearch: {
    height: 50,
    fontSize: 14,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    margin: 0,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    borderRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: 0,
    maxHeight: 300,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  dropdownAvatar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dropdownAvatarText: {
    fontSize: 13,
    fontWeight: "800",
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownItemRole: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  // Assign row
  assignRow: {
    marginTop: 14,
  },
  assignLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  roleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  addButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },

  // Submit
  submitButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    marginTop: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  submitDisabled: {
    opacity: 0.4,
  },
});

export default EditBrandScreen;
