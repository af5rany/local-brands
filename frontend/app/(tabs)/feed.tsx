import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  RefreshControl,
  FlatList,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import { FeedPostSkeleton } from "@/components/Skeleton";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { useScrollToTop } from "@/context/ScrollToTopContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 8;
const PADDING = 12;
const NUM_COLUMNS = 2;
const COLUMN_WIDTH =
  (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type ActiveTab = "forYou" | "following";

interface PostData {
  id: number;
  images: string[];
  caption?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  brand: { id: number; name: string; logo?: string };
  author: { id: number; firstName?: string; lastName?: string };
  postProducts?: {
    product: { id: number; name: string; price: number; images?: string[] };
  }[];
}

interface SuggestedProduct {
  id: number;
  name: string;
  price: number;
  images: string[];
  brand?: { id: number; name: string; logo?: string };
}

// ── Product Card (For You grid) ──
const ProductCard: React.FC<{
  product: SuggestedProduct;
  colors: any;
  onPress: (id: number) => void;
}> = ({ product, colors, onPress }) => {
  const image = product.images?.[0];
  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.surface }]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.85}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImage, { backgroundColor: colors.surfaceRaised, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.productInfo}>
        {product.brand && (
          <Text style={[styles.productBrand, { color: colors.textTertiary }]} numberOfLines={1}>
            {product.brand.name}
          </Text>
        )}
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.productPrice, { color: colors.text }]}>
          ${Number(product.price).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Pin Card (Following masonry) ──
const PinCard: React.FC<{
  post: PostData;
  imageHeight: number;
  colors: any;
  onPress: (id: number) => void;
  onLike: (id: number) => void;
  onBrandPress: (id: number) => void;
}> = ({ post, imageHeight, colors, onPress, onLike, onBrandPress }) => {
  const hasProduct =
    post.postProducts && post.postProducts.length > 0
      ? post.postProducts[0].product
      : null;

  return (
    <TouchableOpacity
      style={[styles.pin, { backgroundColor: colors.background }]}
      onPress={() => onPress(post.id)}
      activeOpacity={0.85}
    >
      <View style={[styles.pinImageWrap, { height: imageHeight, backgroundColor: colors.borderLight }]}>
        <Image
          source={{ uri: post.images[0] }}
          style={[styles.pinImage, { height: imageHeight }]}
          resizeMode="cover"
        />
      </View>
      <View style={styles.pinInfo}>
        {post.caption ? (
          <Text style={[styles.pinCaption, { color: colors.text }]} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : hasProduct ? (
          <Text style={[styles.pinCaption, { color: colors.text }]} numberOfLines={2}>
            {hasProduct.name}
          </Text>
        ) : null}
        {hasProduct && (
          <Text style={[styles.pinPrice, { color: colors.text }]}>
            ${Number(hasProduct.price).toFixed(2)}
          </Text>
        )}
        <View style={styles.pinBottom}>
          <TouchableOpacity
            style={styles.pinBrandRow}
            onPress={() => onBrandPress(post.brand.id)}
            activeOpacity={0.7}
          >
            {post.brand.logo ? (
              <Image source={{ uri: post.brand.logo }} style={styles.pinBrandAvatar} />
            ) : (
              <View style={[styles.pinBrandAvatar, { backgroundColor: colors.surfaceRaised }]}>
                <Text style={[styles.pinBrandInitial, { color: colors.text }]}>
                  {post.brand.name?.charAt(0) || "B"}
                </Text>
              </View>
            )}
            <Text style={[styles.pinBrandName, { color: colors.textTertiary }]} numberOfLines={1}>
              {post.brand.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onLike(post.id)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={18}
              color={post.isLiked ? colors.danger : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Masonry Layout ──
function useMasonryColumns(posts: PostData[], imageHeights: Record<number, number>) {
  const leftCol: { post: PostData; height: number }[] = [];
  const rightCol: { post: PostData; height: number }[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  for (const post of posts) {
    const imgH = imageHeights[post.id] || COLUMN_WIDTH;
    const totalH = imgH + 70;
    if (leftHeight <= rightHeight) {
      leftCol.push({ post, height: imgH });
      leftHeight += totalH + COLUMN_GAP;
    } else {
      rightCol.push({ post, height: imgH });
      rightHeight += totalH + COLUMN_GAP;
    }
  }
  return { leftCol, rightCol };
}

// ── Tab Switcher ──
const TabSwitcher: React.FC<{
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  colors: any;
}> = ({ activeTab, onChange, colors }) => (
  <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
    {(["forYou", "following"] as ActiveTab[]).map((tab) => {
      const isActive = activeTab === tab;
      const label = tab === "forYou" ? "For You" : "Following";
      return (
        <TouchableOpacity
          key={tab}
          style={styles.tabItem}
          onPress={() => onChange(tab)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, { color: isActive ? colors.text : colors.textTertiary }, isActive && styles.tabLabelActive]}>
            {label}
          </Text>
          {isActive && <View style={[styles.tabUnderline, { backgroundColor: colors.text }]} />}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Main Feed Screen ──
export default function FeedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { reportScroll } = useHeaderVisibility();
  const { register, unregister } = useScrollToTop();
  const forYouRef = useRef<FlatList>(null);
  const followingRef = useRef<ScrollView>(null);
  const { token, user } = useAuth();
  const { isConnected } = useNetwork();

  const [activeTab, setActiveTab] = useState<ActiveTab>("forYou");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    for (const post of posts) {
      if (imageHeights[post.id] || !post.images[0]) continue;
      Image.getSize(
        post.images[0],
        (w, h) => {
          const clamped = Math.max(120, Math.min(300, (h / w) * COLUMN_WIDTH));
          setImageHeights((prev) => ({ ...prev, [post.id]: clamped }));
        },
        () => {
          setImageHeights((prev) => ({ ...prev, [post.id]: COLUMN_WIDTH }));
        },
      );
    }
  }, [posts]);

  useEffect(() => {
    register("feed", () => {
      if (activeTab === "forYou") {
        forYouRef.current?.scrollToOffset({ offset: 0, animated: true });
      } else {
        followingRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return () => unregister("feed");
  }, [activeTab]);

  const fetchSuggestedProducts = useCallback(async () => {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const endpoint = token ? "/products/for-you" : "/products/trending";
      const res = await fetch(`${getApiUrl()}${endpoint}?limit=20`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestedProducts(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error("Suggested products error:", e);
    }
  }, [token]);

  const fetchFeed = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const url = token
          ? `${getApiUrl()}/feed?page=${pageNum}&limit=20&followedOnly=true`
          : `${getApiUrl()}/feed?page=${pageNum}&limit=20`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();
        const newPosts = data.data || [];
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
        setHasMore(pageNum < data.pagination.totalPages);
        setPage(pageNum);
      } catch (e) {
        console.error("Feed error:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingMore.current = false;
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      fetchFeed(1);
      fetchSuggestedProducts();
    }, [fetchFeed, fetchSuggestedProducts]),
  );

  const handleRefresh = () => {
    fetchFeed(1, true);
    fetchSuggestedProducts();
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore.current || activeTab !== "following") return;
    loadingMore.current = true;
    fetchFeed(page + 1);
  };

  const updatePostLike = (postId: number, isLiked: boolean, likeCount: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isLiked, likeCount } : p)));
  };

  const handleLike = async (postId: number) => {
    if (!token) { router.push("/auth/login"); return; }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const newLiked = !post.isLiked;
    const newCount = post.likeCount + (newLiked ? 1 : -1);
    updatePostLike(postId, newLiked, newCount);
    try {
      const res = await fetch(`${getApiUrl()}/feed/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      updatePostLike(postId, result.liked, result.likeCount);
    } catch {
      updatePostLike(postId, post.isLiked ?? false, post.likeCount);
    }
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    reportScroll(contentOffset.y);
    if (contentSize.height - layoutMeasurement.height - contentOffset.y < 400) {
      handleLoadMore();
    }
  };

  const isBrandOwner = user?.role === "brandOwner";
  const { leftCol, rightCol } = useMasonryColumns(posts, imageHeights);

  if (!isConnected && posts.length === 0 && suggestedProducts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflinePlaceholder onRetry={() => fetchFeed(1)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} colors={colors} />

      {loading ? (
        <View>{[0, 1, 2].map((i) => <FeedPostSkeleton key={i} />)}</View>
      ) : activeTab === "forYou" ? (
        /* ── FOR YOU: product grid ── */
        <FlatList
          ref={forYouRef}
          data={suggestedProducts}
          numColumns={2}
          keyExtractor={(item) => `p-${item.id}`}
          contentContainerStyle={[styles.productGrid, { paddingBottom: tabBarHeight }]}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              colors={colors}
              onPress={(id) => router.push(`/products/${id}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="grid-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>NOTHING HERE YET</Text>
            </View>
          }
        />
      ) : (
        /* ── FOLLOWING: posts masonry ── */
        <ScrollView
          ref={followingRef}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight }]}
        >
          {posts.length > 0 ? (
            <>
              <View style={styles.masonryRow}>
                <View style={[styles.column, styles.columnLeft]}>
                  {leftCol.map(({ post, height }) => (
                    <PinCard key={post.id} post={post} imageHeight={height} colors={colors}
                      onPress={(id) => router.push(`/feed/${id}` as any)}
                      onLike={handleLike}
                      onBrandPress={(id) => router.push(`/brands/${id}` as any)}
                    />
                  ))}
                </View>
                <View style={styles.column}>
                  {rightCol.map(({ post, height }) => (
                    <PinCard key={post.id} post={post} imageHeight={height} colors={colors}
                      onPress={(id) => router.push(`/feed/${id}` as any)}
                      onLike={handleLike}
                      onBrandPress={(id) => router.push(`/brands/${id}` as any)}
                    />
                  ))}
                </View>
              </View>
              {hasMore && (
                <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.textTertiary} />
              )}
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>FEED IS EMPTY</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Follow brands you love to see their posts here.
              </Text>
              <TouchableOpacity
                style={[styles.exploreCta, { borderColor: colors.text }]}
                onPress={() => router.push("/(tabs)/brands" as any)}
                activeOpacity={0.7}
              >
                <Text style={[styles.exploreCtaText, { color: colors.text }]}>
                  EXPLORE BRANDS →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {isBrandOwner && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.text }]}
          onPress={() => router.push("/feed/create" as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Tab switcher
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    borderRadius: 1,
  },

  // For You product grid
  productGrid: {
    padding: PADDING,
  },
  productRow: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  productCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  productInfo: {
    padding: 10,
    gap: 2,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },

  // Masonry (Following)
  scrollContent: {
    paddingHorizontal: PADDING,
    paddingTop: PADDING,
  },
  masonryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: { width: COLUMN_WIDTH },
  columnLeft: { marginRight: COLUMN_GAP },

  // Pin card
  pin: {
    marginBottom: COLUMN_GAP,
    overflow: "hidden",
    borderRadius: 12,
  },
  pinImageWrap: {
    width: COLUMN_WIDTH,
    overflow: "hidden",
    borderRadius: 12,
  },
  pinImage: { width: COLUMN_WIDTH },
  pinInfo: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  pinCaption: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  pinPrice: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  pinBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  pinBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  pinBrandAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pinBrandInitial: { fontSize: 9, fontWeight: "800" },
  pinBrandName: { fontSize: 11, marginLeft: 4, flex: 1 },

  // Empty
  empty: {
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  exploreCta: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
  },
  exploreCtaText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
