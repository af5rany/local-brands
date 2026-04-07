import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter } from "expo-router";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import { useThemeColors } from "@/hooks/useThemeColor";
import Header from "@/components/Header";

const RegisterScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    dateOfBirth: "",
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { uploads, uploadImage } = useCloudinaryUpload();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateForm = () => {
    let valid = true;
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
      valid = false;
    }
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Must be at least 6 characters";
      valid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username.trim() || null,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phoneNumber: formData.phoneNumber || null,
          dateOfBirth: formData.dateOfBirth || null,
          avatar,
          role: "customer",
        }),
      });

      const data = await response.json();

      // if (response.status === 409) {
      //   const msg: string = data.message || "";
      //   if (msg.toLowerCase().includes("email")) {
      //     setErrors((prev: any) => ({ ...prev, email: "This email is already registered." }));
      //   } else if (msg.toLowerCase().includes("username")) {
      //     setErrors((prev: any) => ({ ...prev, username: "This username is already taken." }));
      //   } else {
      //     setErrors((prev: any) => ({ ...prev, email: msg || "Email or username already exists." }));
      //   }
      //   return;
      // }

      if (!response.ok) throw new Error(data.message || "Registration failed");

      Alert.alert("Success", "Account created! Please check your email to verify your account.", [
        { text: "OK", onPress: () => router.push("/auth/login") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Registration Error",
        error.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isUploading = Object.values(uploads).some(
    (u) => u.status === "uploading",
  );

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };

  const handleImagePick = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera roll access is required!");
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
        if (cloudUrl) setAvatar(cloudUrl);
      }
    } catch (error) {
      console.error("Error picking avatar:", error);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderField = (
    label: string,
    key: string,
    placeholder: string,
    options?: {
      required?: boolean;
      keyboardType?: any;
      secure?: boolean;
      showToggle?: boolean;
      toggleState?: boolean;
      onToggle?: () => void;
      icon?: string;
    },
  ) => {
    const {
      required = true,
      keyboardType,
      secure,
      showToggle,
      toggleState,
      onToggle,
      icon,
    } = options || {};
    const hasError = !!errors[key];

    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: hasError ? colors.danger : colors.border,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon as any}
              size={18}
              color={colors.textTertiary}
              style={styles.inputIcon}
            />
          )}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={(formData as any)[key]}
            onChangeText={(text) => handleChange(key, text)}
            editable={!loading}
            keyboardType={keyboardType}
            secureTextEntry={secure && !toggleState}
            autoCapitalize={key === "email" ? "none" : "sentences"}
          />
          {showToggle && (
            <Pressable onPress={onToggle} style={styles.eyeBtn}>
              <Ionicons
                name={toggleState ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          )}
        </View>
        {hasError && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors[key]}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <View
                style={[
                  styles.backCircle,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </View>
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            Fill in your details to get started
          </Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={[
                styles.avatarBtn,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleImagePick}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              {uploads[
                Object.keys(uploads)
                  .reverse()
                  .find((k) => !avatar?.includes(k)) || ""
              ] ? (
                <ImageUploadProgress
                  upload={uploads[Object.keys(uploads).reverse()[0]]}
                  size={90}
                />
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={28}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.avatarPlaceholderText,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {avatar && (
              <TouchableOpacity onPress={() => setAvatar(null)}>
                <Text style={[styles.removeText, { color: colors.danger }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {renderField("Full Name", "name", "John Doe", {
              icon: "person-outline",
            })}
            {renderField("Username", "username", "johndoe", {
              icon: "at-outline",
            })}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderField("Phone", "phoneNumber", "+1 234...", {
                  required: false,
                  keyboardType: "phone-pad",
                  icon: "call-outline",
                })}
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Birthday
              </Text>
              <Pressable
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textTertiary}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.dateText,
                    {
                      color: formData.dateOfBirth
                        ? colors.text
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {formData.dateOfBirth
                    ? formatDate(formData.dateOfBirth)
                    : "Select date"}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={
                  formData.dateOfBirth
                    ? new Date(formData.dateOfBirth)
                    : new Date()
                }
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) handleChange("dateOfBirth", date.toISOString());
                }}
              />
            )}

            {renderField("Email", "email", "you@example.com", {
              keyboardType: "email-address",
              icon: "mail-outline",
            })}
            {renderField("Password", "password", "••••••••", {
              secure: true,
              showToggle: true,
              toggleState: showPassword,
              onToggle: () => setShowPassword(!showPassword),
              icon: "lock-closed-outline",
            })}
            {renderField("Confirm Password", "confirmPassword", "••••••••", {
              secure: true,
              showToggle: true,
              toggleState: showConfirm,
              onToggle: () => setShowConfirm(!showConfirm),
              icon: "lock-closed-outline",
            })}
          </View>

          {/* Brand Owner Note */}
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.noteText, { color: colors.primary }]}>
              Want to sell products? Contact admin@localbrands.com to become a
              Brand Owner.
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              (loading || isUploading) && { opacity: 0.7 },
            ]}
            onPress={handleRegister}
            disabled={loading || isUploading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                Create Account
              </Text>
            )}
          </Pressable>

          {/* Social Auth Divider */}
          <View style={styles.socialDivider}>
            <View
              style={[
                styles.socialDividerLine,
                { backgroundColor: colors.border },
              ]}
            />
            <Text
              style={[
                styles.socialDividerText,
                { color: colors.textTertiary },
              ]}
            >
              Or continue with
            </Text>
            <View
              style={[
                styles.socialDividerLine,
                { backgroundColor: colors.border },
              ]}
            />
          </View>

          {/* Social Auth Buttons */}
          <Pressable
            style={[
              styles.socialButton,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              Alert.alert("Coming Soon", "Google sign-in coming soon")
            }
            disabled={loading}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color="#DB4437"
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.socialButton,
              {
                backgroundColor: "#1877F2",
                borderColor: "#1877F2",
              },
            ]}
            onPress={() =>
              Alert.alert("Coming Soon", "Facebook sign-in coming soon")
            }
            disabled={loading}
          >
            <Ionicons
              name="logo-facebook"
              size={20}
              color="#ffffff"
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: "#ffffff" }]}>
              Continue with Facebook
            </Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Already have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/auth/login")}
              disabled={loading}
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {" "}
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 12, paddingBottom: 40 },

  // ── Header ────────────────────────────────
  headerRow: { flexDirection: "row", marginBottom: 20 },
  backBtn: { padding: 2 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 15, fontWeight: "500", marginBottom: 24 },

  // ── Avatar ────────────────────────────────
  avatarSection: { alignItems: "center", marginBottom: 24, gap: 10 },
  avatarBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { alignItems: "center", gap: 4 },
  avatarPlaceholderText: { fontSize: 11, fontWeight: "600" },
  removeText: { fontSize: 13, fontWeight: "600" },

  // ── Form ──────────────────────────────────
  formCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
    marginBottom: 16,
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: "500", height: "100%" },
  eyeBtn: { padding: 4 },
  dateText: { fontSize: 15, fontWeight: "500", flex: 1, paddingVertical: 14 },
  errorText: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  row: { flexDirection: "row" },

  // ── Note ──────────────────────────────────
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 10,
    marginBottom: 8,
  },
  noteText: { fontSize: 13, fontWeight: "500", flex: 1, lineHeight: 19 },

  // ── Button ────────────────────────────────
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },

  // ── Social Auth ────────────────────────────
  socialDivider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 24,
  },
  socialDividerLine: { flex: 1, height: 1 },
  socialDividerText: { marginHorizontal: 16, fontSize: 13, fontWeight: "500" },
  socialButton: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  socialIcon: {
    position: "absolute",
    left: 16,
  },
  socialButtonText: { fontSize: 15, fontWeight: "600" },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { fontSize: 14, fontWeight: "500" },
  footerLink: { fontSize: 14, fontWeight: "700" },
});

export default RegisterScreen;
