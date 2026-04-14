import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";

const CARD_PADDING = 24;

const PAGE_SIZE = 12;

const BrandsTab = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBrands = useCallback(async (pageNum: number = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${getApiUrl()}/brands?limit=${PAGE_SIZE}&page=${pageNum}&sortBy=name&sortOrder=ASC`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        const items = data.items || data.data || data;
        setBrands((prev) => (append ? [...prev, ...items] : items));
        setHasMore(data.hasNextPage ?? items.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  const fetchFollowedBrands = useCallback(async () => {
    if (!token) { setFollowedIds(new Set()); return; }
    try {
      const response = await fetch(`${getApiUrl()}/brands/user/followed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFollowedIds(new Set(data.map((b: any) => b.id)));
      }
    } catch (error) {
      console.error("Error fetching followed brands:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchBrands();
    fetchFollowedBrands();
  }, [fetchBrands, fetchFollowedBrands]);

  useFocusEffect(
    useCallback(() => {
      fetchBrands();
      fetchFollowedBrands();
    }, [fetchBrands, fetchFollowedBrands])
  );

  const toggleFollow = async (brandId: number) => {
    if (!token) { router.push("/auth/login"); return; }
    setTogglingId(brandId);
    const wasFollowing = followedIds.has(brandId);
    try {
      const response = await fetch(`${getApiUrl()}/brands/follow/${brandId}`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setFollowedIds((prev) => {
          const next = new Set(prev);
          wasFollowing ? next.delete(brandId) : next.add(brandId);
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const getBrandImage = (brand: any): string | null => {
    if (brand.logo) return brand.logo;
    if (brand.products?.length > 0) {
      const p = brand.products[0];
      if (p.images?.length > 0) return p.images[0];
      if (p.mainImage) return p.mainImage;
    }
    return null;
  };

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase();
    return brands.filter((b) => b.name?.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  const renderBrandCard = ({ item, index }: { item: any; index: number }) => {
    const image = getBrandImage(item);
    const isFollowed = followedIds.has(item.id);
    const num = String(index + 1).padStart(3, "0");

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/brands/${item.id}` as any)}
        activeOpacity={0.85}
      >
        {/* Square image */}
        <View style={styles.imageWrap}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          {/* Index badge */}
          <View style={styles.indexBadge}>
            <Text style={styles.indexBadgeText}>{num}</Text>
          </View>

          {/* Follow heart overlay */}
          <TouchableOpacity
            style={styles.heartOverlay}
            onPress={(e) => { e.stopPropagation(); toggleFollow(item.id); }}
            disabled={togglingId === item.id}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {togglingId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons
                name={isFollowed ? "heart" : "heart-outline"}
                size={18}
                color="#ffffff"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.brandName} numberOfLines={1}>
            {item.name?.toUpperCase()}
          </Text>
          {item.location ? (
            <Text style={styles.brandLocation} numberOfLines={1}>
              {item.location.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.header}>
      {/* Label */}
      <Text style={styles.searchLabel}>SEARCH_ARCHIVE</Text>

      {/* Big search input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="ENTER BRAND NAME"
          placeholderTextColor="#dddddd"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="characters"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.searchIcon}>
            <Ionicons name="close" size={28} color="#000000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.searchIcon}>
            <Ionicons name="search" size={28} color="#000000" />
          </View>
        )}
      </View>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.footer}>
      {hasMore && !searchQuery && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={() => fetchBrands(page + 1, true)}
          disabled={loadingMore}
          activeOpacity={0.85}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.loadMoreText}>LOAD MORE BRANDS</Text>
          )}
        </TouchableOpacity>
      )}
      <View style={{ height: 100 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ListHeader />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        </>
      ) : (
        <FlatList
          data={filteredBrands}
          renderItem={renderBrandCard}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>NO BRANDS FOUND</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },

  // ── Header / Search ───────────────────────────────
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 48,
    paddingBottom: 40,
    borderBottomWidth: 0,
  },
  searchLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#777777",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 28,
    color: "#000000",
    letterSpacing: -0.5,
    textTransform: "uppercase",
    paddingVertical: 0,
  },
  searchIcon: {
    paddingBottom: 2,
    paddingLeft: 8,
  },

  // ── List ─────────────────────────────────────────
  listContent: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 40,
  },

  // ── Brand card ────────────────────────────────────
  card: {
    width: "100%",
    marginBottom: 48,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#eeeeee",
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: "#eeeeee",
  },
  indexBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#000000",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  indexBadgeText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#ffffff",
    letterSpacing: 1,
  },
  heartOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    gap: 3,
  },
  brandName: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 15,
    color: "#000000",
    letterSpacing: -0.3,
  },
  brandLocation: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#aaaaaa",
    letterSpacing: 2,
  },

  // ── Footer ────────────────────────────────────────
  footer: {
    paddingTop: 16,
  },
  loadMoreBtn: {
    backgroundColor: "#000000",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
  },
  loadMoreText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 11,
    color: "#ffffff",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // ── Empty ─────────────────────────────────────────
  empty: {
    paddingTop: 64,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#aaaaaa",
    letterSpacing: 3,
  },
});

export default BrandsTab;
