import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Easing,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";
import LookbookHero from "@/components/LookbookHero";
import HeroPressable from "@/components/HeroPressable";
import ManSvg from "@/assets/images/man.svg";
import WomanSvg from "@/assets/images/woman.svg";

const MAN_IMAGE = require("@/assets/images/man.jpg");
const WOMEN_IMAGE = require("@/assets/images/women.jpg");

interface Brand {
  id: string;
  name: string;
  logo?: string;
}

const MARQUEE_TEXT =
  "GLOBAL SHIPPING AVAILABLE  —  ARCHIVE RESTOCK LIVE  —  NEXT DROP 04.25  —  ";

const FALLBACK_BRANDS: Brand[] = [
  { id: "fallback-1", name: "MONOLITH" },
  { id: "fallback-2", name: "CELINE" },
  { id: "fallback-3", name: "DOVER" },
  { id: "fallback-4", name: "ARCHIVE" },
  { id: "fallback-5", name: "GLOSSIER" },
];

// ── Marquee ──────────────────────────────────────────────────
const Marquee: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const W = MARQUEE_TEXT.length * 8.5;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: -W,
        duration: W * 35,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.marqueeWrap, dark && styles.marqueeWrapDark]}>
      <Animated.Text
        style={[
          styles.marqueeText,
          dark && styles.marqueeTextDark,
          { transform: [{ translateX: anim }] },
        ]}
        numberOfLines={1}
      >
        {MARQUEE_TEXT.repeat(8)}
      </Animated.Text>
    </View>
  );
};

