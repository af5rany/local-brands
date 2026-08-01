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
import { useAuth } from "@/context/AuthContext";
import { useSocialAuth } from "@/hooks/useSocialAuth";

const RegisterScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { login, user, isGuest, token } = useAuth();
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

  const { handleGoogle, handleFacebook, googleLoading, facebookLoading } =
    useSocialAuth((token) => {
      login(token);
      router.dismissAll();
    });

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
      const body = {
        name: formData.name,
        username: formData.username.trim() || null,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        avatar,
        role: "customer",
      };

      const url =
        isGuest && user?.id
          ? `${getApiUrl()}/auth/convert-guest/${user.id}`
          : `${getApiUrl()}/auth/register`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isGuest && token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Registration failed");

      if (isGuest) {
        login(data.token);
        router.dismissAll();
      } else {
        Alert.alert(
          "Success",
          "Account created! Please check your email to verify your account.",
          [{ text: "OK", onPress: () => router.push("/auth/login") }],
        );
      }
    } catch (error: any) {
      Alert.alert("Registration Error", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isUploading = Object.values(uploads).some((u) => u.status === "uploading");
  const isAnyLoading = loading || isUploading || googleLoading || facebookLoading;

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
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
    },
  ) => {
    const { required = true, keyboardType, secure, showToggle, toggleState, onToggle, autoCapitalize } = options || {};
    const hasError = !!errors[key];

    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>
          {label.toUpperCase()}{required && <Text style={{ color: colors.accentRed }}> *</Text>}
        </Text>
        <View style={[styles.underlineField, { borderBottomColor: hasError ? colors.accentRed : colors.text }]}>
          <TextInput
            style={[styles.input, { color: colors.text, flex: 1 }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            value={(formData as any)[key]}
            onChangeText={(text) => handleChange(key, text)}
            editable={!isAnyLoading}
            keyboardType={keyboardType}
            secureTextEntry={secure && !toggleState}
            autoCapitalize={autoCapitalize ?? (key === "email" || key === "username" ? "none" : "sentences")}
          />
          {showToggle && (
            <Pressable onPress={onToggle} style={styles.eyeBtn}>
              <Text style={[styles.showHide, { color: colors.textTertiary }]}>
                {toggleState ? "HIDE" : "SHOW"}
              </Text>
            </Pressable>
          )}
        </View>
        {hasError && (
          <Text style={[styles.errorText, { color: colors.accentRed }]}>{errors[key]}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back nav ── */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backRow}
            disabled={isAnyLoading}
          >
            <Text style={[styles.backText, { color: colors.textTertiary }]}>← BACK</Text>
          </Pressable>

          {/* ── Wordmark ── */}
          <View style={styles.wordmarkBlock}>
            <Text style={[styles.wordmark, { color: colors.text }]}>LOCAL BRANDS</Text>
            <View style={[styles.wordmarkDivider, { backgroundColor: colors.text }]} />
            <Text style={[styles.wordmarkSub, { color: colors.textTertiary }]}>EST · MMXXVI</Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>CREATE ACCOUNT</Text>

          {/* ── Avatar ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={[styles.avatarBtn, { borderColor: colors.border }]}
              onPress={handleImagePick}
              disabled={isAnyLoading}
              activeOpacity={0.7}
            >
              {uploads[Object.keys(uploads).reverse().find((k) => !avatar?.includes(k)) || ""] ? (
                <ImageUploadProgress upload={uploads[Object.keys(uploads).reverse()[0]]} size={90} />
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceRaised }]}>
                  <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
                  <Text style={[styles.avatarPlaceholderText, { color: colors.textTertiary }]}>
                    ADD PHOTO
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {avatar && (
              <Pressable onPress={() => setAvatar(null)}>
                <Text style={[styles.removeText, { color: colors.accentRed }]}>REMOVE</Text>
              </Pressable>
            )}
          </View>

          {/* ── Fields ── */}
          {renderField("Full Name", "name", "John Doe")}
          {renderField("Username", "username", "johndoe")}
          {renderField("Phone", "phoneNumber", "+1 234 567 8900", {
            required: false,
            keyboardType: "phone-pad",
          })}

          {/* Date of Birth */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary }]}>BIRTHDAY</Text>
            <Pressable
              style={[styles.underlineField, { borderBottomColor: colors.text }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.input, { color: formData.dateOfBirth ? colors.text : colors.textTertiary, flex: 1 }]}>
                {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "Select date"}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) handleChange("dateOfBirth", date.toISOString());
              }}
            />
          )}

          {renderField("Email", "email", "hello@example.com", { keyboardType: "email-address" })}
          {renderField("Password", "password", "••••••••", {
            secure: true,
            showToggle: true,
            toggleState: showPassword,
            onToggle: () => setShowPassword(!showPassword),
          })}
          {renderField("Confirm Password", "confirmPassword", "••••••••", {
            secure: true,
            showToggle: true,
            toggleState: showConfirm,
            onToggle: () => setShowConfirm(!showConfirm),
          })}

          {/* Brand Owner note */}
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            WANT TO SELL? EMAIL admin@localbrands.com TO BECOME A BRAND OWNER.
          </Text>

          {/* REGISTER button */}
          <Pressable
            style={[styles.button, { backgroundColor: colors.text }, isAnyLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isAnyLoading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>REGISTER</Text>
            )}
          </Pressable>

          {/* ── OR divider ── */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Social buttons ── */}
          <View style={styles.socialRow}>
            <Pressable
              style={[styles.socialButton, { borderColor: colors.text }, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogle}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={14} color="#DB4437" />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>GOOGLE</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.socialButton, { borderColor: colors.text }, facebookLoading && { opacity: 0.7 }]}
              onPress={handleFacebook}
              disabled={isAnyLoading}
            >
              {facebookLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>FACEBOOK</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              HAVE AN ACCOUNT ?{"  "}
            </Text>
            <Pressable onPress={() => !isAnyLoading && router.push("/auth/login")} disabled={isAnyLoading}>
              <Text style={[styles.footerLink, { color: colors.text }]}>SIGN IN</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 40,
  },

  // ── Back ──────────────────────────────────
  backRow: { marginBottom: 32 },
  backText: { fontSize: 9, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── Wordmark ──────────────────────────────
  wordmarkBlock: {
    alignItems: "center",
    marginBottom: 48,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 30,
  },
  wordmarkDivider: {
    width: 28,
    height: 1,
    marginTop: 12,
    marginBottom: 14,
  },
  wordmarkSub: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 28,
  },

  // ── Avatar ────────────────────────────────
  avatarSection: { alignItems: "center", marginBottom: 32, gap: 10 },
  avatarBtn: {
    width: 88,
    height: 88,
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 6 },
  avatarPlaceholderText: { fontSize: 8, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },
  removeText: { fontSize: 9, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── Fields ────────────────────────────────
  fieldGroup: { width: "100%", marginBottom: 24 },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  underlineField: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  input: { fontSize: 14, fontWeight: "500", paddingVertical: 0 },
  eyeBtn: { paddingLeft: 8 },
  showHide: { fontSize: 9, fontWeight: "500", letterSpacing: 2, textTransform: "uppercase" },
  errorText: { fontSize: 9, fontWeight: "500", letterSpacing: 1, marginTop: 6, textTransform: "uppercase" },

  // ── Note ──────────────────────────────────
  noteText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    lineHeight: 16,
    marginBottom: 28,
  },

  // ── Primary button ────────────────────────
  button: {
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  buttonText: { fontSize: 11, fontWeight: "600", letterSpacing: 2, textTransform: "uppercase" },

  // ── OR divider ────────────────────────────
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 22,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 9, letterSpacing: 2.5, fontWeight: "500" },

  // ── Social buttons ────────────────────────
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socialButtonText: { fontSize: 10, fontWeight: "600", letterSpacing: 2 },

  // ── Footer ────────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 30,
  },
  footerText: { fontSize: 10, fontWeight: "500", letterSpacing: 1 },
  footerLink: { fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
});

export default RegisterScreen;
