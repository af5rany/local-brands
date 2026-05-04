import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  TextInput,
  Easing,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import LookbookHero from "@/components/LookbookHero";
import ShopByLook from "@/components/ShopByLook";
import SearchModal from "@/components/SearchModal";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Skeleton } from "@/components/Skeleton";
import { useNetwork } from "@/context/NetworkContext";
import OfflinePlaceholder from "@/components/OfflinePlaceholder";
import { useHeaderVisibility } from "@/context/HeaderVisibilityContext";
import { useScrollToTop } from "@/context/ScrollToTopContext";

// const { width: SCREEN_W } = Dimensions.get("window");

// ── Static content ───────────────────────────────────────────────────────────
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=900&auto=format&fit=crop";

const FALLBACK_SPOTLIGHTS = [
  {
    id: "f-s1",
    name: "ATELIER\nNORTH 11",
    location: "LISBON · PORTUGAL",
    description: "A two-person studio working out of a converted warehouse in Lisbon. Cut-and-sew menswear assembled in runs of 30. Hand-finished, numbered, unrepeated.",
    image: "https://images.unsplash.com/photo-1558171813-3c2c28e06cbf?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "f-s2",
    name: "RAEY\nSTUDIO",
    location: "TOKYO · JAPAN",
    description: "Minimalist tailoring from Tokyo. Each season explores a single archetype. Their linen works are collected internationally and produced in runs of 20.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "f-s3",
    name: "ARCHIVE\nDEPT.",
    location: "BERLIN · GERMANY",
    description: "A Berlin-based collective focused on deadstock fabrics and archive reconstruction. Zero-waste by design, each piece carries provenance documentation.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  },
];

const FALLBACK_PICKS = [
  {
    id: undefined as number | undefined,
    num: "1/3",
    brand: "ATELIER N11",
    name: "THE OVERSIZED COAT",
    quote: '"A coat that ages well. Lisbon studio, 47 hours each."',
    price: "$480",
    image: "https://images.unsplash.com/photo-1548624313-0396b75de080?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: undefined as number | undefined,
    num: "2/3",
    brand: "RAEY",
    name: "WIDE-LEG TROUSER",
    quote: '"Best linen cut of the season. Sized down."',
    price: "$220",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b2c89?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: undefined as number | undefined,
    num: "3/3",
    brand: "ARCHIVE DEPT.",
    name: "BOXY CREW TEE",
    quote: '"The kind of basic you keep restocking."',
    price: "$95",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop",
  },
];

const FALLBACK_FEED = [
  {
    id: "1",
    realId: null as number | null,
    brand: "ATELIER N11",
    caption: "Behind the seam: 47 hours per coat.",
    ago: "2H",
    likes: "1.2K",
    comments: "47",
    image: "https://images.unsplash.com/photo-1558171813-3c2c28e06cbf?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "2",
    realId: null as number | null,
    brand: "RAEY",
    caption: "Off-white linen drop. Sized down.",
    ago: "5H",
    likes: "892",
    comments: "23",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=500&auto=format&fit=crop",
  },
  {
    id: "3",
    realId: null as number | null,
    brand: "ARCHIVE DEPT.",
    caption: "Deadstock wool — final pieces.",
    ago: "1D",
    likes: "2.1K",
    comments: "61",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop",
  },
];

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}M`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H`;
  return `${Math.floor(hrs / 24)}D`;
};

const MARQUEE_TEXT =
  "GLOBAL SHIPPING  —  ARCHIVE RESTOCK LIVE  —  CARE & ORIGIN ON EVERY PIECE  —  ";

const FALLBACK_BRANDS: Brand[] = [
  { id: "f-1", name: "MONOLITH" },
  { id: "f-2", name: "CELINE" },
  { id: "f-3", name: "DOVER ST." },
  { id: "f-4", name: "ATELIER N11" },
  { id: "f-5", name: "ARCHIVE" },
  { id: "f-6", name: "RAEY" },
  { id: "f-7", name: "PHOEBE" },
  { id: "f-8", name: "STÜSSY" },
];

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