// ── Home Screen ──────────────────────────────────────────────
const HomeScreen = () => {
  const router = useRouter();
  const { token } = useAuth();

  const [lookbookProducts, setLookbookProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const apiUrl = getApiUrl();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const [newArrivalsRes, trendingRes, brandsRes] = await Promise.all([
        fetch(
          `${apiUrl}/products?limit=6&status=published&sortBy=createdAt&sortOrder=DESC`,
          { headers },
        ),
        fetch(`${apiUrl}/products/trending?limit=6`, { headers }),
        fetch(`${apiUrl}/brands?limit=10`, { headers }),
      ]);

      if (newArrivalsRes.ok) {
        const data = await newArrivalsRes.json();
        const items: Product[] = data.items || [];
        setLookbookProducts(items.slice(0, 4));
      }
      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setRecommendedProducts(Array.isArray(data) ? data.slice(0, 6) : []);
      }
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        const list: Brand[] = Array.isArray(data) ? data : data.items || [];
        setBrands(list.length > 0 ? list : FALLBACK_BRANDS);
      } else {
        setBrands(FALLBACK_BRANDS);
      }
    } catch (err) {
      console.error("Home fetch error:", err);
      setBrands(FALLBACK_BRANDS);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current) fetchData();
    }, [token]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getImage = (p: Product): string | null =>
    p.images?.[0] ?? p.mainImage ?? null;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  const leftCol = lookbookProducts.filter((_, i) => i % 2 === 0);
  const rightCol = lookbookProducts.filter((_, i) => i % 2 !== 0);

  const gridBrands = brands.slice(0, 3);
  const barBrands = brands.slice(0, 8);

  const TILE_STYLES = [
    styles.brandTileWhite,
    styles.brandTileBlack,
    styles.brandTileGray,
  ];
  const TILE_CAPTIONS = ["CURATORIAL", "HERITAGE", "GALLERY"];

  return (
    <Animated.ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }
    >
      {/* fix this image to be pressable  */}
      <View style={{
        width: "100%",
        height: 500,
        marginBottom: 64,
        marginHorizontal: 0,
        alignSelf: "stretch",
        backgroundColor: "#ffffff",
      }}>

        {/* Woman character — positioned over her exact location */}
        <View style={{ position: "absolute", left: "10%", bottom: 0, width: "24%", height: "78%", alignItems: "center" }}>
          <Text style={styles.heroShopLabel}>SHOP HER LOOK</Text>
          <HeroPressable
            SvgComponent={WomanSvg}
            onPress={() => router.push("/(tabs)/shop" as any)}
            style={{ width: "63%", height: "63%" }}
            entryDirection="left"
            entryDelay={0}
            scrollY={scrollY}
          />
        </View>

        {/* Man character — positioned over his exact location */}
        <View style={{ position: "absolute", right: "10%", bottom: 0, width: "24%", height: "78%", alignItems: "center" }}>
          <Text style={styles.heroShopLabel}>SHOP HIS LOOK</Text>
          <HeroPressable
            SvgComponent={ManSvg}
            onPress={() => router.push("/(tabs)/shop" as any)}
            style={{ width: "63%", height: "63%"}}
            entryDirection="right"
            entryDelay={200}
            scrollY={scrollY}
          />
        </View>

      </View>
      <LookbookHero />
      {/* <EditorialSection /> */}


      {/* ── 1.5. Editorial Partners / Brands ──────────────── */}
      <View style={styles.brandsSection}>
        <Text style={styles.brandsLabel}>EDITORIAL PARTNERS</Text>
        {/* Horizontal brand bar */}
        {barBrands.length > 0 && (
          <View style={styles.brandBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandBarScroll}
            >
              {barBrands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.brandBarItem}
                  onPress={() =>
                    String(brand.id).startsWith("fallback")
                      ? router.push("/(tabs)/brands" as any)
                      : router.push(`/brands/${brand.id}` as any)
                  }
                >
                  <Text style={styles.brandBarText}>
                    {brand.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── 2. Marquee ───────────────────────────────────── */}
      <Marquee />

      {/* ── 3. Staggered Lookbook ────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FEATURED COLLECTIONS</Text>

        <View style={styles.staggerRow}>
          {/* Left column */}
          <View style={styles.staggerCol}>
            {leftCol.map((product, i) => {
              const img = getImage(product);
              const heights = [288, 320];
              const h = heights[i % heights.length];
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.lookbookItem, i > 0 && { marginTop: 32 }]}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  <View style={[styles.lookbookImage, { height: h }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.fill} resizeMode="cover" />
                    ) : (
                      <View style={[styles.fill, { backgroundColor: "#eeeeee" }]} />
                    )}
                  </View>
                  <View style={styles.lookbookMeta}>
                    <Text style={styles.lookbookSku} numberOfLines={1}>
                      {product.brandName
                        ? `${product.brandName.toUpperCase().replace(/\s/g, "_")}_${product.name.toUpperCase().replace(/\s/g, "_").slice(0, 6)}`
                        : product.name.toUpperCase()}
                    </Text>
                    <Text style={styles.lookbookPrice}>
                      ${product.salePrice ?? product.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right column — staggered down */}
          <View style={[styles.staggerCol, { paddingTop: 64 }]}>
            {rightCol.map((product, i) => {
              const img = getImage(product);
              const heights = [384, 256];
              const h = heights[i % heights.length];
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.lookbookItem, i > 0 && { marginTop: 32 }]}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  <View style={[styles.lookbookImage, { height: h }]}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.fill} resizeMode="cover" />
                    ) : (
                      <View style={[styles.fill, { backgroundColor: "#eeeeee" }]} />
                    )}
                    {product.salePrice && product.salePrice < product.price && (
                      <View style={styles.limitedBadge}>
                        <Text style={styles.limitedBadgeText}>LIMITED STOCK</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.lookbookMeta}>
                    <Text style={styles.lookbookSku} numberOfLines={1}>
                      {product.brandName
                        ? `${product.brandName.toUpperCase().replace(/\s/g, "_")}_${product.name.toUpperCase().replace(/\s/g, "_").slice(0, 6)}`
                        : product.name.toUpperCase()}
                    </Text>
                    <Text style={styles.lookbookPrice}>
                      ${product.salePrice ?? product.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── 4. Recommended (horizontal, black bg) ─────────── */}
      {recommendedProducts.length > 0 && (
        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedLabel}>RECOMMENDED FOR YOU</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScroll}
          >
            {recommendedProducts.map((product) => {
              const img = getImage(product);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.recommendedCard}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  <View style={styles.recommendedImage}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.fill} resizeMode="cover" />
                    ) : (
                      <View style={[styles.fill, { backgroundColor: "#222222" }]} />
                    )}
                  </View>
                  <View style={styles.recommendedMeta}>
                    <Text style={styles.recommendedSku} numberOfLines={1}>
                      {product.name.toUpperCase()}
                    </Text>
                    <Text style={styles.recommendedPrice}>
                      ${product.salePrice ?? product.price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── 5. Split Editorial ───────────────────────────── */}
      <View style={styles.editorial}>
        <View style={styles.editorialImage}>
          <Image source={MAN_IMAGE} style={styles.fill} resizeMode="cover" />
        </View>
        <View style={styles.editorialText}>
          <Text style={styles.editorialEyebrow}>THE PHILOSOPHY</Text>
          <Text style={styles.editorialTitle}>Form Follows{"\n"}Absence</Text>
          <Text style={styles.editorialBody}>
            Monolith is a study in subtraction. We remove the decorative to
            reveal the structural. Every seam is intentional. Every silhouette
            is an architectural proposition.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/feed" as any)}
            style={styles.editorialLink}
          >
            <Text style={styles.editorialLinkText}>READ EDITORIAL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 6. Footer ────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerGrid}>
          <View style={styles.footerCol}>
            <Text style={styles.footerHeading}>COLLECTIONS</Text>
            {["NEW ARRIVALS", "READY TO WEAR", "ACCESSORIES", "ARCHIVE"].map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => router.push("/(tabs)/shop" as any)}
              >
                <Text style={styles.footerLink}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerHeading}>SERVICE</Text>
            {[
              { label: "SHIPPING", route: "/info/shipping" },
              { label: "RETURNS", route: "/info/returns" },
              { label: "CONTACT", route: "/info/contact" },
              { label: "ABOUT", route: "/info/about" },
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

        <View style={styles.footerNewsletter}>
          <Text style={styles.footerNewsletterLabel}>NEWSLETTER</Text>
          <TextInput
            style={styles.footerInput}
            placeholder="EMAIL ADDRESS"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.footerCopy}>
          © 2025 MONOLITH LTD. ALL RIGHTS RESERVED.
        </Text>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  fill: {
    width: "100%",
    height: "100%",
  },

  // ── Split Hero ──────────────────────────────────────────
  splitHero: {
    flexDirection: "row",
    height: 600,
    backgroundColor: "#000000",
  },
  heroHalf: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  heroHalfRight: {
    borderLeftWidth: 2,
    borderLeftColor: "#000000",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  heroHalfContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  heroLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroHalfTitle: {
    fontFamily: undefined,
    fontSize: 28,
    color: "#ffffff",
    textTransform: "uppercase",
    // letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 24,
  },
  heroBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  heroBtnText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Editorial Partners / Brands ─────────────────────────
  brandsSection: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 64,
    backgroundColor: "#ffffff",
  },
  brandsLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  brandsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },
  brandGridItem: {
    flex: 1,
  },
  brandTile: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  brandTileWhite: {
    backgroundColor: "#ffffff",
  },
  brandTileBlack: {
    backgroundColor: "#000000",
  },
  brandTileGray: {
    backgroundColor: "#f3f3f4",
  },
  brandTileImage: {
    width: "100%",
    height: "100%",
  },
  brandTileText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  brandTileCaption: {
    fontFamily: undefined,
    fontSize: 9,
    color: "#777777",
    // letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 12,
  },
  brandBar: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#000000",
    paddingVertical: 24,
    marginHorizontal: -24,
  },
  brandBarScroll: {
    paddingHorizontal: 24,
    gap: 32,
    alignItems: "center",
  },
  brandBarItem: {},
  brandBarText: {
    fontFamily: undefined,
    fontSize: 11,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Marquee ──────────────────────────────────────────────
  marqueeWrap: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#000000",
    paddingVertical: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  marqueeWrapDark: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  marqueeText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    width: 6000,
  },
  marqueeTextDark: {
    color: "#e2e2e2",
  },

  // ── Section (Lookbook) ──────────────────────────────────
  section: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 64,
    backgroundColor: "#ffffff",
  },
  sectionLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 48,
  },
  staggerRow: {
    flexDirection: "row",
    gap: 16,
  },
  staggerCol: {
    flex: 1,
  },
  lookbookItem: {},
  lookbookImage: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#eeeeee",
  },
  lookbookMeta: {
    paddingTop: 10,
  },
  lookbookSku: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  lookbookPrice: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#777777",
  },
  limitedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "transparent",
  },
  limitedBadgeText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#C41E3A",
    // letterSpacing: 1,
  },

  // ── Recommended ─────────────────────────────────────────
  recommendedSection: {
    backgroundColor: "#000000",
    paddingTop: 64,
    paddingBottom: 64,
  },
  recommendedLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 48,
    paddingHorizontal: 24,
  },
  recommendedScroll: {
    paddingHorizontal: 24,
    gap: 24,
  },
  recommendedCard: {
    width: 280,
  },
  recommendedImage: {
    width: 280,
    height: 400,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  recommendedMeta: {
    paddingTop: 10,
  },
  recommendedSku: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#ffffff",
    // letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  recommendedPrice: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#777777",
  },

  // ── Editorial ───────────────────────────────────────────
  editorial: {
    backgroundColor: "#ffffff",
  },
  editorialImage: {
    width: "100%",
    height: 400,
    overflow: "hidden",
    backgroundColor: "#eeeeee",
  },
  editorialText: {
    padding: 48,
  },
  editorialEyebrow: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  editorialTitle: {
    fontFamily: undefined,
    fontSize: 36,
    color: "#000000",
    textTransform: "uppercase",
    lineHeight: 38,
    marginBottom: 32,
  },
  editorialBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#474747",
    lineHeight: 22,
  },
  editorialLink: {
    marginTop: 48,
    alignSelf: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 4,
  },
  editorialLinkText: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Footer ──────────────────────────────────────────────
  footer: {
    borderTopWidth: 2,
    borderTopColor: "#000000",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 80,
  },
  footerGrid: {
    flexDirection: "row",
    gap: 48,
    marginBottom: 80,
  },
  footerCol: {
    flex: 1,
    gap: 12,
  },
  heroShopLabel: {
    fontSize: 9,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 30,
  },
  heroImage: {
    width: "100%",
    height: 600,
    marginBottom: 64,
  },
  footerHeading: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#777777",
    // letterSpacing: 2,
    textTransform: "uppercase",
    paddingVertical: 3,
  },
  footerNewsletter: {
    marginBottom: 40,
  },
  footerNewsletterLabel: {
    fontFamily: undefined,
    fontSize: 10,
    color: "#000000",
    // letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  footerInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: undefined,
    fontSize: 11,
    color: "#000000",
    backgroundColor: "transparent",
  },
  footerCopy: {
    fontFamily: undefined,
    fontSize: 8,
    color: "#aaaaaa",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default HomeScreen;
