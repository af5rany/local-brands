import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import ProductCard from "@/components/ProductCard";
import ProductManagementCard from "@/components/ProductManagementCard";
import { useThemeColors } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import {
  Gender,
  ProductType,
  Season,
  BrandStatus,
  ProductStatus,
} from "@/types/enums";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface ProductFilters {
  search: string;
  productType?: ProductType;
  gender?: Gender;
  season?: Season;
  minPrice?: number;
  maxPrice?: number;
  status?: ProductStatus;
}

interface PaginatedResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

enum SortBy {
  NAME = "name",
  PRICE = "price",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  BRAND_NAME = "brandName",
  POPULARITY = "popularity",
}

enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

interface SortOption {
  key: string;
  label: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

const STATUS_CONFIG: Record<
  BrandStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  [BrandStatus.ACTIVE]: { label: "Active", icon: "checkmark-circle" },
  [BrandStatus.DRAFT]: { label: "Draft", icon: "document-text-outline" },
  [BrandStatus.SUSPENDED]: { label: "Suspended", icon: "ban" },
  [BrandStatus.ARCHIVED]: { label: "Archived", icon: "archive-outline" },
};

const sortOptions: SortOption[] = [
  {
    key: "newest",
    label: "Newest",
    sortBy: SortBy.CREATED_AT,
    sortOrder: SortOrder.DESC,
  },
  {
    key: "oldest",
    label: "Oldest",
    sortBy: SortBy.CREATED_AT,
    sortOrder: SortOrder.ASC,
  },
  {
    key: "price_asc",
    label: "Price: Low to High",
    sortBy: SortBy.PRICE,
    sortOrder: SortOrder.ASC,
  },
  {
    key: "price_desc",
    label: "Price: High to Low",
    sortBy: SortBy.PRICE,
    sortOrder: SortOrder.DESC,
  },
  {
    key: "name_asc",
    label: "Name: A-Z",
    sortBy: SortBy.NAME,
    sortOrder: SortOrder.ASC,
  },
  {
    key: "name_desc",
    label: "Name: Z-A",
    sortBy: SortBy.NAME,
    sortOrder: SortOrder.DESC,
  },
  {
    key: "brand_name",
    label: "Brand Name",
    sortBy: SortBy.BRAND_NAME,
    sortOrder: SortOrder.ASC,
  },
  {
    key: "popularity",
    label: "Most Popular",
    sortBy: SortBy.POPULARITY,
    sortOrder: SortOrder.DESC,
  },
];

const filterOptions = {
  productTypes: Object.values(ProductType),
  genders: Object.values(Gender),
  seasons: Object.values(Season),
  statuses: Object.values(ProductStatus),
};

