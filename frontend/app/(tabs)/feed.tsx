import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  postProducts?: { product: { id: number; name: string; price: number; images?: string[] } }[];
}

// ── Image Carousel ──
const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 1) {
    return (
      <Image source={{ uri: images[0] }} style={styles.postImage} resizeMode="cover" />
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      >
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.postImage} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ── Post Card ──
const PostCard: React.FC<{
  post: PostData;
  colors: any;
  token: string | null;
  onLike: (id: number) => void;
  onNavigate: (id: number) => void;
  onBrandPress: (id: number) => void;
  onProductPress: (id: number) => void;
}> = ({ post, colors, token, onLike, onNavigate, onBrandPress, onProductPress }) => {
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onBrandPress(post.brand.id)}
        activeOpacity={0.7}
      >
        {post.brand.logo ? (
          <Image source={{ uri: post.brand.logo }} style={styles.brandAvatar} />
        ) : (
          <View style={[styles.brandAvatar, { backgroundColor: colors.surfaceRaised }]}>
            <Text style={[styles.brandInitial, { color: colors.text }]}>
              {post.brand.name?.charAt(0) || "B"}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.brandName, { color: colors.text }]}>
            {post.brand.name}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
            {timeAgo}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Images */}
      <ImageCarousel images={post.images} />

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onLike(post.id)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={post.isLiked ? "#ef4444" : colors.text}
            />
            {post.likeCount > 0 && (
              <Text style={[styles.actionCount, { color: post.isLiked ? "#ef4444" : colors.text }]}>
                {post.likeCount}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onNavigate(post.id)}
            activeOpacity={0.6}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
            {post.commentCount > 0 && (
              <Text style={[styles.actionCount, { color: colors.text }]}>
                {post.commentCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption */}
      {post.caption && (
        <Text style={[styles.caption, { color: colors.text }]} numberOfLines={3}>
          <Text style={styles.captionBrand}>{post.brand.name} </Text>
          {post.caption}
        </Text>
      )}

      {/* Tagged Products */}
      {post.postProducts && post.postProducts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.productsScroll}
          contentContainerStyle={styles.productsContainer}
        >
          {post.postProducts.map((pp) => (
            <TouchableOpacity
              key={pp.product.id}
              style={[styles.taggedProduct, { borderColor: colors.border }]}
              onPress={() => onProductPress(pp.product.id)}
              activeOpacity={0.7}
            >
              {pp.product.images?.[0] && (
                <Image
                  source={{ uri: pp.product.images[0] }}
                  style={styles.taggedProductImage}
                />
              )}
              <View style={styles.taggedProductInfo}>
                <Text
                  style={[styles.taggedProductName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {pp.product.name}
                </Text>
                <Text style={[styles.taggedProductPrice, { color: colors.textTertiary }]}>
                  ${Number(pp.product.price).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ── Main Feed Screen ──
export default function FeedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token, user } = useAuth();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);

  const fetchFeed = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const url = token
          ? `${getApiUrl()}/feed?page=${pageNum}&limit=10&followedOnly=true`
          : `${getApiUrl()}/feed?page=${pageNum}&limit=10`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();

        if (pageNum === 1) {
          setPosts(data.data);
        } else {
          setPosts((prev) => [...prev, ...data.data]);
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
    }, [fetchFeed]),
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

  const isBrandOwner = user?.role === "brandOwner";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              colors={colors}
              token={token}
              onLike={handleLike}
              onNavigate={(id) => router.push(`/feed/${id}` as any)}
              onBrandPress={(id) => router.push(`/brands/${id}` as any)}
              onProductPress={(id) => router.push(`/products/${id}` as any)}
            />
          )}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No posts yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Follow brands to see their latest updates
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator
                style={{ paddingVertical: 20 }}
                color={colors.textTertiary}
              />
            ) : null
          }
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : undefined}
        />
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

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Card
  card: { borderBottomWidth: 0.5, paddingBottom: 16, marginBottom: 4 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandAvatar: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  brandInitial: { fontSize: 14, fontWeight: "800" },
  headerInfo: { marginLeft: 10, flex: 1 },
  brandName: { fontSize: 13, fontWeight: "700" },
  timeAgo: { fontSize: 11, marginTop: 1 },

  // Image
  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: "#f0f0f0" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 0 },
  dotActive: { backgroundColor: "#000" },
  dotInactive: { backgroundColor: "#E5E5E5" },

  // Actions
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  actionsLeft: { flexDirection: "row", gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  actionCount: { fontSize: 13, fontWeight: "600" },

  // Content
  caption: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  captionBrand: { fontWeight: "700" },

  // Tagged products
  productsScroll: { marginTop: 12 },
  productsContainer: { paddingHorizontal: 16, gap: 10 },
  taggedProduct: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 8,
    width: 200,
    gap: 8,
  },
  taggedProductImage: { width: 40, height: 40, backgroundColor: "#f5f5f5" },
  taggedProductInfo: { flex: 1, justifyContent: "center" },
  taggedProductName: { fontSize: 12, fontWeight: "600" },
  taggedProductPrice: { fontSize: 11, marginTop: 2 },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },

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
