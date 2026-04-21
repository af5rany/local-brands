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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { AddressType } from "@/types/address";
import { useThemeColors } from "@/hooks/useThemeColor";

const EditAddressScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams();
  const { token, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    type: AddressType.SHIPPING,
    isDefault: false,
  });

  useEffect(() => {
    fetchAddress();
  }, [id]);

  const fetchAddress = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch address");
      const data = await res.json();
      setFormData({
        fullName: data.fullName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || "",
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        phone: data.phone || "",
        type: data.type,
        isDefault: data.isDefault,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (
      !formData.fullName ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.zipCode
    ) {
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${getApiUrl()}/addresses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update address");
      }
      Alert.alert("Success", "Address updated!", [
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
      setSaving(false);
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

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Edit Address</Text>
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
              "John Doe",
            )}
            {renderInput(
              "Address Line 1",
              formData.addressLine1,
              "addressLine1",
              "123 Main St",
            )}
            {renderInput(
              "Address Line 2",
              formData.addressLine2,
              "addressLine2",
              "Apt 4B",
              false,
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput("City", formData.city, "city", "New York")}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("State", formData.state, "state", "NY")}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput(
                  "Zip Code",
                  formData.zipCode,
                  "zipCode",
                  "10001",
                  true,
                  "number-pad",
                )}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("Country", formData.country, "country", "USA")}
              </View>
            </View>

            {renderInput(
              "Phone",
              formData.phone,
              "phone",
              "+1 234 567 890",
              false,
              "phone-pad",
            )}

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
            saving && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={saving}
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
              Update Address
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditAddressScreen;
