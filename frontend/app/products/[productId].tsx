import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ProductReviews from "@/components/ProductReviews";
import { useThemeColors } from "@/hooks/useThemeColor";

const { width: W, height: H } = Dimensions.get("window");
const GALLERY_HEIGHT = H * 0.58;
const STATUS_H = StatusBar.currentHeight || 44;

const ProductDetailScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { productId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const userRole = user?.role || user?.userRole;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [notifyMeLoading, setNotifyMeLoading] = useState(false);
  const [isSubscribedNotify, setIsSubscribedNotify] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || isNaN(Number(productId))) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${getApiUrl()}/products/${productId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProduct(data);

        if (token) {
          try {
            const wRes = await fetch(`${getApiUrl()}/wishlist`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (wRes.ok) {
              const items = await wRes.json();
              setIsInWishlist(
                items.some((i: any) => i.product.id === Number(productId)),
              );
            }
          } catch (_) {}

          // Check notify-me subscription status
          try {
            const nRes = await fetch(
              `${getApiUrl()}/notifications/notify-me/check/${productId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (nRes.ok) {
              const nData = await nRes.json();
              setIsSubscribedNotify(nData.subscribed === true);
            }
          } catch (_) {}
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setSelectedVariant(0);
    setSelectedImage(0);
  }, [productId, token]);

  // ── Actions ──────────────────────────────────
  const toggleWishlist = async () => {
    if (!token) {
      Alert.alert("Login Required", "Sign in to save items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/wishlist/toggle/${productId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setIsInWishlist(result.added);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setWishlistLoading(false);
    }
  };

  const addToCart = async () => {
    if (!token) {
      Alert.alert("Login Required", "Sign in to add items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    const v = product?.variants?.[selectedVariant];
    if (!v || v.stock <= 0) {
      Alert.alert("Unavailable", "This item is out of stock.");
      return;
    }
    setCartLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(productId),
          variantId: v.id,
          quantity: 1,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      Alert.alert("Added", "Item added to your bag.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCartLoading(false);
    }
  };

  const buyNow = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const v = product?.variants?.[selectedVariant];
    if (!v || v.stock <= 0) {
      Alert.alert("Unavailable", "This item is out of stock.");
      return;
    }
    setBuyNowLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(productId),
          variantId: v.id,
          quantity: 1,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      router.push("/checkout");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setBuyNowLoading(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setNotifyMeLoading(true);
    try {
      const res = await fetch(
        `${getApiUrl()}/notifications/notify-me/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to subscribe");
      setIsSubscribedNotify(true);
      showToast(
        "You'll be notified when this product is back in stock",
        "success",
      );
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setNotifyMeLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Product", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${getApiUrl()}/products/${productId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed");
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  // ── Interpolations ───────────────────────────
  const headerOpacity = scrollY.interpolate({
    inputRange: [GALLERY_HEIGHT - 150, GALLERY_HEIGHT - 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const parallax = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [100, 0],
    extrapolate: "clamp",
  });
  const galleryScale = scrollY.interpolate({
    inputRange: [-300, 0],
    outputRange: [1.3, 1],
    extrapolate: "clamp",
  });

  // ── Loading / Error ──────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingLabel, { color: colors.textTertiary }]}>
          LOADING
        </Text>
      </View>
    );
  }
  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Product Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.goBackBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.goBackText, { color: colors.text }]}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const variant = product.variants[selectedVariant];
  const hasDiscount =
    product.salePrice !== undefined && product.salePrice < product.price;
  const price =
    variant?.priceOverride || (hasDiscount ? product.salePrice : product.price);
  const inStock = (variant?.stock || 0) > 0;
  const allOutOfStock =
    product.stock === 0 ||
    (product.variants.length > 0 &&
      product.variants.every((v) => v.stock <= 0));
  const isOwnerOrAdmin =
    userRole === "admin" ||
    (user?.id &&
      product?.brand?.owner?.id &&
      user.id === product.brand.owner.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Sticky Header ─────────────────────── */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.stickyInner}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {product.name}
          </Text>
          <TouchableOpacity hitSlop={12}>
            <Ionicons name="share-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Floating Nav ──────────────────────── */}
      <View style={styles.floatingNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.floatingPill}
        >
          <Ionicons name="arrow-back" size={17} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingPill}>
          <Ionicons name="share-outline" size={17} color="#000" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* ── Gallery ─────────────────────────── */}
        <View style={styles.galleryWrap}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setSelectedImage(Math.round(e.nativeEvent.contentOffset.x / W))
            }
          >
            {variant?.images?.map((uri: string, i: number) => (
              <Animated.View
                key={i}
                style={[
                  styles.imgFrame,
                  {
                    transform: [
                      { translateY: parallax },
                      { scale: galleryScale },
                    ],
                  },
                ]}
              >
                <Image source={{ uri }} style={styles.img} resizeMode="cover" />
              </Animated.View>
            ))}
          </Animated.ScrollView>

          {/* Bottom gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.35)"]}
            style={styles.galleryGradient}
          />

          {/* Image indicator bars */}
          <View style={styles.indicatorRow}>
            {variant?.images?.map((_: string, i: number) => (
              <View
                key={i}
                style={[
                  styles.indicatorBar,
                  selectedImage === i && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Counter chip */}
          <View style={styles.counterChip}>
            <Text style={styles.counterText}>
              {selectedImage + 1}/{variant?.images?.length || 0}
            </Text>
          </View>
        </View>

        {/* ── Content ─────────────────────────── */}
        <Animated.View
          style={[
            styles.content,
            {
              backgroundColor: colors.background,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Brand + Title */}
          <TouchableOpacity
            onPress={() => router.push(`/brands/${product.brand.id}`)}
            activeOpacity={0.7}
          >
            <Text style={[styles.brandLabel, { color: colors.primary }]}>
              {product.brand.name?.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          {/* Status pill */}
          {product.status !== "published" && (
            <View
              style={[
                styles.statusChip,
                { backgroundColor: colors.warningSoft },
              ]}
            >
              <Text style={[styles.statusChipText, { color: colors.warning }]}>
                {(product.status || "draft").toUpperCase()}
              </Text>
            </View>
          )}

          {/* ── Price Block ───────────────────── */}
          <View style={styles.priceBlock}>
            <View style={styles.priceLeft}>
              <Text
                style={[
                  styles.priceMain,
                  { color: hasDiscount ? colors.danger : colors.text },
                ]}
              >
                ${price?.toFixed(2)}
              </Text>
              {hasDiscount && (
                <Text
                  style={[styles.priceStrike, { color: colors.textTertiary }]}
                >
                  ${product.price.toFixed(2)}
                </Text>
              )}
            </View>
            {hasDiscount && (
              <View
                style={[styles.saveBadge, { backgroundColor: colors.danger }]}
              >
                <Text style={styles.saveBadgeText}>
                  {Math.round(
                    ((product.price - product.salePrice!) / product.price) *
                      100,
                  )}
                  % OFF
                </Text>
              </View>
            )}
          </View>

          {/* Stock */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: inStock ? colors.success : colors.danger },
              ]}
            />
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>
              {inStock ? `${variant.stock} in stock` : "Out of stock"}
            </Text>
          </View>

          {/* ── Divider ───────────────────────── */}
          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Color Picker ──────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text
                style={[styles.sectionLabel, { color: colors.textTertiary }]}
              >
                COLOR
              </Text>
              <Text style={[styles.sectionValue, { color: colors.text }]}>
                {variant?.attributes?.color}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {product.variants.map((v, i) => {
                const active = selectedVariant === i;
                const hex =
                  v.attributes?.colorHex ||
                  v.attributes?.color?.toLowerCase() ||
                  "#CCC";
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setSelectedVariant(i);
                      setSelectedImage(0);
                    }}
                    style={styles.colorWrap}
                  >
                    <View
                      style={[
                        styles.colorRing,
                        { borderColor: active ? colors.text : "transparent" },
                      ]}
                    >
                      <View
                        style={[styles.colorDot, { backgroundColor: hex }]}
                      />
                    </View>
                    {active && (
                      <View
                        style={[
                          styles.colorUnderline,
                          { backgroundColor: colors.text },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Description ───────────────────── */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textTertiary, marginBottom: 14 },
              ]}
            >
              ABOUT
            </Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {product.description}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Details Grid ──────────────────── */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textTertiary, marginBottom: 18 },
              ]}
            >
              SPECIFICATIONS
            </Text>
            <View
              style={[
                styles.specCard,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              {[
                { k: "Type", v: product.productType },
                { k: "Material", v: product.material || "—" },
                { k: "Origin", v: product.origin || "Locally Made" },
                { k: "Season", v: product.season },
              ].map((item, i, arr) => (
                <View
                  key={item.k}
                  style={[
                    styles.specRow,
                    i < arr.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[styles.specKey, { color: colors.textTertiary }]}
                  >
                    {item.k}
                  </Text>
                  <Text style={[styles.specVal, { color: colors.text }]}>
                    {item.v}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Reviews ───────────────────────── */}
          <ProductReviews productId={product.id} />

          {/* ── Admin Controls ────────────────── */}
          {isOwnerOrAdmin && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderLight },
                ]}
              />
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textTertiary, marginBottom: 14 },
                  ]}
                >
                  MANAGE
                </Text>
                <View style={styles.adminRow}>
                  <TouchableOpacity
                    onPress={() => router.push(`/products/edit/${productId}`)}
                    style={[
                      styles.adminBtn,
                      {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.adminBtnLabel, { color: colors.primary }]}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[
                      styles.adminBtn,
                      {
                        backgroundColor: colors.dangerSoft,
                        borderColor: colors.danger,
                      },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.danger}
                    />
                    <Text
                      style={[styles.adminBtnLabel, { color: colors.danger }]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 140 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Bottom Bar ────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.wishBtn,
            {
              borderColor: isInWishlist ? colors.danger : colors.border,
              backgroundColor: isInWishlist ? colors.dangerSoft : "transparent",
            },
          ]}
          onPress={toggleWishlist}
          disabled={wishlistLoading}
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons
              name={isInWishlist ? "heart" : "heart-outline"}
              size={22}
              color={isInWishlist ? colors.danger : colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        {allOutOfStock ? (
          <TouchableOpacity
            style={[
              styles.notifyBtn,
              {
                backgroundColor: isSubscribedNotify
                  ? colors.successSoft
                  : colors.accent,
                borderColor: isSubscribedNotify
                  ? colors.success
                  : colors.accent,
              },
            ]}
            onPress={handleNotifyMe}
            disabled={notifyMeLoading || isSubscribedNotify}
            activeOpacity={0.85}
          >
            {notifyMeLoading ? (
              <ActivityIndicator
                size="small"
                color={
                  isSubscribedNotify
                    ? colors.success
                    : colors.accentForeground
                }
              />
            ) : (
              <>
                <Ionicons
                  name={
                    isSubscribedNotify
                      ? "checkmark-circle"
                      : "notifications-outline"
                  }
                  size={18}
                  color={
                    isSubscribedNotify
                      ? colors.success
                      : colors.accentForeground
                  }
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.cartBtnText,
                    {
                      color: isSubscribedNotify
                        ? colors.success
                        : colors.accentForeground,
                    },
                  ]}
                >
                  {isSubscribedNotify ? "Subscribed" : "Notify Me"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.buyRow}>
            <TouchableOpacity
              style={[
                styles.cartBtn,
                {
                  backgroundColor: inStock
                    ? colors.primary
                    : colors.textTertiary,
                },
              ]}
              onPress={addToCart}
              disabled={cartLoading || !inStock}
              activeOpacity={0.85}
            >
              {cartLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
              ) : (
                <>
                  <Ionicons
                    name="bag-add-outline"
                    size={18}
                    color={colors.primaryForeground}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.cartBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Add to Bag
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buyNowBtn,
                {
                  backgroundColor: inStock
                    ? colors.accent
                    : colors.textTertiary,
                },
              ]}
              onPress={buyNow}
              disabled={buyNowLoading || !inStock}
              activeOpacity={0.85}
            >
              {buyNowLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.accentForeground}
                />
              ) : (
                <>
                  <Ionicons
                    name="flash"
                    size={18}
                    color={colors.accentForeground}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.cartBtnText,
                      { color: colors.accentForeground },
                    ]}
                  >
                    Buy Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingLabel: {
    marginTop: 16,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 3,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    letterSpacing: 0.5,
  },
  goBackBtn: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1,
  },
  goBackText: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },

  // ── Sticky Header ─────────────────────────
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: STATUS_H + 50,
    zIndex: 100,
    paddingTop: STATUS_H,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 50,
  },
  stickyTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
    textTransform: "uppercase",
  },

  // ── Floating Nav ──────────────────────────
  floatingNav: {
    position: "absolute",
    top: STATUS_H + 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 90,
  },
  floatingPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Gallery ───────────────────────────────
  galleryWrap: { height: GALLERY_HEIGHT, backgroundColor: "#111" },
  imgFrame: { width: W, height: GALLERY_HEIGHT },
  img: { width: W, height: "100%" },
  galleryGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  indicatorRow: {
    position: "absolute",
    bottom: 20,
    left: 24,
    flexDirection: "row",
    gap: 5,
  },
  indicatorBar: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  indicatorActive: { backgroundColor: "#FFF", width: 32 },
  counterChip: {
    position: "absolute",
    bottom: 20,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  counterText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // ── Content ───────────────────────────────
  content: {
    paddingTop: 28,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  productName: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: -0.3,
    lineHeight: 36,
    marginBottom: 12,
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusChipText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  // ── Price ─────────────────────────────────
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLeft: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  priceMain: { fontSize: 32, fontWeight: "300", letterSpacing: -0.5 },
  priceStrike: { fontSize: 16, textDecorationLine: "line-through" },
  saveBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  saveBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // ── Stock ─────────────────────────────────
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockLabel: { fontSize: 13, fontWeight: "500" },

  // ── Shared ────────────────────────────────
  divider: { height: 1, marginVertical: 28 },
  section: { marginBottom: 4 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2.5 },
  sectionValue: { fontSize: 14, fontWeight: "500" },

  // ── Colors ────────────────────────────────
  colorRow: { gap: 14, paddingVertical: 4 },
  colorWrap: { alignItems: "center", gap: 6 },
  colorRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    padding: 3,
  },
  colorDot: { flex: 1, borderRadius: 18 },
  colorUnderline: { width: 14, height: 2, borderRadius: 1 },

  // ── Description ───────────────────────────
  descText: {
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "400",
    letterSpacing: 0.15,
  },

  // ── Specs ─────────────────────────────────
  specCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  specKey: { fontSize: 13, fontWeight: "500" },
  specVal: { fontSize: 13, fontWeight: "600" },

  // ── Admin ─────────────────────────────────
  adminRow: { flexDirection: "row", gap: 12 },
  adminBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  adminBtnLabel: { fontSize: 14, fontWeight: "700" },

  // ── Bottom Bar ────────────────────────────
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  wishBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnText: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  buyRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  buyNowBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  notifyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProductDetailScreen;
