import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Share,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import Header from "@/components/Header";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = 150;

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [activePinProductId, setActivePinProductId] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Double-tap heart animation
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeartAnimation = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 300 }),
      withDelay(400, withTiming(0, { duration: 300 })),
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 300 })),
    );
  }, []);

  const fetchPost = useCallback(async () => {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [postRes, commentsRes] = await Promise.all([
        fetch(`${getApiUrl()}/feed/posts/${postId}`, { headers }),
        fetch(`${getApiUrl()}/feed/posts/${postId}/comments?page=1&limit=20`),
      ]);

      if (postRes.ok) setPost(await postRes.json());
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.data);
        setHasMoreComments(1 < data.pagination.totalPages);
        setCommentPage(1);
      }
    } catch (e) {
      console.error("Post fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [postId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchPost();
    }, [fetchPost]),
  );

  const handleLike = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/feed/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setPost((p: any) => ({
          ...p,
          isLiked: result.liked,
          likeCount: result.likeCount,
        }));
      }
    } catch {}
  };

  const handleDoubleTapLike = useCallback(() => {
    triggerHeartAnimation();
    // Only like, don't unlike on double-tap
    if (!post?.isLiked) {
      handleLike();
    }
  }, [post?.isLiked, token]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTapLike)();
    });

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/feed/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setPost((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      setCommentText("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/feed/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setPost((p: any) => ({
          ...p,
          commentCount: Math.max(0, (p.commentCount || 0) - 1),
        }));
      }
    } catch {}
  };

  const loadMoreComments = async () => {
    if (!hasMoreComments) return;
    const nextPage = commentPage + 1;
    try {
      const res = await fetch(
        `${getApiUrl()}/feed/posts/${postId}/comments?page=${nextPage}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, ...data.data]);
        setHasMoreComments(nextPage < data.pagination.totalPages);
        setCommentPage(nextPage);
      }
    } catch {}
  };

  const showCommentOptions = (commentId: number) => {
    Alert.alert("Comment", undefined, [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteComment(commentId),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const canDeleteComment = (comment: any) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (comment.userId === user.id) return true;
    if (post?.brand && user.role === "brandOwner") return true;
    return false;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: colors.surface }}
        >
          <Header />
        </SafeAreaView>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: colors.surface }}
        >
          <Header />
        </SafeAreaView>
        <View style={styles.center}>
          <Text style={{ color: colors.textTertiary }}>Post not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {/* Brand header */}
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => router.push(`/brands/${post.brand.id}` as any)}
              activeOpacity={0.7}
            >
              {post.brand.logo ? (
                <Image
                  source={{ uri: post.brand.logo }}
                  style={styles.brandAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.brandAvatar,
                    { backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <Text style={[styles.brandInitial, { color: colors.text }]}>
                    {post.brand.name?.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={[styles.brandName, { color: colors.text }]}>
                  {post.brand.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Share.share({
                    title: post.brand.name,
                    message: `${post.caption || post.brand.name}`.trim(),
                  })
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Images with double-tap to like */}
            <GestureDetector gesture={doubleTap}>
              <Animated.View>
                {post.images.length === 1 ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: post.images[0] }}
                      style={[styles.postImage, { backgroundColor: colors.borderLight }]}
                      resizeMode="cover"
                    />
                    {/* Product pin overlays */}
                    {(post.postProducts || [])
                      .filter((pp: any) => pp.xPercent !== null && pp.yPercent !== null)
                      .map((pp: any) => (
                        <TouchableOpacity
                          key={pp.productId}
                          style={{
                            position: "absolute",
                            left: `${pp.xPercent}%` as any,
                            top: `${pp.yPercent}%` as any,
                            width: 22, height: 22, borderRadius: 11,
                            backgroundColor: "white", borderWidth: 2, borderColor: "black",
                            transform: [{ translateX: -11 }, { translateY: -11 }],
                            justifyContent: "center", alignItems: "center",
                          }}
                          onPress={() => setActivePinProductId(activePinProductId === pp.productId ? null : pp.productId)}
                        >
                          <Ionicons name="pricetag" size={10} color="black" />
                        </TouchableOpacity>
                      ))}
                    {/* Active pin popup */}
                    {activePinProductId && (
                      <TouchableOpacity
                        style={[styles.pinPopup, { backgroundColor: colors.background }]}
                        onPress={() => router.push(`/products/${activePinProductId}` as any)}
                        activeOpacity={0.9}
                      >
                        {(() => {
                          const pp = post.postProducts.find((p: any) => p.productId === activePinProductId);
                          return pp ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {pp.product?.images?.[0] && (
                                <Image source={{ uri: pp.product.images[0] }} style={{ width: 36, height: 36, borderRadius: 4 }} />
                              )}
                              <View>
                                <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
                                  {pp.product?.name}
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                                  ${Number(pp.product?.price || 0).toFixed(2)}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                            </View>
                          ) : null;
                        })()}
                      </TouchableOpacity>
                    )}
                    <Animated.View
                      style={[styles.heartOverlay, heartAnimatedStyle]}
                      pointerEvents="none"
                    >
                      <Ionicons name="heart" size={80} color={colors.textInverse} />
                    </Animated.View>
                  </View>
                ) : (
                  <View>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        setImageIndex(
                          Math.round(
                            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                          ),
                        );
                      }}
                    >
                      {post.images.map((uri: string, i: number) => (
                        <Image
                          key={i}
                          source={{ uri }}
                          style={[styles.postImage, { backgroundColor: colors.borderLight }]}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    <Animated.View
                      style={[styles.heartOverlay, heartAnimatedStyle]}
                      pointerEvents="none"
                    >
                      <Ionicons name="heart" size={80} color={colors.textInverse} />
                    </Animated.View>
                    <View style={styles.dots}>
                      {post.images.map((_: any, i: number) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                i === imageIndex
                                  ? colors.text
                                  : colors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            </GestureDetector>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={post.isLiked ? colors.danger : colors.text}
                />
                {post.likeCount > 0 && (
                  <Text
                    style={[
                      styles.actionCount,
                      { color: post.isLiked ? "#C41E3A" : colors.text },
                    ]}
                  >
                    {post.likeCount}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => inputRef.current?.focus()}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color={colors.text}
                />
                {post.commentCount > 0 && (
                  <Text style={[styles.actionCount, { color: colors.text }]}>
                    {post.commentCount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {post.caption && (
              <Text style={[styles.caption, { color: colors.text }]}>
                <Text style={styles.captionBrand}>{post.brand.name} </Text>
                {post.caption}
              </Text>
            )}

            {/* Tagged products */}
            {post.postProducts?.length > 0 && (
              <View style={styles.productsSection}>
                <Text
                  style={[
                    styles.productsSectionTitle,
                    { color: colors.textTertiary },
                  ]}
                >
                  TAGGED PRODUCTS
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.productsContainer}
                >
                  {post.postProducts.map((pp: any) => (
                    <TouchableOpacity
                      key={pp.product.id}
                      style={[
                        styles.productCard,
                        { borderColor: colors.border },
                      ]}
                      onPress={() =>
                        router.push(`/products/${pp.product.id}` as any)
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.productImageWrap}>
                        {pp.product.images?.[0] || pp.product.mainImage ? (
                          <Image
                            source={{
                              uri:
                                pp.product.images?.[0] || pp.product.mainImage,
                            }}
                            style={[styles.productCardImage, { backgroundColor: colors.surfaceRaised }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.productCardImage,
                              {
                                backgroundColor: colors.border,
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Ionicons
                              name="cube-outline"
                              size={28}
                              color={colors.textTertiary}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.productCardInfo}>
                        <Text
                          style={[
                            styles.productCardName,
                            { color: colors.text },
                          ]}
                          numberOfLines={2}
                        >
                          {pp.product.name}
                        </Text>
                        <View style={styles.productPriceRow}>
                          {pp.product.salePrice ? (
                            <>
                              <Text
                                style={[
                                  styles.productCardPrice,
                                  { color: colors.text },
                                ]}
                              >
                                $
                                {Number(pp.product.salePrice).toFixed(2)}
                              </Text>
                              <Text
                                style={[
                                  styles.productCardOldPrice,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                ${Number(pp.product.price).toFixed(2)}
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={[
                                styles.productCardPrice,
                                { color: colors.text },
                              ]}
                            >
                              ${Number(pp.product.price).toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.productCardArrow}>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.textTertiary}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Comments header */}
            <View
              style={[styles.commentsHeader, { borderTopColor: colors.border }]}
            >
              <Text
                style={[styles.commentsTitle, { color: colors.textTertiary }]}
              >
                COMMENTS
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            {item.user?.avatar ? (
              <Image
                source={{ uri: item.user.avatar }}
                style={styles.commentAvatar}
              />
            ) : (
              <View
                style={[
                  styles.commentAvatar,
                  { backgroundColor: colors.surfaceRaised },
                ]}
              >
                <Ionicons name="person" size={14} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.commentBody}>
              <Text style={[styles.commentUser, { color: colors.text }]}>
                {item.user?.name || "User"}
              </Text>
              <Text style={[styles.commentText, { color: colors.text }]}>
                {item.text}
              </Text>
              <Text
                style={[styles.commentTime, { color: colors.textTertiary }]}
              >
                {getTimeAgo(item.createdAt)}
              </Text>
            </View>
            {canDeleteComment(item) && (
              <TouchableOpacity
                onPress={() => showCommentOptions(item.id)}
                style={styles.commentMenu}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={
          hasMoreComments ? (
            <TouchableOpacity
              onPress={loadMoreComments}
              style={styles.loadMore}
            >
              <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
                Load more comments
              </Text>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Comment input */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
        ) : (
          <View
            style={[
              styles.inputAvatar,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="person" size={14} color={colors.textTertiary} />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
            },
          ]}
          placeholder={token ? "Write a comment..." : "Log in to comment"}
          placeholderTextColor={colors.textTertiary}
          value={commentText}
          onChangeText={setCommentText}
          editable={!!token}
          onFocus={() => {
            if (!token) router.push("/auth/login");
          }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
          style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.3 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="send" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  listContent: { paddingBottom: 20 },

  // Card header
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

  // Image
  imageContainer: {
    position: "relative",
  },
  pinPopup: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    // backgroundColor set dynamically via theme
  },
  heartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 0 },
  dotActive: {},
  dotInactive: {},

  // Actions
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionCount: { fontSize: 13, fontWeight: "600" },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  captionBrand: { fontWeight: "700" },

  // Tagged products
  productsSection: {
    marginTop: 16,
  },
  productsSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  productsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImageWrap: {
    width: PRODUCT_CARD_WIDTH,
    height: PRODUCT_CARD_WIDTH,
  },
  productCardImage: {
    width: "100%",
    height: "100%",
    // backgroundColor set dynamically via theme
  },
  productCardInfo: {
    padding: 10,
  },
  productCardName: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productCardPrice: {
    fontSize: 13,
    fontWeight: "800",
  },
  productCardOldPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  productCardArrow: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },

  // Comments
  commentsHeader: {
    borderTopWidth: 0.5,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  commentsTitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  commentText: { fontSize: 13, lineHeight: 18 },
  commentTime: { fontSize: 11, marginTop: 4 },
  commentMenu: { padding: 6, marginLeft: 4 },
  loadMore: { paddingHorizontal: 16, paddingVertical: 12 },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  sendBtn: { padding: 6 },
});
