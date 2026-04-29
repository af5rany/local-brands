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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 8;
const PADDING = 8;
const NUM_COLUMNS = 2;
const COLUMN_WIDTH =
  (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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

// ── Suggested Product Card ──
const SuggestedProductCard: React.FC<{
  product: SuggestedProduct;
  colors: any;
  onPress: (id: number) => void;
}> = ({ product, colors, onPress }) => {
  const image = product.images?.[0];
  return (
    <TouchableOpacity
      style={[styles.suggestedCard, { backgroundColor: colors.background }]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.85}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.suggestedImage} resizeMode="cover" />
      ) : (
        <View style={[styles.suggestedImage, { backgroundColor: colors.surfaceRaised, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.suggestedInfo}>
        <Text style={[styles.suggestedName, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.suggestedPrice, { color: colors.text }]}>
          ${Number(product.price).toFixed(2)}
        </Text>
        {product.brand && (
          <Text style={[styles.suggestedBrand, { color: colors.textTertiary }]} numberOfLines={1}>
            {product.brand.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Pin Card (Pinterest style) ──
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
      {/* Image */}
      <View style={[styles.pinImageWrap, { height: imageHeight, backgroundColor: colors.borderLight }]}>
        <Image
          source={{ uri: post.images[0] }}
          style={[styles.pinImage, { height: imageHeight }]}
          resizeMode="cover"
        />
        {post.images.length > 1 && (
          <View style={[styles.multiImageBadge, { backgroundColor: colors.surfaceOverlay }]}>
            <Ionicons name="copy-outline" size={12} color={colors.textInverse} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.pinInfo}>
        {/* Caption */}
        {post.caption ? (
          <Text
            style={[styles.pinCaption, { color: colors.text }]}
            numberOfLines={2}
          >
            {post.caption}
          </Text>
        ) : hasProduct ? (
          <Text
            style={[styles.pinCaption, { color: colors.text }]}
            numberOfLines={2}
          >
            {hasProduct.name}
          </Text>
        ) : null}

        {/* Tagged product price */}
        {hasProduct && (
          <Text style={[styles.pinPrice, { color: colors.text }]}>
            ${Number(hasProduct.price).toFixed(2)}
          </Text>
        )}

        {/* Bottom row: brand + like */}
        <View style={styles.pinBottom}>
          <TouchableOpacity
            style={styles.pinBrandRow}
            onPress={() => onBrandPress(post.brand.id)}
            activeOpacity={0.7}
          >
            {post.brand.logo ? (
              <Image
                source={{ uri: post.brand.logo }}
                style={styles.pinBrandAvatar}
              />
            ) : (
              <View
                style={[
                  styles.pinBrandAvatar,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <Text style={[styles.pinBrandInitial, { color: colors.text }]}>
                  {post.brand.name?.charAt(0) || "B"}
                </Text>
              </View>
            )}
            <Text
              style={[styles.pinBrandName, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
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

    // Use accumulated height to pick the shorter column
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

// ── Main Feed Screen ──
export default function FeedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { token, user } = useAuth();

  const { isConnected } = useNetwork();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [suggestedPosts, setSuggestedPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});

  // Resolve image aspect ratios → heights for all displayed posts
  const allPosts = posts.length > 0 ? posts : suggestedPosts;
  useEffect(() => {
    for (const post of allPosts) {
      if (imageHeights[post.id] || !post.images[0]) continue;
      Image.getSize(
        post.images[0],
        (w, h) => {
          const scaledHeight = (h / w) * COLUMN_WIDTH;
          // Clamp between 120 and 300
          const clamped = Math.max(120, Math.min(300, scaledHeight));
          setImageHeights((prev) => ({ ...prev, [post.id]: clamped }));
        },
        () => {
          // On error, default to square
          setImageHeights((prev) => ({ ...prev, [post.id]: COLUMN_WIDTH }));
        },
      );
    }
  }, [allPosts]);

  // Fetch personalized product suggestions (uses wishlist + order history)
  const fetchSuggestedProducts = useCallback(async () => {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      // Use /products/for-you if logged in, otherwise /products/trending
      const endpoint = token ? "/products/for-you" : "/products/trending";
      const res = await fetch(`${getApiUrl()}${endpoint}?limit=10`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestedProducts(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error("Suggested products error:", e);
    }
  }, [token]);

  // Fetch suggested posts (all posts, not just followed) as fallback when followed feed is empty
  const fetchSuggestedPosts = useCallback(async () => {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${getApiUrl()}/feed?page=1&limit=20`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestedPosts(data.data || []);
    } catch (e) {
      console.error("Suggested posts error:", e);
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
          // If no followed-brand posts and user is logged in, load suggested posts
          if (newPosts.length === 0 && token) {
            fetchSuggestedPosts();
          } else {
            setSuggestedPosts([]);
          }
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
    [token, fetchSuggestedPosts],
  );

  useFocusEffect(
    useCallback(() => {
      fetchFeed(1);
      fetchSuggestedProducts();
    }, [fetchFeed, fetchSuggestedProducts]),
  );

  const handleRefresh = () => fetchFeed(1, true);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore.current) return;
    loadingMore.current = true;
    fetchFeed(page + 1);
  };

  const handleLike = async (postId: number) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/feed/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const result = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: result.liked, likeCount: result.likeCount }
            : p,
        ),
      );
    } catch {}
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom < 400) {
      handleLoadMore();
    }
  };

  // Determine which posts to show in the masonry: followed posts, or suggested as fallback
  const displayPosts = posts.length > 0 ? posts : suggestedPosts;
  const showingSuggested = posts.length === 0 && suggestedPosts.length > 0;

  const { leftCol, rightCol } = useMasonryColumns(displayPosts, imageHeights);

  const isBrandOwner = user?.role === "brandOwner";

  // ── Suggested For You section ──
  const renderSuggestedSection = () => {
    if (suggestedProducts.length === 0) return null;
    return (
      <View style={styles.suggestedSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Suggested for you
        </Text>
        <FlatList
          data={suggestedProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `sp-${item.id}`}
          contentContainerStyle={styles.suggestedList}
          renderItem={({ item }) => (
            <SuggestedProductCard
              product={item}
              colors={colors}
              onPress={(id) => router.push(`/products/${id}` as any)}
            />
          )}
        />
      </View>
    );
  };

  if (!isConnected && posts.length === 0 && suggestedPosts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflinePlaceholder onRetry={() => fetchFeed(1)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View>
          {[0, 1, 2].map((i) => <FeedPostSkeleton key={i} />)}
        </View>
      ) : displayPosts.length === 0 ? (
        <ScrollView
          contentContainerStyle={[styles.emptyScroll, { paddingBottom: tabBarHeight }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderSuggestedSection()}
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Your feed is empty
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Follow brands you love to see their posts here
            </Text>
            <TouchableOpacity
              style={[styles.exploreCta, { borderColor: colors.text }]}
              onPress={() => router.push("/(tabs)/discover" as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.exploreCtaText, { color: colors.text }]}>
                Explore brands
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight }]}
        >
          {/* Suggested products section */}
          {renderSuggestedSection()}

          {/* Label when showing suggested posts instead of followed feed */}
          {showingSuggested && (
            <View style={styles.suggestedBanner}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Discover posts
              </Text>
              <Text style={[styles.suggestedBannerSub, { color: colors.textTertiary }]}>
                Follow brands to personalize your feed
              </Text>
            </View>
          )}

          <View style={styles.masonryRow}>
            {/* Left column */}
            <View style={[styles.column, styles.columnLeft]}>
              {leftCol.map(({ post, height }) => (
                <PinCard
                  key={post.id}
                  post={post}
                  imageHeight={height}
                  colors={colors}
                  onPress={(id) => router.push(`/feed/${id}` as any)}
                  onLike={handleLike}
                  onBrandPress={(id) => router.push(`/brands/${id}` as any)}
                />
              ))}
            </View>
            {/* Right column */}
            <View style={styles.column}>
              {rightCol.map(({ post, height }) => (
                <PinCard
                  key={post.id}
                  post={post}
                  imageHeight={height}
                  colors={colors}
                  onPress={(id) => router.push(`/feed/${id}` as any)}
                  onLike={handleLike}
                  onBrandPress={(id) => router.push(`/brands/${id}` as any)}
                />
              ))}
            </View>
          </View>

          {/* Load more indicator */}
          {hasMore && (
            <ActivityIndicator
              style={{ paddingVertical: 20 }}
              color={colors.textTertiary}
            />
          )}
        </ScrollView>
      )}

      {/* FAB for brand owners */}
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Masonry
  scrollContent: {
    paddingHorizontal: PADDING,
    paddingTop: PADDING,
  },
  masonryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    width: COLUMN_WIDTH,
  },
  columnLeft: {
    marginRight: COLUMN_GAP,
  },

  // Pin card
  pin: {
    marginBottom: COLUMN_GAP,
    overflow: "hidden",
  },
  pinImageWrap: {
    width: COLUMN_WIDTH,
    overflow: "hidden",
  },
  pinImage: {
    width: COLUMN_WIDTH,
  },
  multiImageBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 0,
    padding: 4,
  },

  // Pin info
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
  pinBrandInitial: {
    fontSize: 9,
    fontWeight: "800",
  },
  pinBrandName: {
    fontSize: 11,
    marginLeft: 4,
    flex: 1,
  },

  // Suggested section
  suggestedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: PADDING,
    marginBottom: 10,
  },
  suggestedList: {
    paddingHorizontal: PADDING,
    gap: 10,
  },
  suggestedCard: {
    width: 140,
    overflow: "hidden",
  },
  suggestedImage: {
    width: 140,
    height: 140,
  },
  suggestedInfo: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  suggestedName: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  suggestedPrice: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  suggestedBrand: {
    fontSize: 10,
    marginTop: 2,
  },
  suggestedBanner: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  suggestedBannerSub: {
    fontSize: 12,
    paddingHorizontal: PADDING,
    marginTop: 2,
  },

  // Empty
  emptyScroll: {
    flexGrow: 1,
    paddingTop: PADDING,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  exploreCta: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
  },
  exploreCtaText: {
    fontSize: 13,
    fontWeight: "600",
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
