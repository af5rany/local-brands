import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  if (d > 0) return `${d}D`;
  if (h > 0) return `${h}H`;
  return "NOW";
}

// ── Stories Strip ──
const StoriesStrip: React.FC<{
  brands: { id: number; name: string; logo?: string }[];
  colors: any;
  onBrandPress: (id: number) => void;
  onCreatePress: () => void;
  showCreate: boolean;
}> = ({ brands, colors, onBrandPress, onCreatePress, showCreate }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    contentContainerStyle={{ padding: 14, gap: 12, flexDirection: "row" }}
  >
    {showCreate && (
      <TouchableOpacity
        onPress={onCreatePress}
        activeOpacity={0.7}
        style={{ alignItems: "center", gap: 6 }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.text,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </View>
        <Text style={{ fontSize: 8, letterSpacing: 1.5, color: colors.textTertiary }}>YOU</Text>
      </TouchableOpacity>
    )}
    {brands.map((b) => (
      <TouchableOpacity
        key={b.id}
        onPress={() => onBrandPress(b.id)}
        activeOpacity={0.7}
        style={{ alignItems: "center", gap: 6 }}
      >
        <View style={{ width: 56, height: 56, padding: 2, borderWidth: 2, borderColor: colors.text }}>
          {b.logo ? (
            <Image source={{ uri: b.logo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.text,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.background, fontSize: 18, fontWeight: "900" }}>
                {b.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 8, letterSpacing: 1.5, color: colors.text }} numberOfLines={1}>
          {b.name.toUpperCase().substring(0, 6)}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ── Post Card (Monolith design) ──
const PostCard: React.FC<{
  post: PostData;
  colors: any;
  onPress: (id: number) => void;
  onLike: (id: number) => void;
  onBrandPress: (id: number) => void;
  onProductPress: (id: number) => void;
}> = ({ post, colors, onPress, onLike, onBrandPress, onProductPress }) => {
  const authorName =
    [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ").toUpperCase() ||
    post.brand.name.toUpperCase();
  const hasProduct = post.postProducts?.[0]?.product ?? null;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {/* Post header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => onBrandPress(post.brand.id)} activeOpacity={0.7}>
          {post.brand.logo ? (
            <Image
              source={{ uri: post.brand.logo }}
              style={{ width: 36, height: 36, backgroundColor: colors.surfaceRaised }}
            />
          ) : (
            <View style={{ width: 36, height: 36, backgroundColor: colors.text, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: "900" }}>
                {post.brand.name?.charAt(0) || "B"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, letterSpacing: 0.3 }}>
            {authorName}
          </Text>
          <Text style={{ fontSize: 9, color: colors.textTertiary, letterSpacing: 1.5, marginTop: 1 }}>
            {timeAgo(post.createdAt)} · POST
          </Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
      </View>

      {/* Full-bleed image */}
      <TouchableOpacity onPress={() => onPress(post.id)} activeOpacity={0.92}>
        {post.images[0] ? (
          <Image
            source={{ uri: post.images[0] }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.8, backgroundColor: colors.surfaceRaised }} />
        )}
      </TouchableOpacity>

      {/* Action row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{ flexDirection: "row", gap: 18, flex: 1 }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            onPress={() => onLike(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={post.isLiked ? "heart" : "heart-outline"}
              size={20}
              color={post.isLiked ? colors.accentRed : colors.text}
            />
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.text, letterSpacing: 1.5 }}>
              {post.likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            onPress={() => onPress(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.text, letterSpacing: 1.5 }}>
              {post.commentCount}
            </Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="bookmark-outline" size={20} color={colors.text} />
      </View>

      {/* Caption */}
      {post.caption ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            <Text style={{ fontWeight: "700", color: colors.text }}>
              {authorName.toLowerCase().replace(/\s+/g, "")}{" "}
            </Text>
            {post.caption}
          </Text>
        </View>
      ) : null}

      {/* Product tag */}
      {hasProduct && (
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={() => onProductPress(hasProduct.id)}
          activeOpacity={0.7}
        >
          <View style={{ width: 32, height: 32, backgroundColor: colors.surfaceRaised }}>
            {hasProduct.images?.[0] && (
              <Image source={{ uri: hasProduct.images[0] }} style={{ width: 32, height: 32 }} resizeMode="cover" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "700", color: colors.text, letterSpacing: 2 }}>
              {post.brand.name.toUpperCase()} · {hasProduct.name.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 9, color: colors.textTertiary, letterSpacing: 1.5, marginTop: 2 }}>
              SHOP THE LOOK ›
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Tab Switcher ──
const TAB_ORDER: ActiveTab[] = ["following", "forYou"];
const TAB_LABELS: Record<ActiveTab, string> = {
  following: "FOLLOWING",
  forYou: "FOR YOU",
};

const TabSwitcher: React.FC<{
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  colors: any;
}> = ({ activeTab, onChange, colors }) => (
  <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }}>
    {TAB_ORDER.map((tab) => {
      const isActive = activeTab === tab;
      return (
        <TouchableOpacity
          key={tab}
          style={{ flex: 1, alignItems: "center", paddingVertical: 14 }}
          onPress={() => onChange(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: isActive ? colors.text : colors.textTertiary,
              letterSpacing: 2,
            }}
          >
            {TAB_LABELS[tab]}
          </Text>
          {isActive && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 16,
                right: 16,
                height: 2,
                backgroundColor: colors.text,
              }}
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
  const { token, user, isGuest } = useAuth();
  const isAuthenticated = !!token && !isGuest;
  const { isConnected } = useNetwork();

  const { register, unregister } = useScrollToTop();
  const followingRef = useRef<FlatList>(null);
  const forYouRef = useRef<FlatList>(null);
  const pagerRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("following");

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    const index = TAB_ORDER.indexOf(tab);
    pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  }, []);

  useEffect(() => {
    register("feed", () => {
      if (activeTab === "forYou") forYouRef.current?.scrollToOffset({ offset: 0, animated: true });
      else followingRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  // Unique brands for stories strip
  const storyBrands = useMemo(() => {
    const all = [...posts, ...forYouPosts];
    const seen = new Set<number>();
    return all.reduce((acc, p) => {
      if (!seen.has(p.brand.id)) {
        seen.add(p.brand.id);
        acc.push(p.brand);
      }
      return acc;
    }, [] as PostData["brand"][]);
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
      if (isAuthenticated) fetchFollowingFeed(1);
      else { setPosts([]); setLoading(false); }
      fetchForYouFeed(1);
    }, [fetchFollowingFeed, fetchForYouFeed, isAuthenticated]),
  );

  const handleRefresh = () => {
    fetchFollowingFeed(1, true);
    fetchForYouFeed(1, true);
  };

  const updatePostLike = (postId: number, isLiked: boolean, likeCount: number) => {
    const update = (prev: PostData[]) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked, likeCount } : p));
    setPosts(update);
    setForYouPosts(update);
  };

  const handleLike = async (postId: number) => {
    if (!token) { router.push("/auth/login"); return; }
    const post = posts.find((p) => p.id === postId) || forYouPosts.find((p) => p.id === postId);
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

  const postPress = (id: number) => router.push(`/feed/${id}` as any);
  const brandPress = (id: number) => router.push(`/brands/${id}` as any);
  const productPress = (id: number) => router.push(`/products/${id}` as any);
  const isBrandOwner = user?.role === "brandOwner";

  if (!isConnected && posts.length === 0 && forYouPosts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <OfflinePlaceholder onRetry={() => fetchFollowingFeed(1)} />
      </View>
    );
  }

  const renderEmptyFollowing = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>SIGN IN TO FOLLOW</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            Create an account to follow brands and see their latest posts here.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: colors.text }]}
              onPress={() => router.push("/auth/login" as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctaText, { color: colors.background }]}>SIGN IN →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaOutline, { borderColor: colors.text }]}
              onPress={() => router.push("/auth/register" as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctaText, { color: colors.text }]}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>NO POSTS YET</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          Follow brands you love to see their posts here.
        </Text>
        <TouchableOpacity
          style={[styles.ctaPrimary, { backgroundColor: colors.text }]}
          onPress={() => handleTabChange("forYou")}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaText, { color: colors.background }]}>FOR YOU →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPost = useCallback(
    ({ item }: { item: PostData }) => (
      <PostCard
        post={item}
        colors={colors}
        onPress={postPress}
        onLike={handleLike}
        onBrandPress={brandPress}
        onProductPress={productPress}
      />
    ),
    [colors, posts, forYouPosts],
  );

  const storiesHeader = (
    <StoriesStrip
      brands={storyBrands.slice(0, 8)}
      colors={colors}
      onBrandPress={brandPress}
      onCreatePress={() => router.push("/feed/create" as any)}
      showCreate={isBrandOwner}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TabSwitcher activeTab={activeTab} onChange={handleTabChange} colors={colors} />

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
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveTab(TAB_ORDER[idx] ?? "following");
          }}
          style={{ flex: 1 }}
        >
          {/* Page 0: Following */}
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <FlatList
              ref={followingRef}
              data={isAuthenticated ? posts : []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPost}
              ListHeaderComponent={storiesHeader}
              ListEmptyComponent={renderEmptyFollowing}
              showsVerticalScrollIndicator={false}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                reportScroll(e.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
              onEndReached={() => {
                if (!followingHasMore || followingLoadingMore.current) return;
                followingLoadingMore.current = true;
                fetchFollowingFeed(followingPage + 1);
              }}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />
              }
              contentContainerStyle={{ paddingBottom: tabBarHeight }}
              ListFooterComponent={
                followingHasMore && posts.length > 0 ? (
                  <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.textTertiary} />
                ) : null
              }
            />
          </View>

          {/* Page 1: For You */}
          <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
            <FlatList
              ref={forYouRef}
              data={forYouPosts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPost}
              ListHeaderComponent={storiesHeader}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>NOTHING HERE YET</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                    Check back soon — posts will appear here.
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                reportScroll(e.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
              onEndReached={() => {
                if (!forYouHasMore || forYouLoadingMore.current) return;
                forYouLoadingMore.current = true;
                fetchForYouFeed(forYouPage + 1);
              }}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />
              }
              contentContainerStyle={{ paddingBottom: tabBarHeight }}
              ListFooterComponent={
                forYouHasMore && forYouPosts.length > 0 ? (
                  <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.textTertiary} />
                ) : null
              }
            />
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
  empty: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  emptyActions: {
    width: "100%",
    gap: 10,
    marginTop: 12,
  },
  ctaPrimary: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaOutline: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
});