const BrandDetailScreen = () => {
  const router = useRouter();
  const { brandId, refresh } = useLocalSearchParams();
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const colors = useThemeColors();
  const userRole = user?.role || user?.userRole;

  const [brand, setBrand] = useState<Brand | null>(null);
  const isOwnerOrAdmin =
    userRole === "admin" ||
    (user?.id && brand?.owner?.id && user.id === brand.owner.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [filters, setFilters] = useState<ProductFilters>({ search: "" });
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.CREATED_AT);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.DESC);
  const [selectedSortOption, setSelectedSortOption] = useState(sortOptions[0]);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // ── Status color helpers ─────────────────────
  const getStatusColors = (status: BrandStatus) => {
    switch (status) {
      case BrandStatus.ACTIVE:
        return { bg: colors.successSoft, fg: colors.success };
      case BrandStatus.DRAFT:
        return { bg: colors.warningSoft, fg: colors.warning };
      case BrandStatus.SUSPENDED:
        return { bg: colors.dangerSoft, fg: colors.danger };
      case BrandStatus.ARCHIVED:
        return { bg: colors.surfaceRaised, fg: colors.textTertiary };
      default:
        return { bg: colors.surfaceRaised, fg: colors.textSecondary };
    }
  };

  // ── Data fetching ────────────────────────────
  const fetchBrandDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch brand details");
      const data = await response.json();
      setBrand(data);

      // Pre-select product status filter based on brand status
      const statusMap: Record<string, ProductStatus> = {
        [BrandStatus.ACTIVE]: ProductStatus.PUBLISHED,
        [BrandStatus.DRAFT]: ProductStatus.DRAFT,
        [BrandStatus.ARCHIVED]: ProductStatus.ARCHIVED,
      };
      const mappedStatus = statusMap[data.status];
      if (mappedStatus) {
        setFilters((prev) => ({ ...prev, status: mappedStatus }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowState = async () => {
    if (!token || !brandId) return;
    try {
      const [followRes, countRes] = await Promise.all([
        fetch(`${getApiUrl()}/brands/follow/${brandId}/check`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/brands/follow/${brandId}/count`),
      ]);
      if (followRes.ok) {
        const data = await followRes.json();
        setIsFollowing(data.following);
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setFollowerCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching follow state:", err);
    }
  };

  const toggleFollow = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setFollowLoading(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/brands/follow/${brandId}`,
        {
          method: isFollowing ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.text();
      console.log('[Follow] status:', response.status, 'body:', data);
      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeleteBrand = () => {
    Alert.alert(
      "Delete Brand",
      `Are you sure you want to delete "${brand?.name}"? This will also delete all associated products. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete brand");
              }
              Alert.alert("Success", "Brand deleted successfully");
              router.replace("/(tabs)/brands");
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const handleStatusChange = async (newStatus: BrandStatus) => {
    if (!brand || newStatus === brand.status) return;
    setChangingStatus(true);
    try {
      const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update status");
      }
      setBrand((prev) => (prev ? { ...prev, status: newStatus } : prev));
      showToast(`Status changed to ${newStatus}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setChangingStatus(false);
    }
  };

  const fetchProducts = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (reset) setProductsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          brandIds: brandId as string,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.productType)
          queryParams.append("productTypes", filters.productType);
        if (filters.gender) queryParams.append("gender", filters.gender);
        if (filters.season) queryParams.append("season", filters.season);
        if (filters.minPrice)
          queryParams.append("minPrice", filters.minPrice.toString());
        if (filters.maxPrice)
          queryParams.append("maxPrice", filters.maxPrice.toString());
        if (filters.status) queryParams.append("status", filters.status);

        const response = await fetch(
          `${getApiUrl()}/products?${queryParams.toString()}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
              "Content-Type": "application/json",
            },
          },
        );
        if (!response.ok) throw new Error("Failed to fetch products");
        const data: PaginatedResponse = await response.json();

        data.items.forEach((product) => {
          product["brandName"] = brand?.name || "Unknown Brand";
        });

        if (reset || page === 1) {
          setProducts(data.items);
        } else {
          setProducts((prev) => [...prev, ...data.items]);
        }
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setProductsLoading(false);
        setRefreshing(false);
      }
    },
    [brandId, filters, sortBy, sortOrder, pagination.limit, brand?.name],
  );

  useEffect(() => {
    if (brandId) {
      fetchBrandDetails();
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      // Follower count is public - always fetch
      fetch(`${getApiUrl()}/brands/follow/${brandId}/count`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setFollowerCount(data.count); })
        .catch(() => {});

      if (token) {
        fetchFollowState();
      } else {
        setIsFollowing(false);
      }
    }
  }, [brandId, token]);

  useEffect(() => {
    if (brandId && brand) fetchProducts(1, true);
  }, [fetchProducts]);

  useEffect(() => {
    if (refresh === "true") {
      fetchBrandDetails();
      fetchProducts(1, true);
      router.setParams({ refresh: "" });
    }
  }, [refresh]);

  // ── Handlers ─────────────────────────────────
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchProducts(1, true);
  };

  const resetFilters = () => {
    setFilters({ search: "" });
    fetchProducts(1, true);
  };

  const loadMoreProducts = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    if (pagination.page < totalPages && !productsLoading) {
      fetchProducts(pagination.page + 1, false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBrandDetails();
    fetchProducts(1, true);
  };

  const handleSortChange = (option: SortOption) => {
    setSelectedSortOption(option);
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    // No direct fetchProducts call — useEffect([fetchProducts]) handles re-fetch
    // when sortBy/sortOrder state updates cause fetchProducts to get a new reference.
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.productType) count++;
    if (filters.gender) count++;
    if (filters.season) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    return count;
  };

  // ── Loading / Error / Not Found ──────────────
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.danger}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.goBackBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.goBackBtnText, { color: colors.text }]}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons
          name="storefront-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Brand not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.goBackBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.goBackBtnText, { color: colors.text }]}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeFiltersCount = getActiveFiltersCount();
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasNext = pagination.page < totalPages;
  const statusCfg = STATUS_CONFIG[brand.status] || { label: brand.status || "Unknown", icon: "ellipse-outline" as const };
  const statusColors = getStatusColors(brand.status);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* ── Top Navigation Bar ────────────────────── */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: colors.surfaceRaised }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.navTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {brand.name}
        </Text>
        {isOwnerOrAdmin ? (
          <TouchableOpacity
            onPress={() => router.push(`/brands/${brandId}/edit` as any)}
            style={[styles.navBtn, { backgroundColor: colors.primarySoft }]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtnPlaceholder} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Brand Hero ──────────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              shadowColor: colors.cardShadow,
            },
          ]}
        >
          {/* Logo */}
          {brand.logo ? (
            <Image
              source={{ uri: brand.logo }}
              style={[styles.heroLogo, { borderColor: colors.borderLight }]}
            />
          ) : (
            <View
              style={[styles.heroLogo, { backgroundColor: colors.primarySoft }]}
            >
              <Text style={[styles.heroLogoText, { color: colors.primary }]}>
                {brand.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text style={[styles.heroName, { color: colors.text }]}>
            {brand.name}
          </Text>

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Ionicons name={statusCfg.icon} size={13} color={statusColors.fg} />
            <Text style={[styles.statusBadgeText, { color: statusColors.fg }]}>
              {statusCfg.label}
            </Text>
          </View>

          {/* Description */}
          {brand.description && (
            <Text
              style={[styles.heroDescription, { color: colors.textSecondary }]}
            >
              {brand.description}
            </Text>
          )}

          {/* Location */}
          {brand.location && (
            <View style={styles.heroLocationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.heroLocationText, { color: colors.textTertiary }]}
              >
                {brand.location}
              </Text>
            </View>
          )}

          {/* Follow Button (customers only) */}
          {!isOwnerOrAdmin && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing
                  ? { borderColor: colors.textTertiary + "40", borderWidth: 1 }
                  : { backgroundColor: colors.primary },
              ]}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? colors.text : colors.primaryForeground}
                />
              ) : (
                <Text
                  style={[
                    styles.followBtnText,
                    {
                      color: isFollowing
                        ? colors.text
                        : colors.primaryForeground,
                    },
                  ]}
                >
                  {isFollowing ? "FOLLOWING" : "FOLLOW"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Stats Row */}
          <View
            style={[
              styles.heroStatsRow,
              { borderTopColor: colors.borderLight },
            ]}
          >
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: colors.text }]}>
                {followerCount}
              </Text>
              <Text
                style={[
                  styles.heroStatLabel,
                  { color: colors.textTertiary },
                ]}
              >
                Followers
              </Text>
            </View>
            <View
              style={[
                styles.heroStatDivider,
                { backgroundColor: colors.borderLight },
              ]}
            />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: colors.text }]}>
                {pagination.total}
              </Text>
              <Text
                style={[
                  styles.heroStatLabel,
                  { color: colors.textTertiary },
                ]}
              >
                Products
              </Text>
            </View>
          </View>
        </View>

        {/* ── Management Section (Owner/Admin) ────── */}
        {isOwnerOrAdmin && (
          <View style={styles.managementSection}>
            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push(`/products/create/${brand.id}`)}
              >
                <Ionicons name="add" size={18} color={colors.primaryForeground} />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  New Product
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/brands/${brandId}/edit` as any)}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.text}
                />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>
                  Edit Brand
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 10,
                  marginHorizontal: 0,
                },
              ]}
              onPress={() =>
                router.push(`/brands/${brandId}/dashboard` as any)
              }
            >
              <Ionicons
                name="stats-chart-outline"
                size={18}
                color={colors.text}
              />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>
                Dashboard & Analytics
              </Text>
            </TouchableOpacity>

            {/* Status Changer */}
            {/* <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <Text
                style={[styles.statusCardTitle, { color: colors.textTertiary }]}
              >
                BRAND STATUS
              </Text>
              <View style={styles.statusOptions}>
                {Object.values(BrandStatus).map((s) => {
                  const isSelected = brand.status === s;
                  const sc = getStatusColors(s);
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <TouchableOpacity
                      key={s}
                      disabled={changingStatus}
                      onPress={() => handleStatusChange(s)}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor: isSelected ? sc.bg : "transparent",
                          borderColor: isSelected ? sc.fg : colors.border,
                          opacity: changingStatus ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={14}
                        color={isSelected ? sc.fg : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          {
                            color: isSelected ? sc.fg : colors.textSecondary,
                          },
                        ]}
                      >
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {changingStatus && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 10 }}
                />
              )}
            </View> */}
          </View>
        )}

        {/* ── Search & Filter ─────────────────────── */}
        <View style={styles.searchFilterRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.textTertiary}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textTertiary}
              value={filters.search}
              onChangeText={(text) => handleFilterChange("search", text)}
              onSubmitEditing={() => fetchProducts(1, true)}
              returnKeyType="search"
            />
            {filters.search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  handleFilterChange("search", "");
                  fetchProducts(1, true);
                }}
                style={[styles.clearSearchBtn, { backgroundColor: colors.border }]}
              >
                <Ionicons
                  name="close"
                  size={12}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  activeFiltersCount > 0
                    ? colors.primary
                    : colors.surfaceRaised,
                borderColor:
                  activeFiltersCount > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options"
              size={18}
              color={
                activeFiltersCount > 0
                  ? colors.primaryForeground
                  : colors.text
              }
            />
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  { backgroundColor: colors.danger },
                ]}
              >
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Sort Chips ──────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortScroll}
          contentContainerStyle={styles.sortContent}
        >
          {sortOptions.map((option) => {
            const isActive = selectedSortOption.key === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : colors.surfaceRaised,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSortChange(option)}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    {
                      color: isActive
                        ? colors.primaryForeground
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Products Header ─────────────────────── */}
        <View style={styles.productsHeader}>
          <Text style={[styles.productsTitle, { color: colors.text }]}>
            Products
          </Text>
          <Text
            style={[styles.productCount, { color: colors.textTertiary }]}
          >
            {pagination.total} product{pagination.total !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* ── Products List ───────────────────────── */}
        {productsLoading && products.length === 0 ? (
          <View style={styles.productsLoadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : products.length > 0 ? (
          <FlatList
            data={products}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) =>
              isOwnerOrAdmin ? (
                <ProductManagementCard
                  product={item}
                  onEdit={(id) => router.push(`/products/edit/${id}`)}
                />
              ) : (
                <ProductCard product={item} />
              )
            }
            contentContainerStyle={styles.productsList}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListFooterComponent={() =>
              hasNext ? (
                <TouchableOpacity
                  style={[
                    styles.loadMoreBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={loadMoreProducts}
                  disabled={productsLoading}
                >
                  {productsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text
                      style={[styles.loadMoreText, { color: colors.primary }]}
                    >
                      Load More ({pagination.total - products.length} remaining)
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
          />
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.emptyTitle, { color: colors.textSecondary }]}
            >
              {activeFiltersCount > 0
                ? "No products match your filters"
                : "No products yet"}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textTertiary }]}
            >
              {activeFiltersCount > 0
                ? "Try adjusting your filters"
                : "Create your first product to get started"}
            </Text>
          </View>
        )}

        {/* ── Danger Zone (Owner/Admin) ───────────── */}
        {isOwnerOrAdmin && (
          <View style={styles.dangerZone}>
            <View
              style={[
                styles.dangerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.danger,
                },
              ]}
            >
              <View style={styles.dangerHeader}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={[styles.dangerTitle, { color: colors.danger }]}>
                  Danger Zone
                </Text>
              </View>
              <Text
                style={[
                  styles.dangerDescription,
                  { color: colors.textTertiary },
                ]}
              >
                Deleting this brand will permanently remove it and all
                associated products. This action cannot be undone.
              </Text>
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  {
                    borderColor: colors.danger,
                    backgroundColor: "transparent",
                  },
                ]}
                onPress={handleDeleteBrand}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text
                  style={[styles.deleteBtnText, { color: colors.danger }]}
                >
                  Delete Brand
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Filter Modal ──────────────────────────── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.surfaceOverlay },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filters
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Type */}
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.filterSectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Product Type
                </Text>
                <View style={styles.filterChips}>
                  {filterOptions.productTypes.map((type) => {
                    const active = filters.productType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.surfaceRaised,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() =>
                          handleFilterChange(
                            "productType",
                            active ? undefined : type,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: active
                                ? colors.primaryForeground
                                : colors.text,
                            },
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gender */}
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.filterSectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Gender
                </Text>
                <View style={styles.filterChips}>
                  {filterOptions.genders.map((gender) => {
                    const active = filters.gender === gender;
                    return (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.surfaceRaised,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() =>
                          handleFilterChange(
                            "gender",
                            active ? undefined : gender,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: active
                                ? colors.primaryForeground
                                : colors.text,
                            },
                          ]}
                        >
                          {gender}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Season */}
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.filterSectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Season
                </Text>
                <View style={styles.filterChips}>
                  {filterOptions.seasons.map((season) => {
                    const active = filters.season === season;
                    return (
                      <TouchableOpacity
                        key={season}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.surfaceRaised,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() =>
                          handleFilterChange(
                            "season",
                            active ? undefined : season,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: active
                                ? colors.primaryForeground
                                : colors.text,
                            },
                          ]}
                        >
                          {season}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Status */}
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.filterSectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Status
                </Text>
                <View style={styles.filterChips}>
                  {filterOptions.statuses.map((status) => {
                    const active = filters.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.surfaceRaised,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() =>
                          handleFilterChange(
                            "status",
                            active ? undefined : status,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: active
                                ? colors.primaryForeground
                                : colors.text,
                            },
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Price Range */}
              <View
                style={[
                  styles.filterSection,
                  { borderBottomColor: colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.filterSectionTitle,
                    { color: colors.text },
                  ]}
                >
                  Price Range
                </Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        backgroundColor: colors.surfaceRaised,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Min"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={filters.minPrice?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "minPrice",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                  />
                  <Text
                    style={[styles.priceDash, { color: colors.textTertiary }]}
                  >
                    —
                  </Text>
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        backgroundColor: colors.surfaceRaised,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Max"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    value={filters.maxPrice?.toString() || ""}
                    onChangeText={(text) =>
                      handleFilterChange(
                        "maxPrice",
                        text ? parseFloat(text) : undefined,
                      )
                    }
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View
              style={[
                styles.modalFooter,
                { borderTopColor: colors.borderLight },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalResetBtn,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  },
                ]}
                onPress={resetFilters}
              >
                <Text
                  style={[styles.modalResetText, { color: colors.text }]}
                >
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalApplyBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={applyFilters}
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
    </SafeAreaView>
  );
};

// ── Styles (static, outside component) ─────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: { fontSize: 16, fontWeight: "500", marginTop: 8 },
  goBackBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  goBackBtnText: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },

  // ── Nav Bar ─────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnPlaceholder: { width: 38 },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  // ── Brand Hero ──────────────────────────────
  heroCard: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  heroLogo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  heroLogoText: { fontSize: 36, fontWeight: "700" },
  heroName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  heroLocationText: { fontSize: 13, fontWeight: "500" },
  heroStatsRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    width: "100%",
    justifyContent: "center",
  },
  heroStat: { alignItems: "center", flex: 1 },
  heroStatValue: { fontSize: 22, fontWeight: "800" },
  heroStatLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, alignSelf: "center" },
  followBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // ── Management Section ──────────────────────
  managementSection: { paddingHorizontal: 16, marginTop: 16, gap: 12 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  statusCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statusCardTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusOptionText: { fontSize: 13, fontWeight: "600" },

  // ── Search & Filter ─────────────────────────
  searchFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearSearchBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },

  // ── Sort Chips ──────────────────────────────
  sortScroll: { marginTop: 12 },
  sortContent: { paddingHorizontal: 16, gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 13, fontWeight: "600" },

  // ── Products Header ─────────────────────────
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 14,
  },
  productsTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  productCount: { fontSize: 13, fontWeight: "500" },

  // ── Products List ───────────────────────────
  productsList: { paddingHorizontal: 16, paddingBottom: 8 },
  productsLoadingWrap: { paddingVertical: 48, alignItems: "center" },
  loadMoreBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600" },

  // ── Empty State ─────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },

  // ── Danger Zone ─────────────────────────────
  dangerZone: { paddingHorizontal: 16, marginTop: 32 },
  dangerCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dangerTitle: { fontSize: 14, fontWeight: "700" },
  dangerDescription: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700" },

  // ── Filter Modal ────────────────────────────
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterSectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: "500" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  priceDash: { fontSize: 16, fontWeight: "300" },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
  },
  modalResetBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  modalResetText: { fontSize: 15, fontWeight: "600" },
  modalApplyBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalApplyText: { fontSize: 15, fontWeight: "700" },

  scrollContent: { paddingBottom: 20 },
});

export default BrandDetailScreen;
