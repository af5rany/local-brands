import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const colors = useThemeColors();

  if (totalPages <= 1) return null;

  // Build visible page numbers: always show first, last, and neighbors of current
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];
    const showStart = currentPage > 3;
    const showEnd = currentPage < totalPages - 2;

    pages.push(1);

    if (showStart) pages.push("ellipsis");

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (showEnd) pages.push("ellipsis");

    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Previous Arrow */}
      <TouchableOpacity
        style={[
          styles.arrowButton,
          {
            backgroundColor: isFirst
              ? colors.surfaceRaised
              : colors.primarySoft,
          },
        ]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={isFirst ? colors.textTertiary : colors.primary}
        />
      </TouchableOpacity>

      {/* Page Number Pills */}
      <View style={styles.pageNumbers}>
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis") {
            return (
              <View key={`ellipsis-${index}`} style={styles.ellipsis}>
                <Text
                  style={[styles.ellipsisText, { color: colors.textTertiary }]}
                >
                  ···
                </Text>
              </View>
            );
          }

          const isActive = page === currentPage;
          return (
            <TouchableOpacity
              key={page}
              style={[
                styles.pageButton,
                isActive
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: "transparent" },
              ]}
              onPress={() => onPageChange(page)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pageText,
                  isActive
                    ? { color: colors.primaryForeground, fontWeight: "700" }
                    : { color: colors.textSecondary, fontWeight: "500" },
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Arrow */}
      <TouchableOpacity
        style={[
          styles.arrowButton,
          {
            backgroundColor: isLast ? colors.surfaceRaised : colors.primarySoft,
          },
        ]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isLast ? colors.textTertiary : colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    borderRadius: 0,
    borderWidth: 1,
    gap: 6,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginHorizontal: 8,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  pageText: {
    fontSize: 14,
  },
  ellipsis: {
    width: 28,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  ellipsisText: {
    fontSize: 14,
    letterSpacing: 2,
  },
});

export default Pagination;
