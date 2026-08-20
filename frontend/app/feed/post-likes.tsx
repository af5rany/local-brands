import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

interface Liker {
  user: { id: number; name: string; avatar: string | null } | null;
  createdAt: string;
}

const PostLikesScreen = () => {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetch_ = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`${getApiUrl()}/feed/posts/${postId}/likes?page=${pageNum}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) setLikers(data.data || []);
        else setLikers((prev) => [...prev, ...(data.data || [])]);
        setHasMore(pageNum < (data.pagination?.totalPages ?? 1));
        setPage(pageNum);
      }
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => { fetch_(1); }, [fetch_]);

  const navigateToProfile = async (userId: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/users/${userId}/public-profile`);
      if (res.ok) {
        const profile = await res.json();
        if (profile.brandId) router.push(`/brands/${profile.brandId}` as any);
        else router.push(`/users/${userId}` as any);
      }
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>LIKES</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} />
      ) : (
        <FlatList
          data={likers}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => {
            if (!item.user) return null;
            return (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.borderLight }]}
                onPress={() => navigateToProfile(item.user!.id)}
                activeOpacity={0.7}
              >
                {item.user.avatar ? (
                  <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised }]}>
                    <Ionicons name="person" size={18} color={colors.textTertiary} />
                  </View>
                )}
                <Text style={[styles.name, { color: colors.text }]}>{item.user.name}</Text>
              </TouchableOpacity>
            );
          }}
          onEndReached={() => { if (hasMore && !loadingMore) fetch_(page + 1); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.text} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textTertiary }]}>No likes yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 14, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});

export default PostLikesScreen;
