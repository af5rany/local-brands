import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";
import { Filters, PaginatedResult, SortOptions } from "@/types/filters";
import { Brand } from "@/types/brand";
import { BrandStatus } from "@/types/enums";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";

const BrandsScreen = () => {
  const { token, user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const userRole = user?.role || user?.userRole;
  const isAdmin = userRole === "admin";

  const { isConnected } = useNetwork();
  const [brandsData, setBrandsData] = useState<PaginatedResult<Brand> | null>(null);
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

  // Follow state (customer feature)
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const router = useRouter();

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

      const endpoint = isAdmin ? "/brands/admin" : "/brands";
      return `${getApiUrl()}${endpoint}?${params.toString()}`;
    },
    [searchQuery, filters, sortOptions, isAdmin],
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
    [buildApiUrl, token],
  );

  // Fetch followed brands (customer feature)
  const fetchFollowedBrands = useCallback(async () => {
    if (!token || isAdmin) { setFollowedIds(new Set()); return; }
    try {
      const response = await fetch(`${getApiUrl()}/brands/user/followed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFollowedIds(new Set(data.map((b: any) => b.id)));
      }
    } catch (error) {
      console.error("Error fetching followed brands:", error);
    }
  }, [token, isAdmin]);

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

  useEffect(() => {
    fetchFollowedBrands();
  }, [fetchFollowedBrands]);

  useFocusEffect(
    useCallback(() => {
      fetchBrands(1, false);
      fetchFollowedBrands();
    }, [fetchBrands, fetchFollowedBrands])
  );

  // Toggle follow (customer feature)
  const toggleFollow = async (brandId: number) => {
    if (!token) { router.push("/auth/login"); return; }
    setTogglingId(brandId);
    const wasFollowing = followedIds.has(brandId);
    try {
      const response = await fetch(`${getApiUrl()}/brands/follow/${brandId}`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          wasFollowing ? next.delete(brandId) : next.add(brandId);
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setTogglingId(null);
    }
  };

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

  const hasActiveFilters = !!(filters.location || filters.ownerId || filters.status);

  // ── renderHeader ───────────────────────────────────
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>BRANDS</Text>
          {brandsData && (
            <Text style={styles.headerCount}>
              {brandsData.total} {brandsData.total === 1 ? "BRAND" : "BRANDS"}
            </Text>
          )}
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/brands/create")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={styles.createButtonText}>NEW BRAND</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── renderSearchBar ────────────────────────────────
  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH BRANDS..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── renderControls ─────────────────────────────────
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {isAdmin && (
        <TouchableOpacity
          style={[styles.controlBtn, hasActiveFilters && styles.controlBtnActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={hasActiveFilters ? colors.primaryForeground : colors.text}
          />
          <Text
            style={[
              styles.controlBtnText,
              hasActiveFilters && styles.controlBtnTextActive,
            ]}
          >
            FILTER
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.controlBtn}
        onPress={() => setShowSort(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="swap-vertical-outline" size={14} color={colors.text} />
        <Text style={styles.controlBtnText}>SORT</Text>
      </TouchableOpacity>
      {(searchQuery || hasActiveFilters) && (
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={clearFilters}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={14} color={colors.danger} />
          <Text style={[styles.controlBtnText, { color: colors.danger }]}>
            CLEAR
          </Text>
        </TouchableOpacity>
      )}
      {brandsData && (
        <Text style={styles.resultsCount}>{brandsData.total} BRANDS</Text>
      )}
    </View>
  );

  // ── renderBrand ────────────────────────────────────
  const renderBrand = ({ item }: { item: Brand }) => {
    const isActive = item.status === BrandStatus.ACTIVE;
    const isFollowed = followedIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.brandContainer}
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
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>
                  {item.name?.charAt(0)?.toUpperCase() || "B"}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.brandInfo}>
            <View style={styles.nameStatusRow}>
              <Text style={styles.brandName} numberOfLines={1}>
                {item.name?.toUpperCase()}
              </Text>
              {isAdmin && (
                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isActive ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.brandDescription} numberOfLines={1}>
              {item.description || "No description"}
            </Text>

            {isAdmin && (
              <View style={styles.metaRow}>
                {item.location && (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="cube-outline" size={11} color={colors.textTertiary} />
                  <Text style={styles.metaText}>
                    {item?.products?.length || 0}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Follow button for customers, arrow for admin */}
          {!isAdmin ? (
            <TouchableOpacity
              style={styles.followButton}
              onPress={() => toggleFollow(item.id)}
              disabled={togglingId === item.id}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {togglingId === item.id ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons
                  name={isFollowed ? "heart" : "heart-outline"}
                  size={20}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.arrowText}>→</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── renderFilterModal ──────────────────────────────
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalActionCancel}>CANCEL</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>FILTERS</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalActionDone}>DONE</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>LOCATION</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Enter location..."
              placeholderTextColor={colors.textTertiary}
              value={filters.location}
              onChangeText={(text) => handleFilterChange("location", text)}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>OWNER ID</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Enter owner ID..."
              placeholderTextColor={colors.textTertiary}
              value={filters.ownerId}
              onChangeText={(text) => handleFilterChange("ownerId", text)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>STATUS</Text>
            <View style={styles.statusChips}>
              {Object.values(BrandStatus).map((s) => {
                const isSelected = filters.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      isSelected && styles.statusChipActive,
                    ]}
                    onPress={() =>
                      handleFilterChange("status", isSelected ? "" : s)
                    }
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isSelected && styles.statusChipTextActive,
                      ]}
                    >
                      {s.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // ── renderSortModal ────────────────────────────────
  const renderSortModal = () => (
    <Modal
      visible={showSort}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSort(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSort(false)}>
            <Text style={styles.modalActionCancel}>CANCEL</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>SORT BY</Text>
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
                style={styles.sortOption}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "ASC")
                }
              >
                <Text style={styles.sortOptionText}>{option.label} (A-Z)</Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "ASC" && (
                    <Ionicons name="checkmark" size={18} color={colors.text} />
                  )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() =>
                  handleSortChange(option.key as SortOptions["sortBy"], "DESC")
                }
              >
                <Text style={styles.sortOptionText}>{option.label} (Z-A)</Text>
                {sortOptions.sortBy === option.key &&
                  sortOptions.sortOrder === "DESC" && (
                    <Ionicons name="checkmark" size={18} color={colors.text} />
                  )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  // ── renderPaginationInfo ───────────────────────────
  const renderPaginationInfo = () => {
    if (!brandsData) return null;
    return (
      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>
          {brandsData.items.length} OF {brandsData.total}
        </Text>
      </View>
    );
  };

  // ── renderLoadMore ─────────────────────────────────
  const renderLoadMore = () => {
    if (!brandsData?.hasNextPage) return null;
    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.loadMoreText}>LOAD MORE</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ── renderEmptyState ───────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {searchQuery || filters.location || filters.ownerId
          ? "NO RESULTS"
          : "NO BRANDS YET"}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || filters.location || filters.ownerId
          ? "Try adjusting your search or filters"
          : "Create your first brand to get started"}
      </Text>
      {(searchQuery ||
        filters.location ||
        filters.ownerId ||
        filters.status) && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>CLEAR FILTERS</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Loading / Error states ─────────────────────────
  if (loading && !brandsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.text} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error && !brandsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>SOMETHING WENT WRONG</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchBrands(1, false)}
        >
          <Text style={styles.retryButtonText}>TRY AGAIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isConnected && !brandsData) {
    return (
      <View style={styles.container}>
        <OfflinePlaceholder onRetry={() => fetchBrands(1)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <View style={{ height: 100 }} />
          </>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {isAdmin && renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },

  // ── Header ────────────────────────────────────────
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  header: {
    fontFamily: undefined,
    fontSize: 28,
    color: colors.text,
    // letterSpacing: 2,
  },
  headerCount: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    // letterSpacing: 2,
  },

  // ── Create button ─────────────────────────────────
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  createButtonText: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.primaryForeground,
    // letterSpacing: 1,
  },

  // ── Search ────────────────────────────────────────
  searchSection: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 2,
    paddingVertical: 0,
  },

  // ── Controls ──────────────────────────────────────
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  controlBtnActive: {
    backgroundColor: colors.primary,
  },
  controlBtnText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    // letterSpacing: 1,
  },
  controlBtnTextActive: {
    color: colors.primaryForeground,
  },
  resultsCount: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    // letterSpacing: 2,
    marginLeft: "auto",
  },

  // ── Brand card ────────────────────────────────────
  brandContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    fontFamily: undefined,
    fontSize: 20,
    color: colors.text,
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
    fontFamily: undefined,
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeActive: {
    backgroundColor: colors.primary,
  },
  statusBadgeInactive: {
    backgroundColor: colors.surfaceRaised,
  },
  statusText: {
    fontFamily: undefined,
    fontSize: 9,
    // letterSpacing: 1,
  },
  statusTextActive: {
    color: colors.primaryForeground,
  },
  statusTextInactive: {
    color: colors.textSecondary,
  },
  brandDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
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
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    // letterSpacing: 0.5,
  },
  arrowText: {
    fontFamily: undefined,
    fontSize: 16,
    color: colors.text,
  },
  followButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Pagination ────────────────────────────────────
  paginationInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  paginationText: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    // letterSpacing: 2,
  },

  // ── Load more ─────────────────────────────────────
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loadMoreText: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 2,
  },

  // ── Modal ─────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  modalTitle: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 2,
  },
  modalActionCancel: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.textSecondary,
    // letterSpacing: 1,
  },
  modalActionDone: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Filters ───────────────────────────────────────
  filterSection: {
    marginTop: 28,
  },
  filterLabel: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    // letterSpacing: 2,
    marginBottom: 10,
  },
  filterInput: {
    fontFamily: undefined,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // ── Sort ──────────────────────────────────────────
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortOptionText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Status chips ──────────────────────────────────
  statusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
  },
  statusChipText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    // letterSpacing: 1,
  },
  statusChipTextActive: {
    color: colors.primaryForeground,
  },

  // ── States ────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: undefined,
    marginTop: 12,
    fontSize: 11,
    color: colors.textSecondary,
    // letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontFamily: undefined,
    fontSize: 16,
    color: colors.text,
    // letterSpacing: 2,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontFamily: undefined,
    fontSize: 16,
    color: colors.text,
    // letterSpacing: 2,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  clearButtonText: {
    fontFamily: undefined,
    fontSize: 11,
    color: colors.text,
    // letterSpacing: 2,
  },
});

export default BrandsScreen;
