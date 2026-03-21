import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";
import { Brand } from "@/types/brand";

const CategoryBrandsScreen = () => {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (type) params.set("productType", type);
      params.set("limit", "50");

      const res = await fetch(`${getApiUrl()}/brands?${params.toString()}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });

      if (res.ok) {
        const data = await res.json();
        setBrands(data.items || data || []);
      }
    } catch (error) {
      console.error("Error fetching category brands:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, token]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrands();
  }, [fetchBrands]);

  const renderBrandCard = ({ item, index }: { item: Brand; index: number }) => {
    const cardGap = 12;
    return (
      <View
        style={[
          styles.gridItem,
          index % 2 === 0
            ? { marginRight: cardGap / 2 }
            : { marginLeft: cardGap / 2 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.brandCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.cardBorder,
              shadowColor: colors.cardShadow,
            },
          ]}
          onPress={() => router.push(`/brands/${item.id}` as any)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.brandLogoBox,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            {item.logo ? (
              <Image
                source={{ uri: item.logo }}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="storefront" size={32} color={colors.primary} />
            )}
          </View>
          <View style={styles.brandInfo}>
            <Text
              style={[styles.brandName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.brandLocation, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.location || "Global"}
            </Text>
            <View
              style={[
                styles.productCountBadge,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Text style={[styles.productCountText, { color: colors.primary }]}>
                {item.productCount ?? item.products?.length ?? 0} Products
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surfaceRaised }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {type || "Category"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {brands.length} brand{brands.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading brands...
          </Text>
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBrandCard}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="storefront-outline"
                size={56}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.textSecondary }]}
              >
                No brands found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textTertiary }]}
              >
                No brands are currently selling {type} products
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
  },
  gridRow: {
    justifyContent: "flex-start",
  },
  brandCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  brandLogoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  brandLogo: {
    width: "100%",
    height: "100%",
  },
  brandInfo: {
    alignItems: "center",
    width: "100%",
    gap: 3,
  },
  brandName: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  brandLocation: {
    fontSize: 12,
    textAlign: "center",
  },
  productCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
  },
  productCountText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default CategoryBrandsScreen;
