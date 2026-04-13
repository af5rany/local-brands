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
  useWindowDimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";

const MARQUEE_TEXT =
  "GLOBAL SHIPPING AVAILABLE  —  ARCHIVE RESTOCK LIVE  —  NEXT DROP 04.25  —  ";

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
  const { width } = useWindowDimensions();

  const [lookbookProducts, setLookbookProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [heroProduct, setHeroProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const fetchData = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const apiUrl = getApiUrl();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    try {
      const [newArrivalsRes, trendingRes] = await Promise.all([
        fetch(
          `${apiUrl}/products?limit=6&status=published&sortBy=createdAt&sortOrder=DESC`,
          { headers },
        ),
        fetch(`${apiUrl}/products/trending?limit=6`, { headers }),
      ]);

      if (newArrivalsRes.ok) {
        const data = await newArrivalsRes.json();
        const items: Product[] = data.items || [];
        setHeroProduct(items[0] ?? null);
        setLookbookProducts(items.slice(0, 4));
      }
      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setRecommendedProducts(Array.isArray(data) ? data.slice(0, 6) : []);
      }
    } catch (err) {
      console.error("Home fetch error:", err);
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

  const heroImage = heroProduct ? getImage(heroProduct) : null;

  // Build staggered pairs: left col = [0,2], right col = [1,3]
  const leftCol = lookbookProducts.filter((_, i) => i % 2 === 0);
  const rightCol = lookbookProducts.filter((_, i) => i % 2 !== 0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }
    >
      {/* ── 1. Hero ──────────────────────────────────────── */}
      <View style={[styles.hero, { height: width * 1.2 }]}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: "#111111" }]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>SS25 COLLECTION</Text>
          <Text style={styles.heroTitle}>{"Structural\nElegance"}</Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push("/(tabs)/shop" as any)}
          >
            <Text style={styles.heroBtnText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
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
                      {product.brandName ? `${product.brandName.toUpperCase().replace(/\s/g, "_")}_${product.name.toUpperCase().replace(/\s/g, "_").slice(0, 6)}` : product.name.toUpperCase()}
                    </Text>
                    <Text style={styles.lookbookPrice}>${product.salePrice ?? product.price}</Text>
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
                      {product.brandName ? `${product.brandName.toUpperCase().replace(/\s/g, "_")}_${product.name.toUpperCase().replace(/\s/g, "_").slice(0, 6)}` : product.name.toUpperCase()}
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
        {/* Image top (on mobile) */}
        <View style={styles.editorialImage}>
          <Image
            source={{ uri: heroImage ?? undefined }}
            style={styles.fill}
            resizeMode="cover"
          />
          {!heroImage && <View style={[styles.fill, { backgroundColor: "#1a1a1a" }]} />}
        </View>
        {/* Text */}
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
    </ScrollView>
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

  // Hero
  hero: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
  },
  heroLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#ffffff",
    letterSpacing: 5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 48,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: -1,
    lineHeight: 50,
    marginBottom: 28,
  },
  heroBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignSelf: "flex-start",
  },
  heroBtnText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // Marquee
  marqueeWrap: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#000000",
    paddingVertical: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  marqueeWrapDark: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  marqueeText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
    width: 6000,
  },
  marqueeTextDark: {
    color: "#e2e2e2",
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    backgroundColor: "#ffffff",
  },
  sectionLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 36,
  },

  // Staggered grid
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
  fill: {
    width: "100%",
    height: "100%",
  },
  lookbookMeta: {
    paddingTop: 10,
  },
  lookbookSku: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: "#000000",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  lookbookPrice: {
    fontFamily: "SpaceMono_400Regular",
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
    fontFamily: "SpaceMono_700Bold",
    fontSize: 8,
    color: "#C41E3A",
    letterSpacing: 1,
  },

  // Recommended
  recommendedSection: {
    backgroundColor: "#000000",
    paddingTop: 48,
    paddingBottom: 48,
  },
  recommendedLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#ffffff",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  recommendedScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  recommendedCard: {
    width: 220,
  },
  recommendedImage: {
    width: 220,
    height: 300,
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
  },
  recommendedMeta: {
    paddingTop: 10,
  },
  recommendedSku: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: "#ffffff",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  recommendedPrice: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#777777",
  },

  // Editorial
  editorial: {
    backgroundColor: "#ffffff",
  },
  editorialImage: {
    width: "100%",
    height: 300,
    overflow: "hidden",
    backgroundColor: "#eeeeee",
  },
  editorialText: {
    padding: 40,
  },
  editorialEyebrow: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 20,
  },
  editorialTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 36,
    color: "#000000",
    textTransform: "uppercase",
    lineHeight: 38,
    marginBottom: 20,
  },
  editorialBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#474747",
    lineHeight: 22,
    maxWidth: 300,
  },
  editorialLink: {
    marginTop: 32,
    alignSelf: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 4,
  },
  editorialLinkText: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 10,
    color: "#000000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Footer
  footer: {
    borderTopWidth: 2,
    borderTopColor: "#000000",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  footerGrid: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 48,
  },
  footerCol: {
    flex: 1,
    gap: 12,
  },
  footerHeading: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#777777",
    letterSpacing: 2,
    textTransform: "uppercase",
    paddingVertical: 3,
  },
  footerNewsletter: {
    marginBottom: 32,
  },
  footerNewsletterLabel: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 9,
    color: "#000000",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  footerInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#000000",
    backgroundColor: "transparent",
  },
  footerCopy: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 8,
    color: "#aaaaaa",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

export default HomeScreen;
