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
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ProductReviews from "@/components/ProductReviews";
import TryOnModal from "@/components/TryOnModal";
import { useThemeColors } from "@/hooks/useThemeColor";
import { ProductVariant } from "@/types/product";

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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [showAddedConfirm, setShowAddedConfirm] = useState(false);
  const [notifyMeLoading, setNotifyMeLoading] = useState(false);
  const [isSubscribedNotify, setIsSubscribedNotify] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ details: true });
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [showTryOn, setShowTryOn] = useState(false);

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

        // Set initial color/size selection
        if (data.variants?.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedColor(firstVariant.color || firstVariant.attributes?.color || null);
          setSelectedSize(firstVariant.size || firstVariant.attributes?.size || null);
        }

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

        // Fetch similar products in background
        fetch(`${getApiUrl()}/products/${productId}/similar?limit=8`)
          .then((r) => (r.ok ? r.json() : []))
          .then((items) => setSimilarProducts(Array.isArray(items) ? items : []))
          .catch(() => {});

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
    setSelectedColor(null);
    setSelectedSize(null);
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

  // Derive active variant from selected color + size
  const getActiveVariant = (): ProductVariant | undefined => {
    if (!product?.variants?.length) return undefined;
    return product.variants.find((v) => {
      const vColor = v.color || v.attributes?.color;
      const vSize = v.size || v.attributes?.size;
      const colorMatch = vColor === selectedColor;
      const sizeMatch = !vSize || vSize === selectedSize;
      return colorMatch && sizeMatch;
    });
  };

  // Get unique colors from variants
  const getUniqueColors = (): string[] => {
    if (!product?.variants?.length) return [];
    const colors = product.variants.map(
      (v) => v.color || v.attributes?.color || "",
    );
    return [...new Set(colors)].filter(Boolean);
  };

  // Get available sizes for selected color
  const getSizesForColor = (): string[] => {
    if (!product?.variants?.length || !selectedColor) return [];
    return product.variants
      .filter((v) => (v.color || v.attributes?.color) === selectedColor)
      .map((v) => v.size || v.attributes?.size || "")
      .filter(Boolean);
  };

  const addToCart = async () => {
    if (!token) {
      Alert.alert("Login Required", "Sign in to add items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    const hasVariants = product?.hasVariants || (product?.variants?.length || 0) > 0;
    const variant = getActiveVariant();

    if (hasVariants && !variant) {
      Alert.alert("Select Options", "Please select a color and size.");
      return;
    }

    const currentStock = variant ? variant.stock : (product?.stock || 0);
    if (currentStock <= 0) {
      Alert.alert("Unavailable", "This item is out of stock.");
      return;
    }

    setCartLoading(true);
    try {
      const body: any = { productId: Number(productId), quantity: 1 };
      if (variant) body.variantId = variant.id;

      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed");
      }
      setCartLoading(false);
      setShowAddedConfirm(true);
      setTimeout(() => setShowAddedConfirm(false), 2000);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setCartLoading(false);
    }
  };

  const buyNow = async () => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const hasVariants = product?.hasVariants || (product?.variants?.length || 0) > 0;
    const variant = getActiveVariant();

    if (hasVariants && !variant) {
      Alert.alert("Select Options", "Please select a color and size.");
      return;
    }

    const currentStock = variant ? variant.stock : (product?.stock || 0);
    if (currentStock <= 0) {
      Alert.alert("Unavailable", "This item is out of stock.");
      return;
    }

    setBuyNowLoading(true);
    try {
      const body: any = { productId: Number(productId), quantity: 1 };
      if (variant) body.variantId = variant.id;

      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

  const toggleSection = (key: string) =>
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

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

  const hasVariants = product.hasVariants || (product.variants?.length || 0) > 0;
  const variant = hasVariants ? getActiveVariant() : undefined;
  const uniqueColors = getUniqueColors();
  const availableSizes = getSizesForColor();

  const hasDiscount =
    product.salePrice !== undefined && product.salePrice < product.price;
  const price =
    variant?.priceOverride || (hasDiscount ? product.salePrice : product.price);
  const currentStock = variant ? variant.stock : product.stock;
  const inStock = currentStock > 0;
  const allOutOfStock = hasVariants
    ? product.variants.every((v) => v.stock <= 0)
    : product.stock <= 0;

  // Images: variant images if variant selected, else product images
  const displayImages = variant?.images?.length
    ? variant.images
    : product.images?.length
      ? product.images
      : product.variants?.[0]?.images || [];

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

      {/* ── Try On Modal ──────────────────────── */}
      {showTryOn && displayImages.length > 0 && (
        <TryOnModal
          visible={showTryOn}
          garmentImageUrl={displayImages[selectedImage] || displayImages[0]}
          onClose={() => setShowTryOn(false)}
        />
      )}

      {/* ── Added to Bag Confirmation ──────────── */}
      {showAddedConfirm && (
        <View style={styles.addedOverlay}>
          <View style={styles.addedCard}>
            <View style={styles.addedCheckCircle}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={styles.addedTitle}>ADDED TO BAG</Text>
            <Text style={styles.addedSubtitle}>{product.name}</Text>
            <TouchableOpacity
              style={styles.addedViewBag}
              onPress={() => {
                setShowAddedConfirm(false);
                router.push("/cart");
              }}
            >
              <Text style={styles.addedViewBagText}>VIEW BAG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddedConfirm(false)}
              style={styles.addedContinue}
            >
              <Text style={styles.addedContinueText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Sticky Header ─────────────────────── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            opacity: headerOpacity,
            backgroundColor: colors.background,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.stickyInner}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[styles.stickyTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <TouchableOpacity hitSlop={12}>
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Floating Nav ──────────────────────── */}
      <View style={styles.floatingNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.floatingPill, { borderColor: colors.borderLight }]}
        >
          <Ionicons name="arrow-back" size={17} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingPill, { borderColor: colors.borderLight }]}
        >
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
            {displayImages.map((uri: string, i: number) => (
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

          {/* Image indicator bars */}
          <View style={styles.indicatorRow}>
            {displayImages.map((_: string, i: number) => (
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
              {selectedImage + 1}/{displayImages.length || 0}
            </Text>
          </View>

          {/* Try-on icon */}
          {displayImages.length > 0 && (
            <TouchableOpacity
              style={styles.tryOnBtn}
              onPress={() => setShowTryOn(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="body-outline" size={16} color="#fff" />
              <Text style={styles.tryOnBtnText}>TRY ON</Text>
            </TouchableOpacity>
          )}
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
            <Text style={[styles.brandLabel, { color: colors.text }]}>
              {product.brand.name?.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>

          {/* Status chip */}
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
              {inStock ? `${currentStock} in stock` : "Out of stock"}
            </Text>
          </View>

          {/* ── Divider ───────────────────────── */}
          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Color Picker (only if product has variants) ──── */}
          {hasVariants && uniqueColors.length > 0 && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textTertiary }]}
                  >
                    COLOR
                  </Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedColor}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorRow}
                >
                  {uniqueColors.map((colorVal) => {
                    const active = selectedColor === colorVal;
                    // Use the color value as hex (it's stored as hex from the palette)
                    const hex = colorVal.startsWith("#")
                      ? colorVal
                      : colorVal.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={colorVal}
                        onPress={() => {
                          setSelectedColor(colorVal);
                          setSelectedImage(0);
                          // Auto-select first available size for this color
                          const sizes = product.variants
                            .filter(
                              (v) =>
                                (v.color || v.attributes?.color) === colorVal,
                            )
                            .map((v) => v.size || v.attributes?.size || "")
                            .filter(Boolean);
                          setSelectedSize(sizes[0] || null);
                        }}
                        style={styles.colorWrap}
                      >
                        <View
                          style={[
                            styles.colorRing,
                            {
                              borderColor: active
                                ? colors.text
                                : colors.borderLight,
                            },
                          ]}
                        >
                          <View
                            style={[styles.colorDot, { backgroundColor: hex }]}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.borderLight }]}
              />
            </>
          )}

          {/* ── Size Selector (only if variants have sizes) ──── */}
          {hasVariants && availableSizes.length > 0 && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text
                    style={[styles.sectionLabel, { color: colors.textTertiary }]}
                  >
                    SIZE
                  </Text>
                  <Text style={[styles.sectionValue, { color: colors.text }]}>
                    {selectedSize}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorRow}
                >
                  {availableSizes.map((size) => {
                    const active = selectedSize === size;
                    // Check if this color+size combo has stock
                    const sizeVariant = product.variants.find(
                      (v) =>
                        (v.color || v.attributes?.color) === selectedColor &&
                        (v.size || v.attributes?.size) === size,
                    );
                    const sizeInStock = (sizeVariant?.stock || 0) > 0;
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => sizeInStock && setSelectedSize(size)}
                        disabled={!sizeInStock}
                        style={[
                          styles.sizeChip,
                          {
                            borderColor: active
                              ? colors.text
                              : colors.borderLight,
                            backgroundColor: active
                              ? colors.text
                              : "transparent",
                            opacity: sizeInStock ? 1 : 0.35,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            {
                              color: active ? colors.background : colors.text,
                            },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.borderLight }]}
              />
            </>
          )}

          {/* ── Accordion: DETAILS ────────────── */}
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleSection("details")}
            activeOpacity={0.7}
          >
            <Text style={[styles.accordionTitle, { color: colors.text }]}>
              DETAILS
            </Text>
            <Ionicons
              name={expandedSections.details ? "remove" : "add"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.details && (
            <View style={styles.accordionBody}>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                {product.description}
              </Text>
            </View>
          )}

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Accordion: SIZE & FIT ─────────── */}
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleSection("sizeFit")}
            activeOpacity={0.7}
          >
            <Text style={[styles.accordionTitle, { color: colors.text }]}>
              SIZE & FIT
            </Text>
            <Ionicons
              name={expandedSections.sizeFit ? "remove" : "add"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.sizeFit && (
            <View style={styles.accordionBody}>
              {[
                { k: "Type", v: product.productType },
                { k: "Season", v: product.season },
              ].map((item) => (
                <View key={item.k} style={styles.accordionRow}>
                  <Text
                    style={[
                      styles.accordionKey,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {item.k}
                  </Text>
                  <Text
                    style={[styles.accordionVal, { color: colors.text }]}
                  >
                    {item.v}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Accordion: COMPOSITION & CARE ─── */}
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleSection("composition")}
            activeOpacity={0.7}
          >
            <Text style={[styles.accordionTitle, { color: colors.text }]}>
              COMPOSITION & CARE
            </Text>
            <Ionicons
              name={expandedSections.composition ? "remove" : "add"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.composition && (
            <View style={styles.accordionBody}>
              {[
                { k: "Material", v: product.material || "\u2014" },
                { k: "Origin", v: product.origin || "Locally Made" },
              ].map((item) => (
                <View key={item.k} style={styles.accordionRow}>
                  <Text
                    style={[
                      styles.accordionKey,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {item.k}
                  </Text>
                  <Text
                    style={[styles.accordionVal, { color: colors.text }]}
                  >
                    {item.v}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Accordion: DELIVERY & RETURNS ─── */}
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleSection("delivery")}
            activeOpacity={0.7}
          >
            <Text style={[styles.accordionTitle, { color: colors.text }]}>
              DELIVERY & RETURNS
            </Text>
            <Ionicons
              name={expandedSections.delivery ? "remove" : "add"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.delivery && (
            <View style={styles.accordionBody}>
              <View style={styles.deliveryRow}>
                <Ionicons name="cube-outline" size={18} color={colors.text} />
                <Text
                  style={[
                    styles.deliveryText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Free standard delivery on all orders
                </Text>
              </View>
              <View style={styles.deliveryRow}>
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.deliveryText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Easy returns within 30 days
                </Text>
              </View>
              <View style={styles.deliveryRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.deliveryText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Secure checkout guaranteed
                </Text>
              </View>
            </View>
          )}

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Trust Signals ─────────────────── */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="cube-outline" size={20} color={colors.text} />
              <Text
                style={[styles.trustText, { color: colors.textSecondary }]}
              >
                Free Delivery
              </Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.text}
              />
              <Text
                style={[styles.trustText, { color: colors.textSecondary }]}
              >
                Secure Payment
              </Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="refresh-outline" size={20} color={colors.text} />
              <Text
                style={[styles.trustText, { color: colors.textSecondary }]}
              >
                Easy Returns
              </Text>
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.borderLight }]}
          />

          {/* ── Reviews ───────────────────────── */}
          <ProductReviews productId={product.id} />

          {/* ── You May Also Like ───────────────── */}
          {similarProducts.length > 0 && (
            <>
              <View
                style={[styles.divider, { backgroundColor: colors.borderLight }]}
              />
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textTertiary, marginBottom: 14 },
                  ]}
                >
                  YOU MAY ALSO LIKE
                </Text>
                <FlatList
                  data={similarProducts}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                  keyExtractor={(item) => `similar-${item.id}`}
                  renderItem={({ item }) => {
                    const img =
                      item.variants?.[0]?.images?.[0] ||
                      item.variants?.[0]?.variantImages?.[0] ||
                      item.mainImage ||
                      "";
                    const hasItemDiscount =
                      item.salePrice && item.salePrice < item.price;
                    return (
                      <TouchableOpacity
                        style={{
                          width: 140,
                          backgroundColor: colors.surface,
                        }}
                        onPress={() =>
                          router.push(`/products/${item.id}` as any)
                        }
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: img }}
                          style={{
                            width: 140,
                            height: 180,
                            backgroundColor: colors.surfaceRaised,
                          }}
                        />
                        <View style={{ padding: 8 }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: 0.8,
                              color: colors.textTertiary,
                              marginBottom: 2,
                            }}
                            numberOfLines={1}
                          >
                            {item.brand?.name || ""}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: colors.text,
                              marginBottom: 4,
                            }}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "800",
                                color: hasItemDiscount
                                  ? colors.priceCurrent
                                  : colors.text,
                              }}
                            >
                              $
                              {(item.salePrice || item.price)?.toFixed(2)}
                            </Text>
                            {hasItemDiscount && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: colors.textTertiary,
                                  textDecorationLine: "line-through",
                                }}
                              >
                                ${item.price?.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </>
          )}

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
              borderColor: isInWishlist ? colors.text : colors.border,
              backgroundColor: isInWishlist ? colors.primarySoft : "transparent",
            },
          ]}
          onPress={toggleWishlist}
          disabled={wishlistLoading}
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons
              name={isInWishlist ? "heart" : "heart-outline"}
              size={22}
              color={colors.text}
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
                  {isSubscribedNotify ? "SUBSCRIBED" : "NOTIFY ME"}
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
                <Text
                  style={[
                    styles.cartBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  ADD TO BAG
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buyNowBtn,
                {
                  borderColor: inStock ? colors.text : colors.textTertiary,
                },
              ]}
              onPress={buyNow}
              disabled={buyNowLoading || !inStock}
              activeOpacity={0.85}
            >
              {buyNowLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text
                  style={[
                    styles.cartBtnText,
                    { color: inStock ? colors.text : colors.textTertiary },
                  ]}
                >
                  BUY NOW
                </Text>
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

  // ── Added to Bag Overlay ────────────────
  addedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  addedCard: {
    width: 280,
    backgroundColor: "#fff",
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  addedCheckCircle: {
    width: 56,
    height: 56,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  addedTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: "#000",
    marginBottom: 6,
  },
  addedSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  addedViewBag: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  addedViewBagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  addedContinue: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  addedContinueText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
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
    borderBottomWidth: 1,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 50,
  },
  stickyTitle: {
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
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Gallery ───────────────────────────────
  galleryWrap: { height: GALLERY_HEIGHT, backgroundColor: "#F5F5F5" },
  imgFrame: { width: W, height: GALLERY_HEIGHT },
  img: { width: W, height: "100%" },
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
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  indicatorActive: { backgroundColor: "#000", width: 32 },
  counterChip: {
    position: "absolute",
    bottom: 20,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  counterText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tryOnBtn: {
    position: "absolute",
    bottom: 20,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tryOnBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // ── Content ───────────────────────────────
  content: {
    paddingTop: 28,
    paddingHorizontal: 24,
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
  saveBadge: { paddingHorizontal: 10, paddingVertical: 5 },
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
  divider: { height: 1, marginVertical: 20 },
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
  colorWrap: { alignItems: "center" },
  colorRing: {
    width: 40,
    height: 40,
    borderWidth: 2,
    padding: 3,
  },
  colorDot: { flex: 1 },
  sizeChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: "center",
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Accordion ─────────────────────────────
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  accordionBody: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  accordionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  accordionKey: { fontSize: 13, fontWeight: "500" },
  accordionVal: { fontSize: 13, fontWeight: "600" },

  // ── Description ───────────────────────────
  descText: {
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "400",
    letterSpacing: 0.15,
  },

  // ── Delivery rows ─────────────────────────
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  deliveryText: {
    fontSize: 14,
    fontWeight: "400",
  },

  // ── Trust Signals ─────────────────────────
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  trustItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  trustText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // ── Admin ─────────────────────────────────
  adminRow: { flexDirection: "row", gap: 12 },
  adminBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
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
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtn: {
    flex: 1,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  buyRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  buyNowBtn: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  notifyBtn: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProductDetailScreen;
