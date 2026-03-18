import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { Address } from "@/types/address";
import { useThemeColors } from "@/hooks/useThemeColor";

const ShippingAddressesScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, refreshUser } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch(`${getApiUrl()}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch addresses");
      const data = await response.json();
      setAddresses(data);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Refresh addresses every time screen gains focus (e.g. after adding a new one)
  useFocusEffect(
    useCallback(() => {
      fetchAddresses(addresses.length === 0);
    }, [fetchAddresses]),
  );

  const handleDelete = (id: number) => {
    Alert.alert("Delete Address", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${getApiUrl()}/addresses/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete address");
            setAddresses(addresses.filter((a) => a.id !== id));
            refreshUser();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/addresses/${id}/default`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to set default");
      await fetchAddresses();
      await refreshUser();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: item.isDefault ? colors.primary : colors.borderLight,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={[styles.fullName, { color: colors.text }]}>
            {item.fullName}
          </Text>
          {item.isDefault && (
            <View
              style={[
                styles.defaultBadge,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text style={[styles.defaultText, { color: colors.primary }]}>
                DEFAULT
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Address Lines */}
      <Text style={[styles.addressText, { color: colors.textSecondary }]}>
        {item.addressLine1}
      </Text>
      {item.addressLine2 ? (
        <Text style={[styles.addressText, { color: colors.textSecondary }]}>
          {item.addressLine2}
        </Text>
      ) : null}
      <Text style={[styles.addressText, { color: colors.textSecondary }]}>
        {item.city}, {item.state} {item.zipCode}
      </Text>
      <Text style={[styles.addressText, { color: colors.textSecondary }]}>
        {item.country}
      </Text>

      {item.phone && (
        <View style={styles.phoneRow}>
          <Ionicons name="call-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.phoneText, { color: colors.textTertiary }]}>
            {item.phone}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View
        style={[styles.cardActions, { borderTopColor: colors.borderLight }]}
      >
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => router.push(`/profile/addresses/${item.id}`)}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>

        {!item.isDefault && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surfaceRaised },
            ]}
            onPress={() => handleSetDefault(item.id)}
          >
            <Ionicons
              name="star-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              Set Default
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
        <Text style={[styles.title, { color: colors.text }]}>
          Shipping Addresses
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchAddresses();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={40}
                  color={colors.textTertiary}
                />
              </View>
              <Text
                style={[styles.emptyTitle, { color: colors.textSecondary }]}
              >
                No Addresses Found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textTertiary }]}
              >
                Add a shipping address to get started
              </Text>
            </View>
          }
        />
      )}

      {/* Footer */}
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
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/profile/addresses/new")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
          <Text
            style={[styles.addButtonText, { color: colors.primaryForeground }]}
          >
            Add New Address
          </Text>
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700" },
  listContent: { padding: 16, paddingBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  fullName: { fontSize: 16, fontWeight: "700" },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addressText: { fontSize: 14, lineHeight: 21 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  phoneText: { fontSize: 13 },
  cardActions: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  addButtonText: { fontSize: 16, fontWeight: "700" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
});

export default ShippingAddressesScreen;
