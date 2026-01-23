import React, { useState, useEffect } from "react";
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
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";

type User = {
  id: string;
  name?: string;
  email?: string;
};

const CreateBrandScreen = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "tint"
  );
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text"
  );
  const inputBorderColor = useThemeColor(
    { light: "#e1e5e9", dark: "#38383a" },
    "text"
  );

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const formattedUsers = data.map((user: User) => ({
        label: user.name || user.email,
        value: user.id,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to fetch users.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImagePick = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access photo library is required!",
        [{ text: "OK" }]
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadToCloudinary(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split("/").pop();
    formData.append("file", {
      uri,
      name: filename,
      type: "image/jpeg",
    } as any);
    formData.append("upload_preset", "UnsignedPreset");
    formData.append("cloud_name", "dg4l2eelg");

    try {
      setUploadingImage(true);
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok) {
        setLogoUrl(data.secure_url);
        Alert.alert("Success", "Logo uploaded successfully!", [{ text: "OK" }]);
      } else {
        throw new Error(data?.message || "Image upload failed.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "An error occurred while uploading the image.");
    } finally {
      setUploadingImage(false);
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
        owner,
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
            onPress: () => router.replace("/brands"),
          },
        ]);
      } else {
        throw new Error(data.message || "Failed to create brand");
      }
    } catch (err: any) {
      console.error("Error creating brand:", err);
      Alert.alert(
        "Error",
        err.message || "An error occurred while creating the brand."
      );
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    icon,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    icon: string;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: textColor }]}>{label}</Text>
      <View style={[styles.inputWrapper, { borderColor: inputBorderColor }]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={secondaryTextColor}
          style={styles.inputIcon}
        />
        <TextInput
          style={[
            styles.input,
            { color: textColor, height: multiline ? 80 : 50 },
            multiline && { textAlignVertical: "top", paddingTop: 12 },
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.header, { color: textColor }]}>
              Create Brand
            </Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              Add a new brand to your collection
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: cardBackground }]}>
          {/* Logo Upload Section */}
          <View style={styles.logoSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Brand Logo
            </Text>
            <TouchableOpacity
              style={[
                styles.logoUploadContainer,
                { borderColor: inputBorderColor },
              ]}
              onPress={handleImagePick}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color={buttonColor} />
                  <Text
                    style={[
                      styles.uploadingText,
                      { color: secondaryTextColor },
                    ]}
                  >
                    Uploading...
                  </Text>
                </View>
              ) : logoUrl ? (
                <View style={styles.logoPreviewContainer}>
                  <Image source={{ uri: logoUrl }} style={styles.logoPreview} />
                  <View style={styles.logoOverlay}>
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons
                    name="camera"
                    size={32}
                    color={secondaryTextColor}
                  />
                  <Text
                    style={[
                      styles.logoPlaceholderText,
                      { color: secondaryTextColor },
                    ]}
                  >
                    Tap to upload logo
                  </Text>
                  <Text
                    style={[styles.logoHintText, { color: secondaryTextColor }]}
                  >
                    Recommended: Square image, max 2MB
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <InputField
              label="Brand Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter brand name"
              icon="business"
            />

            <InputField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your brand"
              multiline={true}
              icon="document-text"
            />

            <InputField
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Brand headquarters location"
              icon="location"
            />

            {/* Owner Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: textColor }]}>
                Brand Owner
              </Text>
              <View
                style={[
                  styles.dropdownWrapper,
                  { borderColor: inputBorderColor },
                ]}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={secondaryTextColor}
                  style={styles.inputIcon}
                />
                <Dropdown
                  labelField="label"
                  valueField="value"
                  data={users}
                  value={owner}
                  onChange={(item) => setOwner(item.value)}
                  placeholder="Select brand owner"
                  searchPlaceholder="Search users..."
                  style={styles.dropdown}
                  placeholderStyle={[
                    styles.placeholderStyle,
                    { color: secondaryTextColor },
                  ]}
                  selectedTextStyle={[
                    styles.selectedTextStyle,
                    { color: textColor },
                  ]}
                  inputSearchStyle={styles.inputSearchStyle}
                  containerStyle={[
                    styles.dropdownContainer,
                    { backgroundColor: cardBackground },
                  ]}
                  itemTextStyle={{ color: textColor }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateBrand}
          disabled={loading || uploadingImage}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              loading ? ["#bbb", "#999"] : [buttonColor, `${buttonColor}CC`]
            }
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>Creating Brand...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.buttonText}>Create Brand</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  logoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  logoUploadContainer: {
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  uploadingContainer: {
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  logoPreviewContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  logoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  logoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  changeLogoText: {
    color: "white",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  logoPlaceholder: {
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  logoHintText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  formFields: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 16,
  },
  dropdownWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  dropdown: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
  },
  dropdownContainer: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  createButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default CreateBrandScreen;
