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
  NativeScrollEvent,
  NativeSyntheticEvent,
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

// ── Pin Card ──
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
      <View
        style={[
          styles.pinImageWrap,
          { height: imageHeight, backgroundColor: colors.borderLight },
        ]}
      >
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
                <Text
                  style={[styles.pinBrandInitial, { color: colors.text }]}
                >
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
function buildMasonryColumns(
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

// ── Masonry Grid ──
const MasonryGrid: React.FC<{
  posts: PostData[];
  imageHeights: Record<number, number>;
  colors: any;
  onPostPress: (id: number) => void;
  onLike: (id: number) => void;
  onBrandPress: (id: number) => void;
}> = ({ posts, imageHeights, colors, onPostPress, onLike, onBrandPress }) => {
  const { leftCol, rightCol } = buildMasonryColumns(posts, imageHeights);
  return (
    <View style={styles.masonryRow}>
      <View style={[styles.column, styles.columnLeft]}>
        {leftCol.map(({ post, height }) => (
          <PinCard
            key={post.id}
            post={post}
            imageHeight={height}
            colors={colors}
            onPress={onPostPress}
            onLike={onLike}
            onBrandPress={onBrandPress}
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
            onPress={onPostPress}
            onLike={onLike}
            onBrandPress={onBrandPress}
          />
        ))}
      </View>
    </View>
  );
};

// ── Tab Switcher — Following first, For You second ──
const TAB_ORDER: ActiveTab[] = ["following", "forYou"];
const TAB_LABELS: Record<ActiveTab, string> = {
  following: "Following",
  forYou: "For You",
};

const TabSwitcher: React.FC<{
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  colors: any;
}> = ({ activeTab, onChange, colors }) => (
  <View
    style={[
      styles.tabBar,
      {
        backgroundColor: colors.background,
        borderBottomColor: colors.borderLight,
      },
    ]}
  >
    {TAB_ORDER.map((tab) => {
      const isActive = activeTab === tab;
      return (
        <TouchableOpacity
          key={tab}
          style={styles.tabItem}
          onPress={() => onChange(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: isActive ? colors.text : colors.textTertiary },
              isActive && styles.tabLabelActive,
            ]}
          >
            {TAB_LABELS[tab]}
          </Text>
          {isActive && (
            <View
              style={[styles.tabUnderline, { backgroundColor: colors.text }]}
            />
          )}
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
  const { token, user } = useAuth();
  const { isConnected } = useNetwork();

  const { register, unregister } = useScrollToTop();
  const followingRef = useRef<ScrollView>(null);
  const forYouRef = useRef<ScrollView>(null);
  const pagerRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("following");

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    const index = TAB_ORDER.indexOf(tab);
    pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  }, []);

  useEffect(() => {
    register("feed", () => {
      if (activeTab === "forYou")
        forYouRef.current?.scrollTo({ y: 0, animated: true });
      else followingRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => unregister("feed");
  }, [activeTab]);

  // ── Following state ──
  const [posts, setPosts] = useState<PostData[]>([]);
  const [followingPage, setFollowingPage] = useState(1);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const followingLoadingMore = useRef(false);

  // ── For You state ──
  const [forYouPosts, setForYouPosts] = useState<PostData[]>([]);
  const [forYouPage, setForYouPage] = useState(1);
  const [forYouHasMore, setForYouHasMore] = useState(true);
  const forYouLoadingMore = useRef(false);

  // ── Shared ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageHeights, setImageHeights] = useState<Record<number, number>>({});

  // Precompute image heights for all posts
  useEffect(() => {
    const allPosts = [...posts, ...forYouPosts];
    for (const post of allPosts) {
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
  }, [posts, forYouPosts]);

  const fetchFollowingFeed = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const url = token
          ? `${getApiUrl()}/feed?page=${pageNum}&limit=20&followedOnly=true`
          : `${getApiUrl()}/feed?page=${pageNum}&limit=20`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch following feed");
        const data = await res.json();
        const newPosts: PostData[] = data.data || [];
        if (pageNum === 1) setPosts(newPosts);
        else setPosts((prev) => [...prev, ...newPosts]);
        setFollowingHasMore(pageNum < (data.pagination?.totalPages ?? 1));
        setFollowingPage(pageNum);
      } catch (e) {
        console.error("Following feed error:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        followingLoadingMore.current = false;
      }
    },
    [token],
  );

  const fetchForYouFeed = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const headers: any = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(
          `${getApiUrl()}/feed/for-you?page=${pageNum}&limit=20`,
          { headers },
        );
        if (!res.ok) throw new Error("Failed to fetch for-you feed");
        const data = await res.json();
        const newPosts: PostData[] = data.data || [];
        if (pageNum === 1) setForYouPosts(newPosts);
        else setForYouPosts((prev) => [...prev, ...newPosts]);
        setForYouHasMore(pageNum < (data.pagination?.totalPages ?? 1));
        setForYouPage(pageNum);
      } catch (e) {
        console.error("For You feed error:", e);
      } finally {
        setRefreshing(false);
        forYouLoadingMore.current = false;
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      fetchFollowingFeed(1);
      fetchForYouFeed(1);
    }, [fetchFollowingFeed, fetchForYouFeed]),
  );

  const handleRefresh = () => {
    fetchFollowingFeed(1, true);
    fetchForYouFeed(1, true);
  };

  const handleLoadMore = () => {
    if (activeTab === "following") {
      if (!followingHasMore || followingLoadingMore.current) return;
      followingLoadingMore.current = true;
      fetchFollowingFeed(followingPage + 1);
    } else {
      if (!forYouHasMore || forYouLoadingMore.current) return;
      forYouLoadingMore.current = true;
      fetchForYouFeed(forYouPage + 1);
    }
  };

  const updatePostLike = (
    postId: number,
    isLiked: boolean,
    likeCount: number,
  ) => {
    const update = (prev: PostData[]) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked, likeCount } : p));
    setPosts(update);
    setForYouPosts(update);
  };

  const handleLike = async (postId: number) => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const post =
      posts.find((p) => p.id === postId) ||
      forYouPosts.find((p) => p.id === postId);
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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    reportScroll(contentOffset.y);
    if (
      contentSize.height - layoutMeasurement.height - contentOffset.y <
      400
    ) {
      handleLoadMore();
    }
  };

  const postPress = (id: number) => router.push(`/feed/${id}` as any);
  const brandPress = (id: number) => router.push(`/brands/${id}` as any);
  const isBrandOwner = user?.role === "brandOwner";

  if (!isConnected && posts.length === 0 && forYouPosts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflinePlaceholder onRetry={() => fetchFollowingFeed(1)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TabSwitcher
        activeTab={activeTab}
        onChange={handleTabChange}
        colors={colors}
      />

      {loading ? (
        <View>
          {[0, 1, 2].map((i) => (
            <FeedPostSkeleton key={i} />
          ))}
        </View>
      ) : (
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setActiveTab(TAB_ORDER[idx] ?? "following");
          }}
          style={{ flex: 1 }}
        >
          {/* ── Page 0: Following ── */}
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <ScrollView
              ref={followingRef}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: tabBarHeight },
              ]}
            >
              {posts.length > 0 ? (
                <>
                  <MasonryGrid
                    posts={posts}
                    imageHeights={imageHeights}
                    colors={colors}
                    onPostPress={postPress}
                    onLike={handleLike}
                    onBrandPress={brandPress}
                  />
                  {followingHasMore && (
                    <ActivityIndicator
                      style={{ paddingVertical: 20 }}
                      color={colors.textTertiary}
                    />
                  )}
                </>
              ) : (
                /* ── Following empty state ── */
                <View style={styles.empty}>
                  <Ionicons
                    name="compass-outline"
                    size={52}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    NO POSTS YET
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Follow brands you love to see their posts here.
                  </Text>
                  <View style={styles.emptyActions}>
                    <TouchableOpacity
                      style={[
                        styles.ctaPrimary,
                        { backgroundColor: colors.text },
                      ]}
                      onPress={() => handleTabChange("forYou")}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.ctaText, { color: colors.background }]}
                      >
                        FOR YOU →
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ctaOutline, { borderColor: colors.text }]}
                      onPress={() => router.push("/(tabs)/brands" as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ctaText, { color: colors.text }]}>
                        EXPLORE BRANDS
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ── Page 1: For You ── */}
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <ScrollView
              ref={forYouRef}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: tabBarHeight },
              ]}
            >
              {forYouPosts.length > 0 ? (
                <>
                  <MasonryGrid
                    posts={forYouPosts}
                    imageHeights={imageHeights}
                    colors={colors}
                    onPostPress={postPress}
                    onLike={handleLike}
                    onBrandPress={brandPress}
                  />
                  {forYouHasMore && (
                    <ActivityIndicator
                      style={{ paddingVertical: 20 }}
                      color={colors.textTertiary}
                    />
                  )}
                </>
              ) : (
                <View style={styles.empty}>
                  <Ionicons
                    name="images-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    NOTHING HERE YET
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Check back soon — posts will appear here.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
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
  tabLabelActive: { fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    borderRadius: 1,
  },

  // Scroll / masonry
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

  // Empty state
  empty: {
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 32,
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
  emptyActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  ctaPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ctaOutline: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  ctaText: {
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