// ── Marquee ──────────────────────────────────────────────────────────────────
const Marquee: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(0)).current;
  const W = MARQUEE_TEXT.length * 8.5;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: -W,
        duration: W * 40,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.marqueeWrap}>
      <Animated.Text
        style={[styles.marqueeText, { transform: [{ translateX: anim }] }]}
        numberOfLines={1}
      >
        {MARQUEE_TEXT.repeat(8)}
      </Animated.Text>
    </View>
  );
};

// ── Drop Bar ─────────────────────────────────────────────────────────────────
const DropBar: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.dropBar}>
      <Text style={styles.dropBarLeft}>● NEXT DROP — 04.29 · 18:00 GMT</Text>
      <Text style={styles.dropBarRight}>NOTIFY →</Text>
    </View>
  );
};

// ── Home Screen ──────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { ids: recentIds, clearProducts: clearRecentlyViewed } = useRecentlyViewed();
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  const { isConnected } = useNetwork();
  const { reportScroll } = useHeaderVisibility();
  const { register, unregister } = useScrollToTop();
  const mainScrollRef = useRef<ScrollView>(null);
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [stats, setStats] = useState({ brands: 0, products: 0 });
  const [feedPosts, setFeedPosts] = useState<typeof FALLBACK_FEED>([]);
  const [picks, setPicks] = useState<typeof FALLBACK_PICKS>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const hasLoadedOnce = useRef(false);
  const spotlightScrollRef = useRef<ScrollView>(null);
  const spotlightAutoTimer = useRef<ReturnType<typeof setInterval> | null>(null);


  // Brand spotlight auto-rotation
  const startSpotlightTimer = useCallback(() => {
    if (spotlightAutoTimer.current) clearInterval(spotlightAutoTimer.current);
    spotlightAutoTimer.current = setInterval(() => {
      setSpotlightIdx((i) => {
        const next = i + 1;
        const screenW = Dimensions.get("window").width;
        spotlightScrollRef.current?.scrollTo({ x: (next % spotlightSourceLenRef.current) * screenW, animated: true });
        return next;
      });
    }, 6000);
  }, []);

  const spotlightSourceLenRef = useRef(3);

  useEffect(() => {
    startSpotlightTimer();
    return () => { if (spotlightAutoTimer.current) clearInterval(spotlightAutoTimer.current); };
  }, [startSpotlightTimer]);

  useEffect(() => {
    register("index", () => mainScrollRef.current?.scrollTo({ y: 0, animated: true }));
    return () => unregister("index");
  }, []);

  const onSpotlightSwipe = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const screenW = Dimensions.get("window").width;
    const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
    setSpotlightIdx(idx);
    startSpotlightTimer(); // reset auto-rotation on manual swipe
  }, [startSpotlightTimer]);

  // Data fetch
  const fetchData = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const apiUrl = getApiUrl();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const [brandsResult, productsResult, feedResult, picksResult] =
      await Promise.allSettled([
        fetch(`${apiUrl}/brands?limit=10`, { headers }),
        fetch(`${apiUrl}/products?limit=1`, { headers }),
        fetch(`${apiUrl}/feed?limit=3`, { headers }),
        fetch(`${apiUrl}/products/bestsellers?limit=3`, { headers }),
      ]);

    if (brandsResult.status === "fulfilled" && brandsResult.value.ok) {
      const data = await brandsResult.value.json();
      const list: Brand[] = Array.isArray(data) ? data : data.items || [];
      setBrands(list.length > 0 ? list : FALLBACK_BRANDS);
      if (data.total) setStats((s) => ({ ...s, brands: data.total }));
    } else {
      setBrands(FALLBACK_BRANDS);
    }

    if (productsResult.status === "fulfilled" && productsResult.value.ok) {
      const data = await productsResult.value.json();
      if (data.total) setStats((s) => ({ ...s, products: data.total }));
    }

    if (feedResult.status === "fulfilled" && feedResult.value.ok) {
      const data = await feedResult.value.json();
      const items: any[] = Array.isArray(data) ? data : data.items || [];
      setFeedPosts(
        items.slice(0, 3).map((p: any, i: number) => ({
          id: String(p.id || i),
          realId: p.id as number | null,
          brand: (p.brand?.name || "—").toUpperCase(),
          caption: p.caption || "",
          ago: p.createdAt ? timeAgo(p.createdAt) : "—",
          likes: String(p.likeCount ?? 0),
          comments: String(p.commentCount ?? 0),
          image: p.images?.[0] || "",
        }))
      );
    }

    if (picksResult.status === "fulfilled" && picksResult.value.ok) {
      const data = await picksResult.value.json();
      const items: any[] = Array.isArray(data) ? data : data.items || [];
      setPicks(
        items.slice(0, 3).map((p: any, i: number) => ({
          id: p.id as number | undefined,
          num: `${i + 1}/3`,
          brand: (p.brand?.name || "—").toUpperCase(),
          name: (p.name || "").toUpperCase(),
          price: `$${Number(p.price || 0).toFixed(0)}`,
          image: p.mainImage || p.images?.[0] || "",
          quote: p.quote as string,
        }))
      );
    }

    hasLoadedOnce.current = true;
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) fetchData();
    }, [token])
  );

  useEffect(() => {
    if (recentIds.length === 0) {
      setRecentProducts([]);
      return;
    }
    const apiUrl = getApiUrl();
    Promise.allSettled(
      recentIds.slice(0, 8).map((id) =>
        fetch(`${apiUrl}/products/${id}`).then((r) => (r.ok ? r.json() : null))
      )
    ).then((results) => {
      const fetched = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r: any) => r.value);
      const ordered = recentIds
        .slice(0, 8)
        .map((id) => fetched.find((p: any) => p.id === id))
        .filter(Boolean);
      setRecentProducts(ordered);
    });
  }, [recentIds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!isConnected && !hasLoadedOnce.current) {
    return (
      <View style={styles.loadingWrap}>
        <View style={[styles.blackTopArea, { paddingTop: insets.top }]}>
          <DropBar />
        </View>
        <OfflinePlaceholder onRetry={fetchData} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
          <DropBar />
        {/* <View style={[styles.blackTopArea, { paddingTop: insets.top }]}>
          <Header dark imperativeRef={headerRef} />
        </View> */}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Hero skeleton */}
          <Skeleton width="100%" height={580} />
          {/* ShopByLook skeleton */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 50, paddingHorizontal: 16 }}>
            <View style={{ alignItems: "center", gap: 14 }}>
              <Skeleton width={80} height={12} />
              <Skeleton width={124} height={300} />
            </View>
            <View style={{ alignItems: "center", gap: 14 }}>
              <Skeleton width={80} height={12} />
              <Skeleton width={124} height={300} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const spotlightList = brands.filter((b) => !String(b.id).startsWith("f-")).slice(0, 3);
  const spotlightSource = spotlightList.length > 0 ? spotlightList : FALLBACK_SPOTLIGHTS;
  spotlightSourceLenRef.current = spotlightSource.length;
  const screenW = Dimensions.get("window").width;
  const displayPicks = picks.length > 0 ? picks : FALLBACK_PICKS;
  const displayFeed = feedPosts.length > 0 ? feedPosts : FALLBACK_FEED;
  const barBrands = brands.slice(0, 8);

  return (
    <View style={styles.root}>
      {/* ── Scrollable content (drop bar + header scroll away with content) ── */}
      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => reportScroll(e.nativeEvent.contentOffset.y)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
      >
        {/* ── Drop bar + black header (scroll with content) ── */}
        <DropBar />
        {/* <View style={[styles.blackTopArea, { paddingTop: insets.top }]}>
          <Header dark imperativeRef={headerRef} />
        </View> */}

        {/* ── 1. Hero ── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)"]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>AW '25 — THE PHILOSOPHY</Text>
            <Text style={styles.heroHeadline}>
              {"FORM\nFOLLOWS\nABSENCE"}
            </Text>
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => router.push("/(tabs)/shop" as any)}
            >
              <Text style={styles.heroCtaText}>SHOP THE COLLECTION</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Shop By Look ── */}
        <ShopByLook />

        {/* ── 3. Marquee ── */}
        <Marquee />

        {/* ── 4. Back-In-Stock Alert ── */}
        <TouchableOpacity
          style={styles.backInStock}
          onPress={() => router.push("/(tabs)/wishlist" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.bisThumb}>
            <View style={styles.bisNewPill}>
              <Text style={styles.bisNewPillText}>NEW</Text>
            </View>
          </View>
          <View style={styles.bisText}>
            <Text style={styles.bisAlert}>● BACK IN STOCK · 2 ITEMS</Text>
            <Text style={styles.bisTitle}>Linen overshirt + boxy crew tee</Text>
            <Text style={styles.bisSubtitle}>FROM YOUR SAVED ITEMS</Text>
          </View>
          <Text style={styles.bisArrow}>›</Text>
        </TouchableOpacity>

        {/* ── 5. Monolith Index ── */}
        <View style={styles.indexSection}>
          <Text style={styles.indexEyebrow}>
            THE MONOLITH INDEX · UPDATED HOURLY
          </Text>
          <View style={styles.indexRow}>
            {[
              { num: stats.brands > 0 ? stats.brands.toLocaleString() : "—", label: "BRANDS" },
              { num: "14", label: "CITIES" },
              { num: stats.products > 0 ? stats.products.toLocaleString() : "—", label: "PIECES" },
              { num: "38", label: "NEW THIS WK" },
            ].map((s) => (
              <View key={s.label} style={styles.indexStat}>
                <Text style={styles.indexNum}>{s.num}</Text>
                <Text style={styles.indexLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 6. Brand Spotlight ── */}
        <View>
          <ScrollView
            ref={spotlightScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onSpotlightSwipe}
            scrollEventThrottle={16}
          >
            {spotlightSource.map((item: any, i: number) => (
              <View key={item.id || i} style={[styles.spotlight, { width: screenW }]}>
                <Text style={styles.spotlightEyebrow}>
                  {`BRAND SPOTLIGHT — ${String(i + 1).padStart(2, "0")} / ${String(spotlightSource.length).padStart(2, "0")}`}
                </Text>
                <Text style={styles.spotlightName}>{(item.name || "").toUpperCase()}</Text>
                <Text style={styles.spotlightLocation}>{item.location || "—"}</Text>
                <Image
                  source={{ uri: item.logo || item.image || "" }}
                  style={styles.spotlightImage}
                  resizeMode="cover"
                />
                <Text style={styles.spotlightBio}>{item.description || item.bio || ""}</Text>
                <View style={styles.spotlightFooter}>
                  <TouchableOpacity
                    style={styles.spotlightCta}
                    onPress={() =>
                      !String(item.id).startsWith("f-")
                        ? router.push(`/brands/${item.id}` as any)
                        : router.push("/(tabs)/brands" as any)
                    }
                  >
                    <Text style={styles.spotlightCtaText}>EXPLORE BRAND</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          {/* Dot indicators */}
          <View style={styles.spotlightDots}>
            {spotlightSource.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setSpotlightIdx(i);
                  spotlightScrollRef.current?.scrollTo({ x: i * screenW, animated: true });
                  startSpotlightTimer();
                }}
                style={[
                  styles.spotlightDot,
                  i === spotlightIdx % spotlightSource.length && styles.spotlightDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── 7. Editor's Picks ── */}
        <View style={styles.editorsPicks}>
          <Text style={styles.editorsEyebrow}>EDITOR'S PICKS · ISSUE 04</Text>
          <Text style={styles.editorsTitle}>
            {"THREE PIECES\nWORTH THE WAIT"}
          </Text>
          {displayPicks.map((pick) => (
            <TouchableOpacity
              key={pick.num}
              style={styles.pickRow}
              activeOpacity={0.8}
              onPress={() =>
                pick.id
                  ? router.push(`/products/${pick.id}` as any)
                  : router.push("/(tabs)/shop" as any)
              }
            >
              <View style={styles.pickImageWrap}>
                <Image
                  source={{ uri: pick.image }}
                  style={styles.pickImage}
                  resizeMode="cover"
                />
                <View style={styles.pickNumPill}>
                  <Text style={styles.pickNumText}>{pick.num}</Text>
                </View>
              </View>
              <View style={styles.pickMeta}>
                <Text style={styles.pickBrand}>{pick.brand}</Text>
                <Text style={styles.pickName}>{pick.name}</Text>
                <Text style={styles.pickQuote}>{pick.quote}</Text>
                <View style={styles.pickBottom}>
                  <Text style={styles.pickPrice}>{pick.price}</Text>
                  <Text style={styles.pickView}>VIEW →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 8. AW '25 Lookbook ── */}
        <LookbookHero />

        {/* ── 9. AI Try-On Card ── */}
        <View style={styles.tryOn}>
          <View style={styles.tryOnLeft}>
            <Text style={styles.tryOnEyebrow}>NEW · AI</Text>
            <Text style={styles.tryOnTitle}>{"TRY /\nANYTHING\nON"}</Text>
            <Text style={styles.tryOnBody}>
              Upload a photo. See it on you in ~10 seconds.
            </Text>
            <TouchableOpacity style={styles.tryOnCta}>
              <Text style={styles.tryOnCtaText}>OPEN TRY-ON →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tryOnRight}>
            <View style={styles.tryOnThumb} />
            <Text style={styles.tryOnPlus}>+</Text>
            <View style={styles.tryOnResultWrap}>
              <View style={styles.tryOnThumb} />
              <View style={styles.tryOnResultPill}>
                <Text style={styles.tryOnResultText}>RESULT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 10. Recently Viewed ── */}
        {recentProducts.length > 0 && (
          <View style={styles.recentlyViewed}>
            <View style={styles.recentlyHeader}>
              <Text style={styles.recentlyTitle}>RECENTLY VIEWED</Text>
              <TouchableOpacity onPress={clearRecentlyViewed}>
                <Text style={styles.recentlyClear}>CLEAR</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentlyScroll}
            >
              {recentProducts.map((product: any) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.recentlyItem}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  <Image
                    source={{ uri: product.mainImage || product.images?.[0] || "" }}
                    style={styles.recentlyThumb}
                    resizeMode="cover"
                  />
                  <Text style={styles.recentlyPrice}>
                    ${Number(product.salePrice ?? product.price).toFixed(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── 11. Editorial Partners ── */}
        <View style={styles.editorialPartners}>
          <Text style={styles.editorialPartnersLabel}>EDITORIAL PARTNERS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.editorialPartnersScroll}
          >
            {barBrands.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() =>
                  b.id.startsWith("f-")
                    ? router.push("/(tabs)/brands" as any)
                    : router.push(`/brands/${b.id}` as any)
                }
              >
                <Text style={styles.editorialPartnerName}>
                  {b.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 12. From the Feed ── */}
        <View style={styles.feed}>
          <View style={styles.feedHeader}>
            <View>
              <Text style={styles.feedTitle}>FROM THE FEED</Text>
              <Text style={styles.feedSubtitle}>4 NEW POSTS TODAY</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/feed" as any)}
            >
              <Text style={styles.feedSeeAll}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.feedScroll}
          >
            {displayFeed.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.feedCard}
                onPress={() =>
                  post.realId
                    ? router.push(`/feed/${post.realId}` as any)
                    : router.push("/(tabs)/feed" as any)
                }
              >
                <View style={styles.feedImageWrap}>
                  <Image
                    source={{ uri: post.image }}
                    style={styles.feedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.feedAgo}>
                    <Text style={styles.feedAgoText}>{post.ago}</Text>
                  </View>
                </View>
                <Text style={styles.feedBrand}>{post.brand}</Text>
                <Text style={styles.feedCaption} numberOfLines={2}>
                  {post.caption}
                </Text>
                <Text style={styles.feedEngagement}>
                  ♡ {post.likes} · ◯ {post.comments}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 13. Care & Origin ── */}
        <View style={styles.careOrigin}>
          <Text style={styles.careEyebrow}>CARE & ORIGIN — ON EVERY PIECE</Text>
          <View style={styles.careRow}>
            {[
              { glyph: "◔", label: "TRACEABLE", sub: "Every piece tagged" },
              { glyph: "◑", label: "NUMBERED", sub: "Limited runs" },
              { glyph: "◐", label: "REPAIRABLE", sub: "Lifetime support" },
            ].map((c) => (
              <View key={c.label} style={styles.careCol}>
                <Text style={styles.careGlyph}>{c.glyph}</Text>
                <Text style={styles.careLabel}>{c.label}</Text>
                <Text style={styles.careSub}>{c.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 14. Editorial Closer ── */}
        <View style={styles.editorialCloser}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop" }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.closerOverlay} />
          <View style={styles.closerContent}>
            <Text style={styles.closerEyebrow}>THE PHILOSOPHY · ESSAY 04</Text>
            <Text style={styles.closerQuote}>
              {
                '"We remove the decorative to reveal the structural. Every seam is intentional."'
              }
            </Text>
            <View style={styles.closerAuthor}>
              <View style={styles.closerAvatar} />
              <View>
                <Text style={styles.closerAuthorName}>S. KOWALSKI</Text>
                <Text style={styles.closerAuthorRole}>CHIEF</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closerCta}
              onPress={() => router.push("/(tabs)/feed" as any)}
            >
              <Text style={styles.closerCtaText}>READ EDITORIAL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 15. Footer ── */}
        <View style={styles.footer}>
          {/* Newsletter */}
          <View style={styles.footerNewsletter}>
            <Text style={styles.footerNewsletterLabel}>
              JOIN — DROPS & EDITORIALS
            </Text>
            <View style={styles.footerInputRow}>
              <TextInput
                style={styles.footerInput}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity>
                <Text style={styles.footerSubscribe}>SUBSCRIBE →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Links */}
          <View style={styles.footerGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColHead}>SHOP</Text>
              {[
                { label: "NEW ARRIVALS", route: "/(tabs)/shop" },
                { label: "WOMEN", route: "/(tabs)/shop?gender=Women" },
                { label: "MEN", route: "/(tabs)/shop?gender=Men" },
                { label: "BRANDS", route: "/(tabs)/brands" },
                { label: "ARCHIVE", route: "/(tabs)/shop" },
              ].map(({ label, route }) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => router.push(route as any)}
                >
                  <Text style={styles.footerLink}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColHead}>SERVICE</Text>
              {[
                { label: "SHIPPING", route: "/info/shipping" },
                { label: "RETURNS", route: "/info/returns" },
                { label: "CONTACT", route: "/info/contact" },
                { label: "TRY-ON GUIDE", route: "/(tabs)/feed" },
              ].map(({ label, route }) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => router.push(route as any)}
                >
                  <Text style={styles.footerLink}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.footerCopy}>
            © 2026 MONOLITH LTD. — LOCAL BRANDS, GLOBALLY.
          </Text>
        </View>
      </ScrollView>

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },

  // ── Black top area ──────────────────────────────────────────────────────────
  blackTopArea: {
    backgroundColor: colors.primary,
  },

  // ── Drop Bar ────────────────────────────────────────────────────────────────
  dropBar: {
    backgroundColor: colors.primaryMuted,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropBarLeft: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.primaryForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dropBarRight: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Sticky Mini-Header ──────────────────────────────────────────────────────
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  stickyHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stickyHeaderLeft: {
    flexDirection: "row",
    gap: 4,
  },
  stickyHeaderRight: {
    flexDirection: "row",
    gap: 4,
  },
  stickyIconBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  stickyLogo: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 4,
    color: colors.text,
    textTransform: "uppercase",
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    width: "100%",
    height: 580,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  heroContent: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  heroEyebrow: {
    fontFamily: undefined,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroHeadline: {
    fontFamily: undefined,
    fontSize: 40,
    fontWeight: "800",
    color: colors.primaryForeground,
    letterSpacing: -1.5,
    lineHeight: 37,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  heroCta: {
    borderWidth: 1,
    borderColor: colors.primaryForeground,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "flex-start",
  },
  heroCtaText: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Shop By Look ────────────────────────────────────────────────────────────
  shopByLook: {
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  figureWrap: {
    alignItems: "center",
  },
  figurelabel: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 14,
  },
  figureImage: {
    width: 124,
    height: 300,
    transformOrigin: "50% 100%",
  },
  figurePill: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: 12,
  },

  // ── Marquee ─────────────────────────────────────────────────────────────────
  marqueeWrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  marqueeText: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 3,
    textTransform: "uppercase",
    width: 6000,
  },

  // ── Back-In-Stock Alert ─────────────────────────────────────────────────────
  backInStock: {
    margin: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  bisThumb: {
    width: 60,
    height: 60,
    backgroundColor: colors.surfaceRaised,
    position: "relative",
  },
  bisNewPill: {
    position: "absolute",
    top: -4,
    left: -4,
    backgroundColor: colors.danger,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bisNewPillText: {
    fontFamily: undefined,
    fontSize: 8,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 0.5,
  },
  bisText: {
    flex: 1,
    gap: 3,
  },
  bisAlert: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.danger,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bisTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.text,
  },
  bisSubtitle: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bisArrow: {
    fontSize: 20,
    color: colors.text,
  },

  // ── Monolith Index ──────────────────────────────────────────────────────────
  indexSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceRaised,
  },
  indexEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 14,
  },
  indexRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  indexStat: {
    alignItems: "center",
    flex: 1,
  },
  indexNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  indexLabel: {
    fontFamily: undefined,
    fontSize: 8,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
    textAlign: "center",
  },

  // ── Brand Spotlight ─────────────────────────────────────────────────────────
  spotlight: {
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  spotlightEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  spotlightName: {
    fontFamily: undefined,
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 30,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  spotlightLocation: {
    fontFamily: undefined,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  spotlightImage: {
    width: "100%",
    height: 360,
    backgroundColor: colors.surfaceRaised,
    marginBottom: 20,
  },
  spotlightBio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 24,
  },
  spotlightFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  spotlightCta: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  spotlightCtaText: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  spotlightMeta: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    flex: 1,
  },
  spotlightDots: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 32,
    backgroundColor: colors.background,
  },
  spotlightDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.border,
  },
  spotlightDotActive: {
    backgroundColor: colors.primary,
  },

  // ── Editor's Picks ──────────────────────────────────────────────────────────
  editorsPicks: {
    backgroundColor: colors.primaryMuted,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  editorsEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  editorsTitle: {
    fontFamily: undefined,
    fontSize: 26,
    fontWeight: "800",
    color: colors.primaryForeground,
    lineHeight: 28,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  pickRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
    alignItems: "flex-start",
  },
  pickImageWrap: {
    position: "relative",
  },
  pickImage: {
    width: 130,
    height: 170,
    backgroundColor: colors.primaryMuted,
  },
  pickNumPill: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pickNumText: {
    fontFamily: undefined,
    fontSize: 9,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
  },
  pickMeta: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  pickBrand: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  pickName: {
    fontFamily: undefined,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryForeground,
    textTransform: "uppercase",
    lineHeight: 18,
  },
  pickQuote: {
    fontFamily: undefined,
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textTertiary,
    lineHeight: 17,
    marginTop: 4,
  },
  pickBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  pickPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.primaryForeground,
  },
  pickView: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── AI Try-On ───────────────────────────────────────────────────────────────
  tryOn: {
    margin: 16,
    backgroundColor: colors.primaryMuted,
    padding: 18,
    flexDirection: "row",
    gap: 16,
  },
  tryOnLeft: {
    flex: 1,
    gap: 8,
  },
  tryOnEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tryOnTitle: {
    fontFamily: undefined,
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryForeground,
    lineHeight: 24,
    textTransform: "uppercase",
  },
  tryOnBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 17,
  },
  tryOnCta: {
    borderWidth: 1,
    borderColor: colors.primaryForeground,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  tryOnCtaText: {
    fontFamily: undefined,
    fontSize: 9,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tryOnRight: {
    width: 80,
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  tryOnThumb: {
    width: 70,
    height: 90,
    backgroundColor: colors.primaryMuted,
  },
  tryOnPlus: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  tryOnResultWrap: {
    position: "relative",
  },
  tryOnResultPill: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tryOnResultText: {
    fontFamily: undefined,
    fontSize: 7,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Recently Viewed ─────────────────────────────────────────────────────────
  recentlyViewed: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recentlyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 16,
    marginBottom: 16,
  },
  recentlyTitle: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  recentlyClear: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  recentlyScroll: {
    gap: 12,
    paddingRight: 16,
  },
  recentlyItem: {
    alignItems: "center",
    gap: 6,
  },
  recentlyThumb: {
    width: 96,
    height: 120,
    backgroundColor: colors.surfaceRaised,
  },
  recentlyPrice: {
    fontFamily: undefined,
    fontSize: 8,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  // ── Editorial Partners ──────────────────────────────────────────────────────
  editorialPartners: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  editorialPartnersLabel: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  editorialPartnersScroll: {
    gap: 28,
    alignItems: "center",
  },
  editorialPartnerName: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── From the Feed ───────────────────────────────────────────────────────────
  feed: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingLeft: 16,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 16,
    marginBottom: 16,
  },
  feedTitle: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  feedSubtitle: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 3,
  },
  feedSeeAll: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  feedScroll: {
    gap: 16,
    paddingRight: 16,
  },
  feedCard: {
    width: 220,
    gap: 6,
  },
  feedImageWrap: {
    position: "relative",
  },
  feedImage: {
    width: 220,
    height: 280,
    backgroundColor: colors.surfaceRaised,
  },
  feedAgo: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  feedAgoText: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.primaryForeground,
    letterSpacing: 1,
  },
  feedBrand: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  feedCaption: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  feedEngagement: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },

  // ── Care & Origin ───────────────────────────────────────────────────────────
  careOrigin: {
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  careEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 24,
  },
  careRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  careCol: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  careGlyph: {
    fontSize: 28,
    color: colors.text,
  },
  careLabel: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  careSub: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // ── Editorial Closer ────────────────────────────────────────────────────────
  editorialCloser: {
    height: 400,
    position: "relative",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  closerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  closerContent: {
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  closerEyebrow: {
    fontFamily: undefined,
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  closerQuote: {
    fontFamily: undefined,
    fontSize: 22,
    fontStyle: "italic",
    color: colors.primaryForeground,
    lineHeight: 28,
  },
  closerAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closerAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryMuted,
  },
  closerAuthorName: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 1,
  },
  closerAuthorRole: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  closerCta: {
    borderWidth: 1,
    borderColor: colors.primaryForeground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  closerCtaText: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryForeground,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor: colors.background,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 32,
  },
  footerNewsletter: {
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingBottom: 20,
  },
  footerNewsletterLabel: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  footerInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginRight: 16,
    backgroundColor: "transparent",
  },
  footerSubscribe: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  footerGrid: {
    flexDirection: "row",
    gap: 32,
  },
  footerCol: {
    flex: 1,
    gap: 10,
  },
  footerColHead: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerCopy: {
    fontFamily: undefined,
    fontSize: 8,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

export default HomeScreen;
