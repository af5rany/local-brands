import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProductType, Gender, Season, ProductStatus } from "@/types/enums";
import { useThemeColors } from "@/hooks/useThemeColor";

export interface ProductFilters {
  search: string;
  productType?: ProductType;
  gender?: Gender;
  season?: Season;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
}

interface ProductFilterModalProps {
  visible: boolean;
  filters: ProductFilters;
  onFiltersChange: (key: keyof ProductFilters, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  isOwnerOrAdmin?: boolean;
}

const filterOptions = {
  productTypes: Object.values(ProductType),
  genders: Object.values(Gender),
  seasons: Object.values(Season),
  statuses: Object.values(ProductStatus),
};

export const ProductFilterModal: React.FC<ProductFilterModalProps> = ({
  visible,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  onClose,
  isOwnerOrAdmin = false,
}) => {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: colors.surfaceOverlay },
        ]}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          {/* Modal Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Filters
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Product Type */}
            <View
              style={[
                styles.filterSection,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.textTertiary },
                ]}
              >
                Product Type
              </Text>
              {filterOptions.productTypes.map((type, i) => {
                const active = filters.productType === type;
                const isLast = i === filterOptions.productTypes.length - 1;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      onFiltersChange("productType", active ? undefined : type)
                    }
                    activeOpacity={0.5}
                  >
                    <Text
                      style={[
                        styles.filterRowLabel,
                        {
                          color: colors.text,
                          fontWeight: active ? "700" : "400",
                        },
                      ]}
                    >
                      {type}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gender */}
            <View
              style={[
                styles.filterSection,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.textTertiary },
                ]}
              >
                Gender
              </Text>
              {filterOptions.genders.map((gender, i) => {
                const active = filters.gender === gender;
                const isLast = i === filterOptions.genders.length - 1;
                return (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.filterRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      onFiltersChange("gender", active ? undefined : gender)
                    }
                    activeOpacity={0.5}
                  >
                    <Text
                      style={[
                        styles.filterRowLabel,
                        {
                          color: colors.text,
                          fontWeight: active ? "700" : "400",
                        },
                      ]}
                    >
                      {gender}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Season */}
            <View
              style={[
                styles.filterSection,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.textTertiary },
                ]}
              >
                Season
              </Text>
              {filterOptions.seasons.map((season, i) => {
                const active = filters.season === season;
                const isLast = i === filterOptions.seasons.length - 1;
                return (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.filterRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      onFiltersChange("season", active ? undefined : season)
                    }
                    activeOpacity={0.5}
                  >
                    <Text
                      style={[
                        styles.filterRowLabel,
                        {
                          color: colors.text,
                          fontWeight: active ? "700" : "400",
                        },
                      ]}
                    >
                      {season}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            {isOwnerOrAdmin && (
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.border },
                ]}
              >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.textTertiary },
                ]}
              >
                Status
              </Text>
              {filterOptions.statuses.map((status, i) => {
                const active = filters.status === status;
                const isLast = i === filterOptions.statuses.length - 1;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() =>
                      onFiltersChange("status", active ? undefined : status)
                    }
                    activeOpacity={0.5}
                  >
                    <Text
                      style={[
                        styles.filterRowLabel,
                        {
                          color: colors.text,
                          fontWeight: active ? "700" : "400",
                        },
                      ]}
                    >
                      {status}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={16} color={colors.text} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            )}

            {/* Price Range */}
            <View
              style={[
                styles.filterSection,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: colors.textTertiary },
                ]}
              >
                Price Range
              </Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputGroup}>
                  <Text
                    style={[
                      styles.priceLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    MIN
                  </Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        borderBottomColor: colors.text,
                        color: colors.text,
                      },
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={filters.minPrice?.toString() || ""}
                    onChangeText={(text) =>
                      onFiltersChange(
                        "minPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                  />
                </View>
                <View
                  style={[
                    styles.priceSeparator,
                    { backgroundColor: colors.border },
                  ]}
                />
                <View style={styles.priceInputGroup}>
                  <Text
                    style={[
                      styles.priceLabel,
                      { color: colors.textTertiary },
                    ]}
                  >
                    MAX
                  </Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        borderBottomColor: colors.text,
                        color: colors.text,
                      },
                    ]}
                    placeholder="∞"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={filters.maxPrice?.toString() || ""}
                    onChangeText={(text) =>
                      onFiltersChange(
                        "maxPrice",
                        text ? parseFloat(text) : undefined
                      )
                    }
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[styles.modalFooter, { borderTopColor: colors.border }]}
          >
            <TouchableOpacity
              style={[
                styles.modalResetBtn,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
              onPress={onReset}
            >
              <Text style={[styles.modalResetText, { color: colors.text }]}>
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalApplyBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={onApply}
            >
              <Text
                style={[
                  styles.modalApplyText,
                  { color: colors.primaryForeground },
                ]}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    // letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  filterRowLabel: {
    fontSize: 13,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInputGroup: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "700",
    // letterSpacing: 1,
    marginBottom: 8,
  },
  priceInput: {
    borderBottomWidth: 1,
    fontSize: 16,
    paddingVertical: 8,
    fontWeight: "500",
  },
  priceSeparator: {
    width: 12,
    height: 1,
    marginHorizontal: 16,
    marginTop: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    paddingBottom: 32, // Safe area for bottom
  },
  modalResetBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 1,
  },
  modalResetText: {
    fontSize: 12,
    fontWeight: "700",
    // letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modalApplyBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 0,
  },
  modalApplyText: {
    fontSize: 12,
    fontWeight: "700",
    // letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
