import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";
import { useColorScheme } from "react-native";
import { Filters, PaginatedResult, SortOptions } from "@/types/filters";
import { Brand } from "@/types/brand";
import { BrandStatus } from "@/types/enums";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

const BrandsListScreen = () => {
  const { token, user } = useAuth();
  const userRole = user?.role || user?.userRole;
  const [brandsData, setBrandsData] = useState<PaginatedResult<Brand> | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({
    location: "",
    ownerId: "",
    status: "",
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // UI States
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSort, setShowSort] = useState<boolean>(false);

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // B&W theme colors
  const backgroundColor = isDark ? "#000000" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const secondaryTextColor = isDark ? "#8E8E93" : "#6B6B6B";
  const cardBackground = isDark ? "#1C1C1E" : "#FFFFFF";
  const borderColor = isDark ? "#2C2C2E" : "#E5E5E5";
  const mutedBg = isDark ? "#1C1C1E" : "#F5F5F5";

  // Build API URL with query parameters
  const buildApiUrl = useCallback(
    (page: number = 1) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(filters.location && { location: filters.location }),
        ...(filters.ownerId && { ownerId: filters.ownerId }),
        ...(filters.status && { status: filters.status }),
        sortBy: sortOptions.sortBy,
        sortOrder: sortOptions.sortOrder,
      });

      const endpoint = userRole === "admin" ? "/brands/admin" : "/brands";
      return `${getApiUrl()}${endpoint}?${params.toString()}`;
    },
    [searchQuery, filters, sortOptions, userRole],
  );

  // Fetch brands with pagination
  const fetchBrands = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(page === 1);
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(buildApiUrl(page), {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch brands");
        }

        const data: PaginatedResult<Brand> = await response.json();

        if (append) {
          setBrandsData((prev) =>
            prev
              ? {
                  ...data,
                  items: [...prev.items, ...data.items],
                }
              : data,
          );
        } else {
          setBrandsData(data);
        }

        setError("");
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An error occurred");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [buildApiUrl],
  );

  // Debounced search
  const debouncedFetch = useMemo(
    () => debounce((page: number = 1) => fetchBrands(page, false), 300),
    [fetchBrands],
  );

  // Initial fetch and search/filter changes
  useEffect(() => {
    debouncedFetch(1);
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle sort changes
  const handleSortChange = (
    sortBy: SortOptions["sortBy"],
    sortOrder: SortOptions["sortOrder"],
  ) => {
    setSortOptions({ sortBy, sortOrder });
    setShowSort(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({ location: "", ownerId: "", status: "" });
    setSortOptions({ sortBy: "createdAt", sortOrder: "DESC" });
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    fetchBrands(1, false);
  };

  // Load more data
  const loadMore = () => {
    if (brandsData && brandsData.hasNextPage && !loadingMore) {
      fetchBrands(brandsData.page + 1, true);
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return "DRAFT";
    return status.toUpperCase();
  };

  // Render brand item
  const renderBrand = ({ item }: { item: Brand; index: number }) => {
    const isActive = item.status === BrandStatus.ACTIVE;

    return (
      <TouchableOpacity
        style={[styles.brandContainer, { borderBottomColor: borderColor }]}
        onPress={() => router.push(`/brands/${item.id}`)}
        activeOpacity={0.6}
      >
        <View style={styles.brandRow}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {item.logo ? (
              <Image
                style={styles.brandLogo}
                source={{ uri: item.logo }}
                defaultSource={require("@/assets/images/placeholder-logo.png")}
              />
            ) : (
              <View
                style={[
                  styles.logoPlaceholder,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F0F0F0" },
                ]}
              >
                <Text style={[styles.logoInitial, { color: textColor }]}>
                  {item.name?.charAt(0)?.toUpperCase() || "B"}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.brandInfo}>
            <View style={styles.nameStatusRow}>
              <Text
                style={[styles.brandName, { color: textColor }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? "#FFFFFF"
                        : "#000000"
                      : mutedBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isActive
                        ? isDark
                          ? "#000000"
                          : "#FFFFFF"
                        : secondaryTextColor,
                    },
                  ]}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.brandDescription, { color: secondaryTextColor }]}
              numberOfLines={1}
            >
              {item.description || "No description"}
            </Text>

            <View style={styles.metaRow}>
              {item.location && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="location-outline"
                    size={11}
                    color={secondaryTextColor}
                  />
                  <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                    {item.location}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Ionicons
                  name="cube-outline"
                  size={11}
                  color={secondaryTextColor}
                />
                <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                  {item?.products?.length || 0}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaText, { color: secondaryTextColor }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Arrow */}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={secondaryTextColor}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Render search bar
  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        { borderBottomColor: borderColor },
      ]}
    >
      <Ionicons
        name="search"
        size={16}
        color={secondaryTextColor}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: textColor }]}
        placeholder="SEARCH BRANDS"
        placeholderTextColor={secondaryTextColor}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
        autoCapitalize="none"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close" size={16} color={secondaryTextColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render filter and sort buttons
  const renderControls = () => {
    const hasActiveFilters =
      filters.location || filters.ownerId || filters.status;

    return (
      <View style={[styles.controlsContainer, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={14} color={textColor} />
          <Text style={[styles.controlButtonText, { color: textColor }]}>
            FILTER
          </Text>
          {hasActiveFilters && (
            <View style={[styles.filterDot, { backgroundColor: textColor }]} />
          )}
        </TouchableOpacity>

        <View style={[styles.controlDivider, { backgroundColor: borderColor }]} />

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSort(true)}
        >
          <Ionicons name="swap-vertical-outline" size={14} color={textColor} />
          <Text style={[styles.controlButtonText, { color: textColor }]}>
            SORT
          </Text>
        </TouchableOpacity>

        {(searchQuery || hasActiveFilters) && (
          <>
            <View style={[styles.controlDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity
              style={styles.controlButton}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={14} color="#C41E3A" />
              <Text style={[styles.controlButtonText, { color: "#C41E3A" }]}>
                CLEAR
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalAction, { color: secondaryTextColor }]}>
              CANCEL
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: textColor }]}>FILTERS</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalAction, { color: textColor }]}>DONE</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: secondaryTextColor }]}>
              LOCATION
            </Text>
            <TextInput
              style={[
                styles.filterInput,
                {
                  backgroundColor: mutedBg,
                  color: textColor,
                },
              ]}
              placeholder="Enter location..."
              placeholderTextColor={secondaryTextColor}
              value={filters.location}
              onChangeText={(text) => handleFilterChange("location", text)}
            />
          </View>

          {userRole === "admin" && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: secondaryTextColor }]}>
                OWNER ID
              </Text>
              <TextInput
                style={[
                  styles.filterInput,
                  {
                    backgroundColor: mutedBg,
                    color: textColor,
                  },
                ]}
                placeholder="Enter owner ID..."
                placeholderTextColor={secondaryTextColor}
                value={filters.ownerId}
                onChangeText={(text) => handleFilterChange("ownerId", text)}
                keyboardType="numeric"
              />
            </View>
          )}

          {userRole === "admin" && (
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: secondaryTextColor }]}>
                STATUS
              </Text>
              <View style={styles.statusChips}>
                {Object.values(BrandStatus).map((s) => {
                  const isSelected = filters.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isSelected
                            ? textColor
                            : "transparent",
                          borderColor: isSelected ? textColor : borderColor,
                        },
                      ]}
                      onPress={() =>
                        handleFilterChange("status", isSelected ? "" : s)
                      }
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          {
                            color: isSelected ? backgroundColor : textColor,
                          },
                        ]}
                      >
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render sort modal
  const renderSortModal = () => (
    <Modal
      visible={showSort}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSort(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => setShowSort(false)}>
            <Text style={[styles.modalAction, { color: secondaryTextColor }]}>
              CANCEL
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: textColor }]}>SORT BY</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {[
            { key: "name", label: "NAME" },
            { key: "createdAt", label: "CREATED" },
            { key: "updatedAt", label: "UPDATED" },
            { key: "location", label: "LOCATION" },
            { key: "productCount", label: "PRODUCTS" },
          ].map((option) => (
            <View key={option.key}>
              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: borderColor }]}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "ASC")
                }
              >
                <Text style={[styles.sortOptionText, { color: textColor }]}>
                  {option.label} (A-Z)
                </Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "ASC" && (
                    <Ionicons name="checkmark" size={18} color={textColor} />
                  )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, { borderBottomColor: borderColor }]}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "DESC")
                }
              >
                <Text style={[styles.sortOptionText, { color: textColor }]}>
                  {option.label} (Z-A)
                </Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "DESC" && (
                    <Ionicons name="checkmark" size={18} color={textColor} />
                  )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render pagination info
  const renderPaginationInfo = () => {
    if (!brandsData) return null;

    return (
      <View style={styles.paginationInfo}>
        <Text style={[styles.paginationText, { color: secondaryTextColor }]}>
          {brandsData.items.length} OF {brandsData.total}
        </Text>
      </View>
    );
  };

  // Render load more button
  const renderLoadMore = () => {
    if (!brandsData?.hasNextPage) return null;

    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { borderColor }]}
        onPress={loadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={[styles.loadMoreText, { color: textColor }]}>
            LOAD MORE
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: textColor }]}>BRANDS</Text>
          {brandsData && (
            <Text style={[styles.headerCount, { color: secondaryTextColor }]}>
              {brandsData.total} {brandsData.total === 1 ? "brand" : "brands"}
            </Text>
          )}
        </View>
        {userRole === "admin" && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: textColor }]}
            onPress={() => router.push("/brands/create")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={backgroundColor} />
            <Text style={[styles.createButtonText, { color: backgroundColor }]}>
              NEW BRAND
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: textColor }]}>
        {searchQuery || filters.location || filters.ownerId
          ? "NO RESULTS"
          : "NO BRANDS YET"}
      </Text>
      <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
        {searchQuery || filters.location || filters.ownerId
          ? "Try adjusting your search or filters"
          : "Create your first brand to get started"}
      </Text>
      {(searchQuery ||
        filters.location ||
        filters.ownerId ||
        filters.status) && (
        <TouchableOpacity
          style={[styles.clearButton, { borderColor: textColor }]}
          onPress={clearFilters}
        >
          <Text style={[styles.clearButtonText, { color: textColor }]}>
            CLEAR FILTERS
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !brandsData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="small" color={textColor} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (error && !brandsData) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <Text style={[styles.errorTitle, { color: textColor }]}>
          SOMETHING WENT WRONG
        </Text>
        <Text style={[styles.errorText, { color: secondaryTextColor }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: textColor }]}
          onPress={() => fetchBrands(1, false)}
        >
          <Text style={[styles.retryButtonText, { color: textColor }]}>
            TRY AGAIN
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={backgroundColor}
      />

      <FlatList
        data={brandsData?.items || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBrand}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderSearchBar()}
            {renderControls()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          <>
            {renderPaginationInfo()}
            {renderLoadMore()}
            <View style={{ height: 40 }} />
          </>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
      />

      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 20,
  },

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Create button
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 0,
    gap: 6,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
    paddingVertical: 0,
  },

  // Controls
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  controlButtonText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  controlDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 16,
  },
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 2,
  },

  // Brand card
  brandContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    marginRight: 14,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 0,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  brandInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  actionsColumn: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Pagination
  paginationInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  paginationText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
  },

  // Load more
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 0,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  modalAction: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Filter
  filterSection: {
    marginTop: 28,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  filterInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 0,
    fontSize: 15,
  },

  // Sort
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  // Status chips
  statusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderRadius: 0,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 0,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});

export default BrandsListScreen;
