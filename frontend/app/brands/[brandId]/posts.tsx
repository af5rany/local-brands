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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

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

// ── Pin Card ──
const PinCard: React.FC<{
  post: PostData;
  imageHeight: number;
  colors: any;
  onPress: (id: number) => void;
  onLike: (id: number) => void;
}> = ({ post, imageHeight, colors, onPress, onLike }) => {
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

        {hasProduct && (
          <Text style={[styles.pinPrice, { color: colors.text }]}>
            ${Number(hasProduct.price).toFixed(2)}
          </Text>
        )}

        <View style={styles.pinBottom}>
          <View style={styles.pinStatsRow}>
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={14}
              color={post.isLiked ? colors.danger : colors.textTertiary}
            />
            <Text style={[styles.pinStatText, { color: colors.textTertiary }]}>
              {post.likeCount}
            </Text>
            <Ionicons name="chatbubble-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.pinStatText, { color: colors.textTertiary }]}>
              {post.commentCount}
            </Text>
          </View>
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
function useMasonryColumns(
  posts: PostData[],
  imageHeights: Record<number, number>,
) {
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

// ── Brand Posts Screen ──
export default function BrandPostsScreen() {
  const router = useRouter();
  const { brandId } = useLocalSearchParams();
  const colors = useThemeColors();
  const { token } = useAuth();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});

  // Resolve image aspect ratios
  useEffect(() => {
    for (const post of posts) {
      if (imageHeights[post.id] || !post.images[0]) continue;
      Image.getSize(
        post.images[0],
        (w, h) => {
          const scaledHeight = (h / w) * COLUMN_WIDTH;
          const clamped = Math.max(120, Math.min(300, scaledHeight));
          setImageHeights((prev) => ({ ...prev, [post.id]: clamped }));
        },
        () => {
          setImageHeights((prev) => ({ ...prev, [post.id]: COLUMN_WIDTH }));
        },
      );
    }
  }, [posts]);

  const fetchPosts = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(
          `${getApiUrl()}/feed/brand/${brandId}?page=${pageNum}&limit=20`,
          { headers },
        );
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();

        if (pageNum === 1) {
          setPosts(data.data);
          if (data.data.length > 0 && data.data[0].brand?.name) {
            setBrandName(data.data[0].brand.name);
          }
        } else {
          setPosts((prev) => [...prev, ...data.data]);
        }
        setHasMore(pageNum < data.pagination.totalPages);
        setPage(pageNum);
      } catch (e) {
        console.error("Brand posts error:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingMore.current = false;
      }
    },
    [brandId, token],
  );

  useEffect(() => {
    if (brandId) fetchPosts(1);
  }, [brandId, fetchPosts]);

  const handleRefresh = () => fetchPosts(1, true);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore.current) return;
    loadingMore.current = true;
    fetchPosts(page + 1);
  };

  const handleLike = async (postId: number) => {
    if (!token) {
      router.push("/auth/login" as any);
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

  const { leftCol, rightCol } = useMasonryColumns(posts, imageHeights);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Nav Bar */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
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
          {brandName ? `${brandName} Posts` : "Posts"}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : posts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.empty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Ionicons
            name="images-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No posts yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            This brand hasn't posted anything yet
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.masonryRow}>
            <View style={[styles.column, styles.columnLeft]}>
              {leftCol.map(({ post, height }) => (
                <PinCard
                  key={post.id}
                  post={post}
                  imageHeight={height}
                  colors={colors}
                  onPress={(id) => router.push(`/feed/${id}` as any)}
                  onLike={handleLike}
                />
              ))}
            </View>
            <View style={styles.column}>
              {rightCol.map(({ post, height }) => (
                <PinCard
                  key={post.id}
                  post={post}
                  imageHeight={height}
                  colors={colors}
                  onPress={(id) => router.push(`/feed/${id}` as any)}
                  onLike={handleLike}
                />
              ))}
            </View>
          </View>

          {hasMore && (
            <ActivityIndicator
              style={{ paddingVertical: 20 }}
              color={colors.textTertiary}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Nav Bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },

  // Masonry
  scrollContent: {
    paddingHorizontal: PADDING,
    paddingTop: PADDING,
    paddingBottom: 40,
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
  pinStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinStatText: {
    fontSize: 11,
    fontWeight: "600",
    marginRight: 6,
  },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
