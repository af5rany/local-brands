import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import getApiUrl from "@/helpers/getApiUrl";
import { formatPrice } from "@/utils/formatPrice";
import { useThemeColors } from "@/hooks/useThemeColor";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";
import { useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { useScrollToTop } from "@/context/ScrollToTopContext";
import QuickAddSheet from "@/components/QuickAddSheet";
import ProgressiveImage from "@/components/ProgressiveImage";

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
  const { refresh: refreshCart } = useCart();
  const { showToast } = useToast();
  const colors = useThemeColors();
  const { isConnected } = useNetwork();
  const { reportScroll } = useHeaderVisibility();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [followedBrands, setFollowedBrands] = useState<FollowedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<number | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<number>>(new Set());
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [buyingNowId, setBuyingNowId] = useState<number | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<{
    id: number; name: string; price: number; salePrice?: number | null;
    mainImage?: string; variants: { id: number; size: string | null; stock: number; isAvailable: boolean }[];
  } | null>(null);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  const { register, unregister } = useScrollToTop();
  const productsRef = useRef<FlatList>(null);
  const brandsRef = useRef<FlatList>(null);
  const pagerRef = useRef<ScrollView>(null);
  const SCREEN_WIDTH = Dimensions.get("window").width;

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: tab === "products" ? 0 : SCREEN_WIDTH, animated: true });
  }, [SCREEN_WIDTH]);

  useEffect(() => {
    register("wishlist", () => {
      if (activeTab === "products") productsRef.current?.scrollToOffset({ offset: 0, animated: true });
      else brandsRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => unregister("wishlist");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const handleCartOrNotify = useCallback(async (product: any) => {
    if (!token) { router.push("/auth/login" as any); return; }
    const inStock = (product.stock ?? 0) > 0 || product.productVariants?.some((v: any) => v.stock > 0);

    if (!inStock) {
      if (subscribedIds.has(product.id)) return;
      try {
        const res = await fetch(`${getApiUrl()}/notifications/notify-me/${product.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          setSubscribedIds((prev) => new Set(prev).add(product.id));
          showToast("You'll be notified when back in stock", "success");
        }
      } catch {
        showToast("Could not subscribe", "error");
      }
      return;
    }

    const hasVariants = product.productVariants?.length > 0;
    if (hasVariants) {
      setQuickAddProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        mainImage: product.mainImage,
        variants: product.productVariants.map((v: any) => ({
          id: v.id,
          size: v.size ?? null,
          stock: v.stock ?? 0,
          isAvailable: v.isAvailable ?? true,
        })),
      });
      setQuickAddVisible(true);
      return;
    }

    if (addingToCartId === product.id) return;
    setAddingToCartId(product.id);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        refreshCart();
        showToast("Added to bag", "success");
      } else {
        const errBody = await res.json().catch(() => null);
        if (errBody?.message === "Please select a product variant") {
          // variants not in wishlist response — fetch full product then show picker
          const productRes = await fetch(`${getApiUrl()}/products/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (productRes.ok) {
            const full = await productRes.json();
            const variants: any[] = full.variants ?? full.productVariants ?? [];
            if (variants.length > 0) {
              setQuickAddProduct({
                id: full.id,
                name: full.name,
                price: full.price,
                salePrice: full.salePrice,
                mainImage: full.mainImage,
                variants: variants.map((v: any) => ({
                  id: v.id,
                  size: v.size ?? null,
                  stock: v.stock ?? 0,
                  isAvailable: v.isAvailable ?? true,
                })),
              });
              setQuickAddVisible(true);
              return;
            }
          }
        }
        showToast("Could not add to bag", "error");
      }
    } catch {
      showToast("Could not add to bag", "error");
    } finally {
      setAddingToCartId(null);
    }
  }, [token, router, subscribedIds, addingToCartId, refreshCart, showToast]);

  const handleBuyNow = useCallback(async (product: any) => {
    if (!token) { router.push("/auth/login" as any); return; }
    const inStock = (product.stock ?? 0) > 0 || product.productVariants?.some((v: any) => v.stock > 0);
    if (!inStock) return;

    const hasVariants = product.productVariants?.length > 0;
    if (hasVariants) {
      setQuickAddProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        mainImage: product.mainImage,
        variants: product.productVariants.map((v: any) => ({
          id: v.id,
          size: v.size ?? null,
          stock: v.stock ?? 0,
          isAvailable: v.isAvailable ?? true,
        })),
      });
      setQuickAddVisible(true);
      return;
    }

    if (buyingNowId === product.id) return;
    setBuyingNowId(product.id);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        refreshCart();
        router.push("/checkout" as any);
      } else {
        showToast("Could not proceed to checkout", "error");
      }
    } catch {
      showToast("Could not proceed to checkout", "error");
    } finally {
      setBuyingNowId(null);
    }
  }, [token, router, buyingNowId, refreshCart, showToast]);

  const renderProductItem = ({ item }: { item: any }) => {
    const product = item.product;
    if (!product) return null;
    const image = product.mainImage || product.images?.[0] || "";
    const inStock = (product.stock ?? 0) > 0 || product.productVariants?.some((v: any) => v.stock > 0);
    const isSubscribed = subscribedIds.has(product.id);
    const isAddingThisItem = addingToCartId === product.id;

    let btnLabel = inStock ? "ADD TO CART" : "NOTIFY ME";
    if (isSubscribed) btnLabel = "SUBSCRIBED";
    if (isAddingThisItem) btnLabel = "ADDING...";
    const isBuyingNow = buyingNowId === product.id;

    return (
      <View style={[styles.productRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push(`/products/${product.id}` as any)} activeOpacity={0.7}>
          <ProgressiveImage
            uri={image || ""}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.productInfo}>
          <TouchableOpacity onPress={() => router.push(`/products/${product.id}` as any)} activeOpacity={0.7}>
            <Text style={[styles.brandLabel, { color: colors.textTertiary }]} numberOfLines={1}>
              {(product.brand?.name || "BRAND").toUpperCase()}
            </Text>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
              {product.name.toUpperCase()}
            </Text>
            <Text style={[styles.productPrice, { color: colors.text }]}>
              {formatPrice(product.salePrice ?? product.price)}
            </Text>
            <Text style={[styles.stockLabel, { color: inStock ? colors.text : colors.accentRed }]}>
              {inStock ? "IN STOCK" : "OUT OF STOCK"}
            </Text>
          </TouchableOpacity>
          <View style={styles.cartBtnRow}>
            <TouchableOpacity
              style={[styles.cartBtn, { flex: 1, backgroundColor: inStock ? colors.text : colors.background, borderColor: colors.text, opacity: isSubscribed || isAddingThisItem ? 0.5 : 1 }]}
              onPress={() => handleCartOrNotify(product)}
              disabled={isSubscribed || isAddingThisItem}
              activeOpacity={0.8}
            >
              <Text style={[styles.cartBtnText, { color: inStock ? colors.background : colors.text }]}>
                {btnLabel}
              </Text>
            </TouchableOpacity>
            {inStock && (
              <TouchableOpacity
                style={[styles.cartBtn, { flex: 1, backgroundColor: colors.background, borderColor: colors.text, opacity: isBuyingNow ? 0.5 : 1 }]}
                onPress={() => handleBuyNow(product)}
                disabled={isBuyingNow}
                activeOpacity={0.8}
              >
                <Text style={[styles.cartBtnText, { color: colors.text }]}>
                  {isBuyingNow ? "..." : "BUY NOW"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => toggleWishlist(product.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderBrandItem = ({ item }: { item: FollowedBrand }) => (
    <TouchableOpacity
      style={[styles.brandCard, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/brands/${item.id}` as any)}
      activeOpacity={0.7}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={[styles.brandLogo, { backgroundColor: colors.surfaceRaised }]} />
      ) : (
        <View style={[styles.brandLogo, { backgroundColor: colors.text, alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.background }}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.brandCardInfo}>
        <Text style={[styles.brandCardName, { color: colors.text }]} numberOfLines={1}>
          {item.name.toUpperCase()}
        </Text>
        <Text style={[styles.brandCardMeta, { color: colors.textTertiary }]}>
          {item.productCount} ITEMS{item.location ? ` · ${item.location.toUpperCase()}` : ""}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.unfollowBtn, { borderColor: colors.text }]}
        onPress={() => unfollowBrand(item.id)}
        disabled={unfollowingId === item.id}
      >
        {unfollowingId === item.id ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={[styles.unfollowText, { color: colors.text }]}>FOLLOWING</Text>
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
      {/* Sub-tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.textTertiary + "20" }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "products" && [styles.tabActive, { borderBottomColor: colors.text }],
          ]}
          onPress={() => switchTab("products")}
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
          onPress={() => switchTab("brands")}
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

      {/* Pager */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveTab(page === 0 ? "products" : "brands");
        }}
        style={{ flex: 1 }}
      >
        {/* Products page */}
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : wishlist.length === 0 ? (
            <View style={styles.centeredContent}>
              <Ionicons name="heart-dislike-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No favorites yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
              ref={productsRef}
              data={wishlist}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            />
          )}
        </View>

        {/* Brands page */}
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          {brandsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : followedBrands.length === 0 ? (
            <View style={styles.centeredContent}>
              <Ionicons name="storefront-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No brands followed</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
              ref={brandsRef}
              data={followedBrands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item.id.toString()}
              style={{ flex: 1 }}
              contentContainerStyle={styles.brandsListContent}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
            />
          )}
        </View>
      </ScrollView>

      <QuickAddSheet
        visible={quickAddVisible}
        onClose={() => { setQuickAddVisible(false); setQuickAddProduct(null); }}
        product={quickAddProduct}
      />
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
    paddingBottom: 120,
  },
  brandsListContent: {
    paddingBottom: 120,
  },
  // ── Product row (list view) ──────────────────────────────────
  productRow: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 92,
    height: 110,
  },
  productInfo: {
    flex: 1,
    gap: 3,
  },
  brandLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: 2,
  },
  stockLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  cartBtnRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  cartBtn: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cartBtnText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  removeBtn: {
    paddingTop: 2,
  },
  productCard: {
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 4,
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
  brandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  brandLogo: {
    width: 56,
    height: 56,
  },
  brandCardInfo: {
    flex: 1,
  },
  brandCardName: {
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  brandCardMeta: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  unfollowBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  unfollowText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
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
