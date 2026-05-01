import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { useThemeColors } from "@/hooks/useThemeColor";
import * as ImagePicker from "expo-image-picker";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";

type User = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

const CreateBrandScreen = () => {
  const { token } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [owner, setOwner] = useState("");
  const [location, setLocation] = useState("");
  const [users, setUsers] = useState<{ label: string; value: string; role: string }[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<any>(null);
  const { uploads, uploadImage } = useCloudinaryUpload();

  // Fetch non-guest users
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/users?excludeGuests=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      const formatted = data.map((u: User) => ({
        label: u.name
          ? `${u.name} (${u.email})`
          : u.email || "Unknown",
        value: u.id,
        role: u.role || "",
      }));
      setUsers(formatted);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleCreateBrand = async () => {
    Keyboard.dismiss();

    if (!name.trim()) {
      Alert.alert("Validation Error", "Brand name is required");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Brand description is required");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Validation Error", "Brand location is required");
      return;
    }
    if (!owner) {
      Alert.alert("Validation Error", "Please select an owner");
      return;
    }
    if (!logoUrl) {
      Alert.alert("Validation Error", "Please upload a brand logo");
      return;
    }

    setLoading(true);

    try {
      const newBrand = {
        name: name.trim(),
        description: description.trim(),
        logo: logoUrl,
        ownerId: Number(owner),
        location: location.trim(),
      };

      const response = await fetch(`${getApiUrl()}/brands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBrand),
      });

      const data = await response.json();

      if (response.status === 201) {
        Alert.alert("Success", "Brand created successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/brands"),
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to create brand");
      }
    } catch (err: any) {
      console.error("Error creating brand:", err);
      Alert.alert(
        "Error",
        err.message || "An error occurred while creating the brand.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.value === owner);

  const roleFilters = [
    { key: "all", label: "ALL" },
    { key: "brandOwner", label: "BRAND OWNERS" },
    { key: "customer", label: "CUSTOMERS" },
    { key: "admin", label: "ADMINS" },
  ];

  const filteredUsers =
    roleFilter === "all"
      ? users
      : users.filter((u) => u.role === roleFilter);

  const isUploading = Object.values(uploads).some(
    (u) => u.status === "uploading",
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar
        barStyle={colors.statusBar as any}
        backgroundColor={colors.background}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>NEW BRAND</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>LOGO</Text>
          <TouchableOpacity
            style={[
              styles.logoUpload,
              {
                borderColor: logoUrl ? colors.text : colors.border,
                backgroundColor: colors.surfaceRaised,
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
                    { backgroundColor: colors.text },
                  ]}
                >
                  <Ionicons
                    name="camera-outline"
                    size={14}
                    color={colors.textInverse}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
                <Text style={[styles.logoPlaceholderText, { color: colors.textSecondary }]}>
                  Tap to upload
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            BRAND NAME <Text style={{ color: colors.accentRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Enter brand name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Owner */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            ASSIGN OWNER <Text style={{ color: colors.accentRed }}>*</Text>
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
                  ? users.length
                  : users.filter((u) => u.role === f.key).length;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.text : "transparent",
                      borderColor: isActive ? colors.text : colors.border,
                    },
                  ]}
                  onPress={() => {
                    dropdownRef.current?.close();
                    setRoleFilter(f.key);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? colors.background : colors.textSecondary },
                    ]}
                  >
                    {f.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dropdown */}
          <View style={{ zIndex: 1 }}>
            <Dropdown
              ref={dropdownRef}
              mode="default"
              labelField="label"
              valueField="value"
              data={filteredUsers}
              value={owner}
              onChange={(item) => setOwner(item.value)}
              placeholder={
                filteredUsers.length === 0
                  ? "No users found"
                  : `Select from ${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""}`
              }
              search
              searchPlaceholder="Search by name or email..."
              style={[
                styles.dropdown,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}
              placeholderStyle={[styles.dropdownPlaceholder, { color: colors.textSecondary }]}
              selectedTextStyle={[styles.dropdownSelected, { color: colors.text }]}
              inputSearchStyle={[
                styles.dropdownSearch,
                {
                  backgroundColor: colors.surfaceRaised,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              containerStyle={[
                styles.dropdownContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              itemTextStyle={{ color: colors.text, fontSize: 14 }}
              activeColor={colors.surfaceRaised}
              renderItem={(item) => {
                const isSelected = item.value === owner;
                const roleLabel =
                  item.role === "brandOwner"
                    ? "BRAND OWNER"
                    : item.role?.toUpperCase();
                return (
                  <View
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.surfaceRaised },
                    ]}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View
                        style={[
                          styles.dropdownAvatar,
                          { backgroundColor: isSelected ? colors.text : colors.surfaceRaised },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownAvatarText,
                            { color: isSelected ? colors.background : colors.textSecondary },
                          ]}
                        >
                          {(item.label?.charAt(0) || "?").toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.dropdownItemContent}>
                        <Text
                          style={[
                            styles.dropdownItemName,
                            { color: colors.text },
                            isSelected && { fontWeight: "800" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {roleLabel && (
                          <Text
                            style={[styles.dropdownItemRole, { color: colors.textSecondary }]}
                          >
                            {roleLabel}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    )}
                  </View>
                );
              }}
            />
          </View>

          {/* Selected user info */}
          {selectedUser && (
            <View style={[styles.selectedInfo, { borderColor: colors.border }]}>
              <View
                style={[styles.selectedAvatar, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.selectedAvatarText, { color: colors.background }]}>
                  {(selectedUser.label?.charAt(0) || "?").toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.selectedName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {selectedUser.label}
                </Text>
                <Text style={[styles.selectedRole, { color: colors.textSecondary }]}>
                  {selectedUser.role === "brandOwner"
                    ? "BRAND OWNER"
                    : selectedUser.role?.toUpperCase()}
                  {selectedUser.role === "customer" &&
                    "  \u2192  BRAND OWNER"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOwner("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            DESCRIPTION <Text style={{ color: colors.accentRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Tell us about this brand"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            LOCATION <Text style={{ color: colors.accentRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceRaised, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Headquarters location"
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            (loading || isUploading) && styles.submitDisabled,
          ]}
          onPress={handleCreateBrand}
          disabled={loading || isUploading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.submitText, { color: colors.background }]}>
              CREATE BRAND
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    // letterSpacing: 2,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 1.5,
    marginBottom: 10,
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
    // letterSpacing: 0.5,
  },

  // Filter chips
  filterRow: {
    marginBottom: 10,
  },
  filterRowContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: "700",
    // letterSpacing: 1,
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
    // letterSpacing: 1,
    marginTop: 2,
  },

  // Selected user card
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  selectedAvatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedAvatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  selectedName: {
    fontSize: 13,
    fontWeight: "700",
  },
  selectedRole: {
    fontSize: 10,
    fontWeight: "600",
    // letterSpacing: 0.8,
    marginTop: 2,
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
    // letterSpacing: 2,
  },
  submitDisabled: {
    opacity: 0.4,
  },
});

export default CreateBrandScreen;
