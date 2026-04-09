import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

interface FilterChipsProps {
  onOpenFilters: () => void;
  activeFilters: {
    categories: string[];
    brands: string[];
    sortOrder: "ASC" | "DESC";
  };
  filterLabels: {
    brands?: Record<string, string>;
  };
  onClearFilter: (type: "category" | "brand" | "sort") => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  onOpenFilters,
  activeFilters,
  filterLabels,
  onClearFilter,
}) => {
  const colors = useThemeColors();

  const { categories, brands, sortOrder } = activeFilters;
  const brandMap = filterLabels.brands ?? {};

  const totalActive =
    (categories.length > 0 ? 1 : 0) +
    (brands.length > 0 ? 1 : 0) +
    (sortOrder !== "DESC" ? 1 : 0);

  const getCategoryLabel = () => {
    if (categories.length === 1) return `${categories[0]}`;
    return `Category (${categories.length})`;
  };

  const getBrandLabel = () => {
    if (brands.length === 1) return `${brandMap[brands[0]] ?? brands[0]}`;
    return `Brand (${brands.length})`;
  };

  const getSortLabel = () =>
    sortOrder === "ASC" ? "Oldest First" : "Newest First";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filters button — always visible */}
        <TouchableOpacity
          style={[
            styles.filtersButton,
            {
              backgroundColor:
                totalActive > 0
                  ? colors.chipActiveBackground
                  : colors.surfaceRaised,
              borderColor:
                totalActive > 0 ? colors.chipActiveBackground : colors.border,
            },
          ]}
          onPress={onOpenFilters}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={totalActive > 0 ? colors.chipActiveText : colors.text}
          />
          <Text
            style={[
              styles.filtersLabel,
              {
                color:
                  totalActive > 0 ? colors.chipActiveText : colors.text,
              },
              totalActive > 0 && styles.boldText,
            ]}
          >
            Filters
          </Text>
          {totalActive > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.chipActiveText },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: colors.chipActiveBackground },
                ]}
              >
                {totalActive}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active filter tags */}
        {categories.length > 0 && (
          <View
            style={[
              styles.activeTag,
              { backgroundColor: colors.primarySoft, borderColor: colors.primary },
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={colors.primary}
              style={styles.tagIcon}
            />
            <Text
              style={[styles.tagLabel, { color: colors.primary }]}
              numberOfLines={1}
            >
              {getCategoryLabel()}
            </Text>
            <TouchableOpacity
              onPress={() => onClearFilter("category")}
              style={styles.tagClose}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {brands.length > 0 && (
          <View
            style={[
              styles.activeTag,
              { backgroundColor: colors.primarySoft, borderColor: colors.primary },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={13}
              color={colors.primary}
              style={styles.tagIcon}
            />
            <Text
              style={[styles.tagLabel, { color: colors.primary }]}
              numberOfLines={1}
            >
              {getBrandLabel()}
            </Text>
            <TouchableOpacity
              onPress={() => onClearFilter("brand")}
              style={styles.tagClose}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {sortOrder !== "DESC" && (
          <View
            style={[
              styles.activeTag,
              { backgroundColor: colors.primarySoft, borderColor: colors.primary },
            ]}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={13}
              color={colors.primary}
              style={styles.tagIcon}
            />
            <Text
              style={[styles.tagLabel, { color: colors.primary }]}
              numberOfLines={1}
            >
              {getSortLabel()}
            </Text>
            <TouchableOpacity
              onPress={() => onClearFilter("sort")}
              style={styles.tagClose}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  // Filters button
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 0,
    borderWidth: 1,
    gap: 6,
  },
  filtersLabel: { fontSize: 13, fontWeight: "500" },
  boldText: { fontWeight: "700" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  // Active filter tags
  activeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: 0,
    borderWidth: 1.5,
    maxWidth: 180,
  },
  tagIcon: { marginRight: 5 },
  tagLabel: { fontSize: 13, fontWeight: "600", flex: 1, flexShrink: 1 },
  tagClose: { marginLeft: 4, padding: 2 },
});

export default FilterChips;
