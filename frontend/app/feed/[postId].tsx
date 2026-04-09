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
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const inputRef = useRef<TextInput>(null);

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
    // Brand owner of the post's brand
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
            </TouchableOpacity>

            {/* Images */}
            {post.images.length === 1 ? (
              <Image
                source={{ uri: post.images[0] }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : (
              <View>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    setImageIndex(
                      Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
                    );
                  }}
                >
                  {post.images.map((uri: string, i: number) => (
                    <Image
                      key={i}
                      source={{ uri }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                <View style={styles.dots}>
                  {post.images.map((_: any, i: number) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === imageIndex
                          ? styles.dotActive
                          : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <Ionicons
                  name={post.isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={post.isLiked ? "#ef4444" : colors.text}
                />
                {post.likeCount > 0 && (
                  <Text
                    style={[
                      styles.actionCount,
                      { color: post.isLiked ? "#ef4444" : colors.text },
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.productsScroll}
                contentContainerStyle={styles.productsContainer}
              >
                {post.postProducts.map((pp: any) => (
                  <TouchableOpacity
                    key={pp.product.id}
                    style={[
                      styles.taggedProduct,
                      { borderColor: colors.border },
                    ]}
                    onPress={() =>
                      router.push(`/products/${pp.product.id}` as any)
                    }
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
                        style={[
                          styles.taggedProductName,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {pp.product.name}
                      </Text>
                      <Text
                        style={[
                          styles.taggedProductPrice,
                          { color: colors.textTertiary },
                        ]}
                      >
                        ${Number(pp.product.price).toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  brandInitial: { fontSize: 14, fontWeight: "800" },
  headerInfo: { marginLeft: 10, flex: 1 },
  brandName: { fontSize: 13, fontWeight: "700" },

  // Image
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#f0f0f0",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: "#000" },
  dotInactive: { backgroundColor: "#ccc" },

  // Actions
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 16,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  actionCount: { fontSize: 13, fontWeight: "600" },
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
    letterSpacing: 1.5,
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
    borderRadius: 16,
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
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  sendBtn: { padding: 6 },
});
