import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";
import { useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { useScrollToTop } from "@/context/ScrollToTopContext";

type Tab = "products" | "brands";

interface FollowedBrand {
  id: number;
  name: string;
  logo: string | null;
  description: string | null;
  location: string | null;
  productCount: number;
  followedAt: string;
}

const WishlistTab = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const { isConnected } = useNetwork();
  const { reportScroll } = useHeaderVisibility();
  const { register, unregister } = useScrollToTop();
  const productsListRef = useRef<FlatList>(null);
  const brandsListRef = useRef<FlatList>(null);
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [followedBrands, setFollowedBrands] = useState<FollowedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);

  const { width } = useWindowDimensions();
  const columnCount = width > 600 ? 3 : 2;
  const itemWidth = (width - 48) / columnCount;

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFollowedBrands = useCallback(async () => {
    if (!token) {
      setBrandsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${getApiUrl()}/brands/user/followed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFollowedBrands(data);
      }
    } catch (error) {
      console.error("Error fetching followed brands:", error);
    } finally {
      setBrandsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
    fetchFollowedBrands();
  }, [fetchWishlist, fetchFollowedBrands]);

  useEffect(() => {
    register("wishlist", () => {
      if (activeTab === "products") {
        productsListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else {
        brandsListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });
    return () => unregister("wishlist");
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchWishlist();
        fetchFollowedBrands();
      }
    }, [token]),
  );

  const toggleWishlist = async (productId: number) => {
    const previousWishlist = wishlist;
    setWishlist((prev) => prev.filter((item) => item.product?.id !== productId));
    try {
      const response = await fetch(
        `${getApiUrl()}/wishlist/toggle/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error("Failed to update wishlist");
    } catch (error: any) {
      setWishlist(previousWishlist);
      Alert.alert("Error", error.message);
    }
  };

  const unfollowBrand = async (brandId: number) => {
    setUnfollowingId(brandId);
    try {
      const response = await fetch(
        `${getApiUrl()}/brands/follow/${brandId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Failed to unfollow brand");
      setFollowedBrands((prev) => prev.filter((b) => b.id !== brandId));
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUnfollowingId(null);
    }
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const product = item.product;
    if (!product) return null;
    const image =
      product.mainImage || product.images?.[0] || "";

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { width: itemWidth, backgroundColor: colors.surface },
        ]}
        onPress={() => router.push(`/products/${product.id}`)}
      >
        <Image source={{ uri: image ? image: "" }} style={[styles.productImage, { backgroundColor: colors.surfaceRaised }]} />
        <TouchableOpacity
          style={[styles.removeIcon, { backgroundColor: colors.surface }]}
          onPress={() => toggleWishlist(product.id)}
        >
          <Ionicons name="heart" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text
            style={[styles.brandName, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {product.brand?.name || "Brand"}
          </Text>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text style={[styles.productPrice, { color: colors.text }]}>
            ${Number(product.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBrandItem = ({ item }: { item: FollowedBrand }) => (
    <TouchableOpacity
      style={[styles.brandCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/brands/${item.id}` as any)}
    >
      <View style={styles.brandCardLeft}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={[styles.brandLogo, { backgroundColor: colors.surfaceRaised }]} />
        ) : (
          <View style={[styles.brandLogo, styles.brandLogoPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandLogoLetter, { color: colors.textInverse }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.brandCardInfo}>
          <Text
            style={[styles.brandCardName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.brandCardMeta, { color: colors.textTertiary }]}
          >
            {item.productCount} {item.productCount === 1 ? "product" : "products"}
            {item.location ? ` · ${item.location}` : ""}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.unfollowBtn, { borderColor: colors.textTertiary + "40" }]}
        onPress={() => unfollowBrand(item.id)}
        disabled={unfollowingId === item.id}
      >
        {unfollowingId === item.id ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={[styles.unfollowText, { color: colors.text }]}>
            FOLLOWING
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (!token) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centeredContent}>
          <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your wishlist is waiting
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Sign in to save the items you love.
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={[styles.authBtnText, { color: colors.primaryForeground }]}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isConnected && wishlist.length === 0 && followedBrands.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflinePlaceholder onRetry={() => { fetchWishlist(); fetchFollowedBrands(); }} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>SAVED</Text>
      </View>

      {/* Sub-tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.textTertiary + "20" }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "products" && [styles.tabActive, { borderBottomColor: colors.text }],
          ]}
          onPress={() => setActiveTab("products")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "products" ? colors.text : colors.textTertiary },
            ]}
          >
            PRODUCTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "brands" && [styles.tabActive, { borderBottomColor: colors.text }],
          ]}
          onPress={() => setActiveTab("brands")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "brands" ? colors.text : colors.textTertiary },
            ]}
          >
            BRANDS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Tab */}
      {activeTab === "products" && (
        <>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : wishlist.length === 0 ? (
            <View style={styles.centeredContent}>
              <Ionicons
                name="heart-dislike-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No favorites yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Tap the heart on any product to save it for later.
              </Text>
              <TouchableOpacity
                style={[styles.shopBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/shop" as any)}
              >
                <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>BROWSE SHOP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={productsListRef}
              data={wishlist}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              numColumns={columnCount}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            />
          )}
        </>
      )}

      {/* Brands Tab */}
      {activeTab === "brands" && (
        <>
          {brandsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : followedBrands.length === 0 ? (
            <View style={styles.centeredContent}>
              <Ionicons
                name="storefront-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No brands followed
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Follow brands to stay updated on new releases and drops.
              </Text>
              <TouchableOpacity
                style={[styles.shopBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/brands" as any)}
              >
                <Text style={[styles.shopBtnText, { color: colors.primaryForeground }]}>DISCOVER BRANDS</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={brandsListRef}
              data={followedBrands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.brandsListContent}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            />
          )}
        </>
      )}
    </View>
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
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  brandsListContent: {
    padding: 16,
  },
  productCard: {
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 4,
  },
  productImage: {
    width: "100%",
    height: 180,
    // backgroundColor set via inline style (colors.surfaceRaised)
  },
  removeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
  cardContent: {
    padding: 12,
  },
  brandName: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  productName: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  brandCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
    borderRadius: 0,
  },
  brandCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 0,
    // backgroundColor set via inline style (colors.surfaceRaised)
    marginRight: 14,
  },
  brandLogoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor set via inline style (colors.primary)
  },
  brandLogoLetter: {
    fontSize: 20,
    fontWeight: "700",
    // color set via inline style (colors.textInverse)
  },
  brandCardInfo: {
    flex: 1,
  },
  brandCardName: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  brandCardMeta: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  unfollowBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
  },
  unfollowText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  shopBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  shopBtnText: {
    // color set via inline style (colors.primaryForeground)
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  authBtn: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  authBtnText: {
    // color set via inline style (colors.primaryForeground)
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});

export default WishlistTab;
