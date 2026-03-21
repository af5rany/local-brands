import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

// const CATEGORIES = ["WOMEN", "MEN", "KIDS"];

const BrandsTab = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // const [activeCategory, setActiveCategory] = useState("WOMEN");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(
        `${getApiUrl()}/brands?limit=50&sortBy=name&sortOrder=ASC`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setBrands(data.items || data.data || data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useFocusEffect(
    useCallback(() => {
      fetchBrands();
    }, [fetchBrands])
  );

  const toggleFavorite = (brandId: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  // Get a representative product image from the brand's products
  const getBrandImage = (brand: any): string | null => {
    if (brand.logo) return brand.logo;
    if (brand.products && brand.products.length > 0) {
      const product = brand.products[0];
      if (product.images && product.images.length > 0) {
        return product.images[0];
      }
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants[0];
        if (variant.images && variant.images.length > 0) {
          return variant.images[0];
        }
      }
    }
    return null;
  };

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase();
    return brands.filter((b) => b.name?.toLowerCase().includes(q));
  }, [brands, searchQuery]);


  const renderBrandCard = ({ item }: { item: any }) => {
    const image = getBrandImage(item);
    const isFav = favorites.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.brandCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/brands/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.brandCardContent}>
          <View style={styles.brandCardLeft}>
            <TouchableOpacity
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={22}
                color={isFav ? colors.danger : colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.brandName, { color: colors.text }]}>
              {item.name}
            </Text>
          </View>
          {image && (
            <Image
              source={{ uri: image }}
              style={styles.brandImage}
              resizeMode="contain"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View>
      {/* Popular Brands Heading */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Popular brands
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Header />

      {/* Search */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchInputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search brands..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          renderItem={renderBrandCard}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 24,
    marginBottom: 4,
  },
  categoryTab: {
    paddingBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  categoryUnderline: {
    height: 2,
    marginTop: 6,
    borderRadius: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  brandCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  brandCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  brandName: {
    fontSize: 15,
    fontWeight: "600",
  },
  brandImage: {
    width: 64,
    height: 64,
    borderRadius: 4,
  },
});

export default BrandsTab;
