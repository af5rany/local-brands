import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { AddressType } from "@/types/address";
import { useThemeColors } from "@/hooks/useThemeColor";

const NewAddressScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Egypt",
    phone: "",
    type: AddressType.SHIPPING,
    isDefault: false,
  });

  const handleSave = async () => {
    if (
      !formData.fullName ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode ||
      !formData.phone
    ) {
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save address");
      }

      Alert.alert("Success", "Address added!", [
        {
          text: "OK",
          onPress: () => {
            refreshUser();
            router.replace("/profile/addresses");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    key: string,
    placeholder: string,
    required = true,
    keyboardType: any = "default",
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
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
        value={value}
        onChangeText={(text) => setFormData({ ...formData, [key]: text })}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <View
            style={[
              styles.backCircle,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            {renderInput(
              "Full Name",
              formData.fullName,
              "fullName",
              "Ahmed Mohamed",
            )}
            {renderInput(
              "Phone Number",
              formData.phone,
              "phone",
              "+20 10 1234 5678",
              true,
              "phone-pad",
            )}
            {renderInput(
              "Address Line 1",
              formData.addressLine1,
              "addressLine1",
              "15 Tahrir Street",
            )}
            {renderInput(
              "Address Line 2",
              formData.addressLine2,
              "addressLine2",
              "Building 3, Floor 2",
              false,
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput("City", formData.city, "city", "Cairo")}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput(
                  "Governorate",
                  formData.state,
                  "state",
                  "Cairo",
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput(
                  "Postal Code",
                  formData.zipCode,
                  "zipCode",
                  "11511",
                  true,
                  "number-pad",
                )}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("Country", formData.country, "country", "Egypt")}
              </View>
            </View>

            {/* Default Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() =>
                setFormData({ ...formData, isDefault: !formData.isDefault })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: formData.isDefault
                      ? colors.primary
                      : colors.border,
                    backgroundColor: formData.isDefault
                      ? colors.primary
                      : "transparent",
                  },
                ]}
              >
                {formData.isDefault && (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={colors.primaryForeground}
                  />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Set as default shipping address
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                { color: colors.primaryForeground },
              ]}
            >
              Save Address
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  formCard: {
    borderRadius: 0,
    padding: 20,
    borderWidth: 1,
    gap: 18,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13, fontWeight: "600", // letterSpacing: 0.2
  },
  input: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
  },
  row: { flexDirection: "row" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 0,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: { fontSize: 15, fontWeight: "500" },
  footer: { padding: 16, borderTopWidth: 1 },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 0,
    alignItems: "center",
  },
  saveButtonText: { fontSize: 16, fontWeight: "700" },
});

export default NewAddressScreen;
