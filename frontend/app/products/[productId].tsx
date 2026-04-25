import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useBrand } from "@/context/BrandContext";
import ProductReviews from "@/components/ProductReviews";
import TryOnModal from "@/components/TryOnModal";
import Header from "@/components/Header";
import { ProductVariant } from "@/types/product";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColor";

const { width: W } = Dimensions.get("window");

const MARQUEE_TEXT =
  "COMPLIMENTARY GIFT WRAPPING  ·  FREE RETURNS WITHIN 30 DAYS  ·  ARCHIVAL RELEASE #001  ·  ";

const ProductDetailScreen = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const { refresh: refreshCart } = useCart();
  const { showToast } = useToast();
  const { incrementProductListVersion } = useBrand();
  const userRole = user?.role || user?.userRole;
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

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
  const [showTryOn, setShowTryOn] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);

  const imageCarouselRef = useRef<FlatList>(null);
  const marqueeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(marqueeAnim, {
        toValue: -1,
        duration: 18000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

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

        if (data.variants?.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedColor(
            firstVariant.color || firstVariant.attributes?.color || null,
          );
          setSelectedSize(
            firstVariant.size || firstVariant.attributes?.size || null,
          );
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

  const getActiveVariant = (): ProductVariant | undefined => {
    if (!product?.variants?.length || !selectedSize) return undefined;
    return product.variants.find((v) => v.size === selectedSize);
  };

  const getAvailableSizes = (): string[] => {
    if (!product?.variants?.length) return [];
    return product.variants.map((v) => v.size || "").filter(Boolean);
  };

  const getVariantColors = (): string[] => {
    if (!product?.variants?.length) return [];
    const colors = product.variants
      .map((v: any) => v.color || v.attributes?.color)
      .filter(Boolean);
    return [...new Set(colors)] as string[];
  };

  const addToCart = async () => {
    if (!token) {
      Alert.alert("Login Required", "Sign in to add items.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    const hasVariants =
      product?.hasVariants || (product?.variants?.length || 0) > 0;
    const variant = getActiveVariant();

    if (hasVariants && !variant) {
      Alert.alert("Select Options", "Please select a size.");
      return;
    }

    const currentStock = variant ? variant.stock : product?.stock || 0;
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
      refreshCart();
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

    const hasVariants =
      product?.hasVariants || (product?.variants?.length || 0) > 0;
    const variant = getActiveVariant();

    if (hasVariants && !variant) {
      Alert.alert("Select Options", "Please select a size.");
      return;
    }

    const currentStock = variant ? variant.stock : product?.stock || 0;
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
      refreshCart();
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
            const text = await res.text();
            if (!res.ok) throw new Error(text || "Failed to delete product");
            incrementProductListVersion();
            Alert.alert("Success", "Product deleted.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  // ── Loading / Error ──────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header showBack={true} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>LOADING</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Header showBack={true} />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Product Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.goBackBtn, { borderColor: colors.text }]}>
            <Text style={[styles.goBackText, { color: colors.text }]}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasVariants =
    product.hasVariants || (product.variants?.length || 0) > 0;
  const variant = hasVariants ? getActiveVariant() : undefined;
  const availableSizes = getAvailableSizes();
  const variantColors = getVariantColors();

  const hasDiscount =
    product.salePrice !== undefined && product.salePrice < product.price;
  const price = hasDiscount ? product.salePrice : product.price;
  const currencySymbol = "EGP";
  const currentStock = variant ? variant.stock : product.stock;
  const inStock = currentStock > 0;
  const allOutOfStock = hasVariants
    ? product.variants.every((v) => v.stock <= 0)
    : product.stock <= 0;

  const displayImages = product.images?.length
    ? product.images
    : product.mainImage
      ? [product.mainImage]
      : [];

  const isOwnerOrAdmin =
    userRole === "admin" ||
    (user?.id &&
      product?.brand?.owner?.id &&
      user.id === product.brand.owner.id);

  const heroImage = displayImages[selectedImage] || displayImages[0] || null;

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / W);
    if (index !== selectedImage && index >= 0 && index < displayImages.length) {
      setSelectedImage(index);
    }
  };

  const scrollToImage = (index: number) => {
    setSelectedImage(index);
    imageCarouselRef.current?.scrollToOffset({ offset: index * W, animated: true });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Try On Modal */}
      {showTryOn && displayImages.length > 0 && (
        <TryOnModal
          visible={showTryOn}
          garmentImageUrl={displayImages[selectedImage] || displayImages[0]}
          onClose={() => setShowTryOn(false)}
        />
      )}

      {/* Added to Bag Confirmation Overlay */}
      {showAddedConfirm && (
        <View style={[styles.addedOverlay, { backgroundColor: colors.surfaceOverlay }]}>
          <View style={[styles.addedCard, { backgroundColor: colors.background }]}>
            <View style={[styles.addedCheckBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={28} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.addedTitle, { color: colors.text }]}>ADDED TO BAG</Text>
            <Text style={[styles.addedSubtitle, { color: colors.textSecondary }]}>{product.name}</Text>
            <TouchableOpacity
              style={[styles.addedViewBag, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowAddedConfirm(false);
                router.push("/cart");
              }}
            >
              <Text style={[styles.addedViewBagText, { color: colors.primaryForeground }]}>VIEW BAG</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddedConfirm(false)}
              style={[styles.addedContinue, { borderColor: colors.text }]}
            >
              <Text style={[styles.addedContinueText, { color: colors.text }]}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Header showBack={true} />

      {/* Main scroll + sticky bottom bar in a flex column */}
      <View style={{ flex: 1, flexDirection: "column" }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Hero Image Carousel */}
          <View style={[styles.heroContainer, { backgroundColor: colors.surfaceRaised }]}>
            {displayImages.length > 1 ? (
              <FlatList
                ref={imageCarouselRef}
                data={displayImages}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onCarouselScroll}
                getItemLayout={(_, index) => ({
                  length: W,
                  offset: W * index,
                  index,
                })}
                renderItem={({ item: uri }) => (
                  <Image
                    source={{ uri }}
                    style={{ width: W, height: "100%" }}
                    resizeMode="cover"
                  />
                )}
              />
            ) : heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
              </View>
            )}

            {/* Top-right action icons: wishlist + share */}
            <View style={styles.heroActionsTopRight}>
              <TouchableOpacity
                onPress={toggleWishlist}
                disabled={wishlistLoading}
                style={styles.heroActionBtn}
                activeOpacity={0.7}
              >
                {wishlistLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons
                    name={isInWishlist ? "heart" : "heart-outline"}
                    size={20}
                    color={colors.text}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionBtn} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Bottom-right try-on icon */}
            <View style={styles.heroActionsBottomRight}>
              <TouchableOpacity
                style={styles.heroActionBtn}
                onPress={() => setShowTryOn(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="shirt-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Indicators (dash style) */}
          {displayImages.length > 1 && (
            <View style={[styles.indicatorRow, { backgroundColor: colors.background }]}>
              {displayImages.map((_: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => scrollToImage(i)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          selectedImage === i
                            ? colors.text
                            : colors.border,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Product Info Section */}
          <View style={styles.infoSection}>
            {/* Title + Price on the same line */}
            <View style={styles.titlePriceRow}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                {product.name?.toUpperCase()}
              </Text>
              <View style={styles.priceContainer}>
                {hasDiscount ? (
                  <View style={styles.priceGroup}>
                    <Text style={[styles.priceCurrent, { color: colors.text }]}>
                      {currencySymbol}{price?.toFixed(2)}
                    </Text>
                    <Text style={[styles.priceOriginalStrike, { color: colors.danger }]}>
                      {currencySymbol}{product.price.toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.priceCurrent, { color: colors.text }]}>{currencySymbol}{price?.toFixed(2)}</Text>
                )}
              </View>
            </View>

            {/* Status badge if not published */}
            {product.status !== "published" && (
              <View style={[styles.statusChip, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.statusChipText, { color: colors.textSecondary }]}>
                  {(product.status || "draft").toUpperCase()}
                </Text>
              </View>
            )}

            {/* SKU / Product ID */}
            <Text style={[styles.skuText, { color: colors.textSecondary }]}>
              {`SKU${String(product.id).padStart(6, "0")}`}
            </Text>

            {/* Brand name link */}
            {product.brand?.name && (
              <TouchableOpacity
                onPress={() =>
                  product.brand?.id &&
                  router.push(`/brands/${product.brand.id}`)
                }
                activeOpacity={0.7}
                style={styles.brandLink}
              >
                <Text style={[styles.brandName, { color: colors.textSecondary }]}>
                  {product.brand.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}

            {/* Category */}
            {product.subcategory && (
              <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                {product.subcategory.toUpperCase()}
              </Text>
            )}

            {/* Rating + Review Count */}
            {(product.averageRating || product.reviewCount) ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={
                      star <= Math.round(product.averageRating || 0)
                        ? "star"
                        : "star-outline"
                    }
                    size={13}
                    color={colors.text}
                  />
                ))}
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {(product.averageRating || 0).toFixed(1)}
                </Text>
                {(product.reviewCount || 0) > 0 && (
                  <Text style={[styles.reviewCountText, { color: colors.textSecondary }]}>
                    ({product.reviewCount} {product.reviewCount === 1 ? "REVIEW" : "REVIEWS"})
                  </Text>
                )}
              </View>
            ) : null}

            {/* Badges: New Arrival / Featured / Low Stock */}
            {(product.isNewArrival || product.isFeatured || (inStock && product.isLowStock)) && (
              <View style={styles.badgeRow}>
                {product.isNewArrival && (
                  <View style={[styles.badge, { backgroundColor: colors.text }]}>
                    <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>NEW ARRIVAL</Text>
                  </View>
                )}
                {product.isFeatured && (
                  <View style={[styles.badge, { backgroundColor: colors.text }]}>
                    <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>FEATURED</Text>
                  </View>
                )}
                {inStock && product.isLowStock && (
                  <View style={[styles.badge, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.danger }]}>
                    <Text style={[styles.badgeText, { color: colors.danger }]}>LOW STOCK</Text>
                  </View>
                )}
              </View>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {product.tags.map((tag, i) => (
                  <View key={i} style={[styles.tagChip, { borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Configuration / Selection */}
          <View style={styles.configSection}>
            {/* Color selector */}
            {(variantColors.length > 0 || product.color) && (
              <View style={styles.colorSection}>
                <View style={styles.colorLabelRow}>
                  <Text style={[styles.configLabel, { color: colors.textSecondary }]}>COLOR:</Text>
                  <Text style={[styles.configValue, { color: colors.text }]}>
                    {(
                      selectedColor ||
                      product.color ||
                      variantColors[0] ||
                      ""
                    ).toUpperCase()}
                  </Text>
                </View>
                {variantColors.length > 1 && (
                  <View style={styles.swatchRow}>
                    {variantColors.map((color: string, i: number) => {
                      const isSelected = selectedColor === color;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedColor(color)}
                          style={[
                            styles.swatchOuter,
                            isSelected && [styles.swatchOuterSelected, { borderColor: colors.text }],
                          ]}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.swatch,
                              { backgroundColor: color },
                            ]}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Size Selector */}
            {hasVariants && availableSizes.length > 0 && (
              <View style={styles.sizeSection}>
                <View style={styles.sizeHeaderRow}>
                  <Text style={[styles.configLabel, { color: colors.textSecondary }]}>SIZE:</Text>
                  <Text style={[styles.sizeGuideLink, { color: colors.link }]}>SIZE GUIDE</Text>
                </View>
                <View style={styles.sizeRow}>
                  {availableSizes.map((size) => {
                    const isActive = selectedSize === size;
                    const sizeVariant = product.variants.find(
                      (v) => v.size === size,
                    );
                    const sizeInStock = (sizeVariant?.stock || 0) > 0;
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => sizeInStock && setSelectedSize(size)}
                        disabled={!sizeInStock}
                        style={[
                          styles.sizeBox,
                          isActive && [styles.sizeBoxSelected, { borderColor: colors.text }],
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.sizeBoxText,
                            { color: colors.textSecondary },
                            isActive && { color: colors.text, fontFamily: "Inter_700Bold" },
                            !sizeInStock && { color: colors.textTertiary, fontStyle: "italic" as const },
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Accordion Sections */}
          <View style={[styles.accordionContainer, { borderTopColor: colors.borderLight }]}>
            {/* DETAILS row */}
            <TouchableOpacity
              style={styles.accordionRow}
              onPress={() => setDetailsExpanded(!detailsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionLabel, { color: colors.text }]}>DETAILS</Text>
              <Ionicons
                name={detailsExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Expanded details content */}
            {detailsExpanded && (
              <View style={[styles.accordionContent, { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.borderLight }]}>
                {product.description ? (
                  <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                    {product.description}
                  </Text>
                ) : null}

                {(product.material ||
                  product.productType ||
                  product.season ||
                  product.origin ||
                  product.gender ||
                  product.careInstructions) && (
                  <View style={styles.metaBlock}>
                    {product.material && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        MATERIAL: {product.material.toUpperCase()}
                      </Text>
                    )}
                    {product.productType && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        TYPE: {product.productType.toUpperCase()}
                      </Text>
                    )}
                    {product.gender && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        GENDER: {product.gender.toUpperCase()}
                      </Text>
                    )}
                    {product.season && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        SEASON: {product.season.toUpperCase()}
                      </Text>
                    )}
                    {product.origin && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        ORIGIN: {product.origin.toUpperCase()}
                      </Text>
                    )}
                    {product.careInstructions && (
                      <Text style={[styles.metaLine, { color: colors.textSecondary }]}>
                        CARE: {product.careInstructions.toUpperCase()}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* SHIPPING row */}
            <TouchableOpacity
              style={styles.accordionRow}
              onPress={() => setShippingExpanded(!shippingExpanded)}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionLabel, { color: colors.text }]}>SHIPPING</Text>
              <Ionicons
                name={shippingExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {shippingExpanded && (
              <View style={[styles.accordionContent, { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                  Standard shipping 3–5 business days. Express shipping available at checkout. Free shipping on orders over $100.
                </Text>
              </View>
            )}

            {/* RETURNS row */}
            <TouchableOpacity
              style={styles.accordionRow}
              onPress={() => setReturnsExpanded(!returnsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionLabel, { color: colors.text }]}>RETURNS</Text>
              <Ionicons
                name={returnsExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {returnsExpanded && (
              <View style={[styles.accordionContent, { backgroundColor: colors.surfaceRaised, borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                  Free returns within 30 days of delivery. Items must be unworn with original tags attached. Refunds processed within 5–7 business days.
                </Text>
              </View>
            )}
          </View>

          {/* Reviews */}
          <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
            <ProductReviews productId={product.id} />
          </View>

          {/* Marquee strip */}
          <View style={[styles.marqueeContainer, { backgroundColor: colors.primary }]}>
            <Animated.View
              style={[
                styles.marqueeTrack,
                {
                  transform: [
                    {
                      translateX: marqueeAnim.interpolate({
                        inputRange: [-1, 0],
                        outputRange: [-W * 2, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.marqueeText, { color: colors.primaryForeground }]}>
                {MARQUEE_TEXT.repeat(6)}
              </Text>
            </Animated.View>
          </View>

          {/* Admin Controls */}
          {isOwnerOrAdmin && (
            <View style={styles.adminSection}>
              <Text style={[styles.adminLabel, { color: colors.textSecondary }]}>MANAGE</Text>
              <View style={styles.adminRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/products/edit/${productId}`)}
                  style={[styles.adminEditBtn, { borderColor: colors.text }]}
                >
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                  <Text style={[styles.adminBtnLabel, { color: colors.text }]}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.adminDeleteBtn, { borderColor: colors.danger }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.adminDeleteLabel, { color: colors.danger }]}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Bottom Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + 12, borderTopColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          {allOutOfStock ? (
            <TouchableOpacity
              style={[
                styles.addToBagBtn,
                {
                  flex: 0,
                  width: "100%",
                  backgroundColor: isSubscribedNotify ? colors.primaryMuted : colors.primary,
                },
              ]}
              onPress={handleNotifyMe}
              disabled={notifyMeLoading || isSubscribedNotify}
              activeOpacity={0.85}
            >
              {notifyMeLoading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={styles.addToBagText}>
                  {isSubscribedNotify ? "SUBSCRIBED" : "NOTIFY ME"}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={[
                  styles.addToBagBtn,
                  { backgroundColor: inStock ? colors.primary : colors.textTertiary },
                ]}
                onPress={addToCart}
                disabled={cartLoading || !inStock}
                activeOpacity={0.85}
              >
                {cartLoading ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.addToBagText}>ADD TO BAG</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buyNowBtn}
                onPress={buyNow}
                disabled={buyNowLoading || !inStock}
                activeOpacity={0.85}
              >
                {buyNowLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.buyNowText}>BUY NOW</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingLabel: {
    marginTop: 16,
    fontSize: 10,
    fontFamily: undefined,
    // letterSpacing: 3,
    color: "#757c7d",
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: undefined,
    marginTop: 20,
    color: "#2d3435",
  },
  goBackBtn: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "#2d3435",
  },
  goBackText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 2,
    color: "#2d3435",
    textTransform: "uppercase",
  },

  // ── Added to Bag Overlay ──────────────────────────
  addedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  addedCard: {
    width: 300,
    backgroundColor: "#f9f9f9",
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  addedCheckBox: {
    width: 56,
    height: 56,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  addedTitle: {
    fontSize: 13,
    fontFamily: undefined,
    // letterSpacing: 2.5,
    color: "#2d3435",
    marginBottom: 6,
  },
  addedSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#757c7d",
    textAlign: "center",
    marginBottom: 24,
  },
  addedViewBag: {
    width: "100%",
    backgroundColor: "#000",
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  addedViewBagText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },
  addedContinue: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3435",
  },
  addedContinueText: {
    color: "#2d3435",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Hero Image ────────────────────────────────────
  heroContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  heroActionsTopRight: {
    position: "absolute",
    top: 48,
    right: 16,
    flexDirection: "column",
    gap: 24,
    zIndex: 20,
  },
  heroActionsBottomRight: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 20,
  },
  heroActionBtn: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Image Indicators ───────────────────────────────
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
    backgroundColor: "#ffffff",
  },
  indicator: {
    width: 32,
    height: 2,
  },
  indicatorActive: {
    backgroundColor: "#000000",
  },
  indicatorInactive: {
    backgroundColor: "#e5e5e5",
  },

  // ── Product Info Section ──────────────────────────
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  productName: {
    fontSize: 22,
    fontFamily: undefined,
    color: "#2d3435",
    // letterSpacing: -0.3,
    textTransform: "uppercase",
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    flexShrink: 0,
  },
  priceGroup: {
    alignItems: "flex-end",
  },
  priceCurrent: {
    fontSize: 18,
    fontFamily: undefined,
    fontWeight: "300",
    color: "#2d3435",
  },
  priceOriginalStrike: {
    fontSize: 14,
    fontFamily: undefined,
    color: "#C41E3A",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#eeeeee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontFamily: undefined,
    // letterSpacing: 1,
    color: "#757c7d",
  },
  skuText: {
    fontSize: 10,
    fontFamily: undefined,
    // letterSpacing: 4,
    color: "#757c7d",
    textTransform: "uppercase",
    marginTop: 8,
  },
  brandLink: {
    marginTop: 6,
  },
  brandName: {
    fontSize: 10,
    fontFamily: undefined,
    // letterSpacing: 3,
    color: "#757c7d",
    textTransform: "uppercase",
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#757c7d",
    textTransform: "uppercase",
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#2d3435",
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#757c7d",
    marginLeft: 2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: "#2d3435",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  badgeLowStock: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#C41E3A",
  },
  badgeLowStockText: {
    color: "#C41E3A",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: "rgba(172,179,180,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: "#757c7d",
  },

  // ── Configuration Section ────────────────────────
  configSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  colorSection: {
    gap: 12,
  },
  colorLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  configLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    // letterSpacing: 4,
    color: "#757c7d",
    textTransform: "uppercase",
  },
  configValue: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    // letterSpacing: 4,
    color: "#2d3435",
    textTransform: "uppercase",
  },
  swatchRow: {
    flexDirection: "row",
    gap: 10,
  },
  swatchOuter: {
    width: 32,
    height: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchOuterSelected: {
    borderColor: "#2d3435",
  },
  swatch: {
    flex: 1,
  },

  // ── Size Selector ───────────────────────────────
  sizeSection: {
    gap: 12,
  },
  sizeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeGuideLink: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    // letterSpacing: 4,
    color: "#3152d3",
    textTransform: "uppercase",
  },
  sizeRow: {
    flexDirection: "row",
    gap: 16,
  },
  sizeBox: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeBoxSelected: {
    borderWidth: 1,
    borderColor: "#2d3435",
  },
  sizeBoxText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#757c7d",
  },
  sizeBoxTextSelected: {
    color: "#2d3435",
    fontFamily: "Inter_700Bold",
  },
  sizeBoxTextOos: {
    color: "rgba(172,179,180,0.3)",
    fontStyle: "italic",
  },

  // ── Accordion Sections ──────────────────────────
  accordionContainer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(172,179,180,0.2)",
  },
  accordionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(172,179,180,0.2)",
  },
  accordionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    // letterSpacing: 2,
    color: "#2d3435",
    textTransform: "uppercase",
  },
  accordionContent: {
    backgroundColor: "#f2f4f4",
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(172,179,180,0.2)",
  },
  accordionBodyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    color: "#596061",
  },
  metaBlock: {
    marginTop: 16,
    gap: 6,
  },
  metaLine: {
    fontSize: 11,
    fontFamily: undefined,
    color: "#596061",
    // letterSpacing: 0.5,
  },

  // ── Marquee ───────────────────────────────────────
  marqueeContainer: {
    backgroundColor: "#000",
    paddingVertical: 12,
    marginTop: 40,
    overflow: "hidden",
  },
  marqueeTrack: {
    flexDirection: "row",
  },
  marqueeText: {
    fontSize: 10,
    fontFamily: undefined,
    color: "#fff",
    // letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Admin Controls ────────────────────────────────
  adminSection: {
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 8,
  },
  adminLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    // letterSpacing: 2,
    color: "#757c7d",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  adminRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  adminEditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#2d3435",
    gap: 8,
  },
  adminDeleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#C41E3A",
    gap: 8,
  },
  adminBtnLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 1.5,
    color: "#2d3435",
    textTransform: "uppercase",
  },
  adminDeleteLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 1.5,
    color: "#C41E3A",
    textTransform: "uppercase",
  },

  // ── Sticky Bottom Bar ──────────────────────────────
  bottomBar: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  bottomBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  addToBagBtn: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  addToBagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 2,
    color: "#fff",
    textTransform: "uppercase",
  },
  buyNowBtn: {
    flex: 1,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  buyNowText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    // letterSpacing: 2,
    color: "#000000",
    textTransform: "uppercase",
  },
});

export default ProductDetailScreen;
