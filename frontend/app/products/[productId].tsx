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

  const marqueeAnim = useRef(new Animated.Value(0)).current;
  const marqueeWidth = useRef(0);

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
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingLabel}>LOADING</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack={true} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#C41E3A" />
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>GO BACK</Text>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
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
        <View style={styles.addedOverlay}>
          <View style={styles.addedCard}>
            <View style={styles.addedCheckBox}>
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

      <Header showBack={true} />

      {/* Main scroll + sticky bottom bar in a flex column */}
      <View style={{ flex: 1, flexDirection: "column" }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="image-outline" size={48} color="#aaa" />
              </View>
            )}
          </View>

          {/* Thumbnail Row */}
          {displayImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {displayImages.slice(0, 4).map((uri: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedImage(i)}
                  style={[
                    styles.thumbnail,
                    selectedImage === i && styles.thumbnailSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Product Info */}
          <View style={styles.infoSection}>
            {/* Brand name */}
            <TouchableOpacity
              onPress={() =>
                product.brand?.id && router.push(`/brands/${product.brand.id}`)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.brandName}>
                {product.brand?.name?.toUpperCase() || ""}
              </Text>
            </TouchableOpacity>

            {/* Product name */}
            <Text style={styles.productName}>{product.name}</Text>

            {/* Status badge if not published */}
            {product.status !== "published" && (
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>
                  {(product.status || "draft").toUpperCase()}
                </Text>
              </View>
            )}

            {/* Price row */}
            <View style={styles.priceRow}>
              {hasDiscount ? (
                <>
                  <Text style={styles.priceCurrentSale}>
                    ${price?.toFixed(2)}
                  </Text>
                  <Text style={styles.priceOriginalStrike}>
                    ${product.price.toFixed(2)}
                  </Text>
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleBadgeText}>SALE</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.priceCurrent}>${price?.toFixed(2)}</Text>
              )}
            </View>

            {/* Wishlist toggle inline */}
            <TouchableOpacity
              style={styles.wishlistRow}
              onPress={toggleWishlist}
              disabled={wishlistLoading}
              activeOpacity={0.7}
            >
              {wishlistLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Ionicons
                    name={isInWishlist ? "heart" : "heart-outline"}
                    size={18}
                    color="#000"
                  />
                  <Text style={styles.wishlistLabel}>
                    {isInWishlist ? "SAVED" : "SAVE TO WISHLIST"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 32px spacer */}
          <View style={{ height: 32 }} />

          {/* Color Swatches */}
          {variantColors.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>SELECT COLOR</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.swatchRow}
              >
                {variantColors.map((color: string, i: number) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.swatchOuter,
                        isSelected && styles.swatchOuterSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[styles.swatch, { backgroundColor: color }]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Product-level single color */}
          {!variantColors.length && product.color && (
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>COLOR</Text>
              <View style={styles.swatchRow}>
                <View style={styles.swatchOuterSelected}>
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: product.color },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Size Selector */}
          {hasVariants && availableSizes.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>SELECT SIZE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sizeRow}
              >
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
                        isActive && styles.sizeBoxSelected,
                        !sizeInStock && styles.sizeBoxOos,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sizeBoxText,
                          isActive && styles.sizeBoxTextSelected,
                          !sizeInStock && styles.sizeBoxTextOos,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* The Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>THE DETAILS</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>

            {(product.material || product.productType || product.season) && (
              <View style={{ marginTop: 16 }}>
                {product.material && (
                  <Text style={styles.metaLine}>
                    — MATERIAL: {product.material.toUpperCase()}
                  </Text>
                )}
                {product.productType && (
                  <Text style={styles.metaLine}>
                    — TYPE: {product.productType.toUpperCase()}
                  </Text>
                )}
                {product.season && (
                  <Text style={styles.metaLine}>
                    — SEASON: {product.season.toUpperCase()}
                  </Text>
                )}
                {product.origin && (
                  <Text style={styles.metaLine}>
                    — ORIGIN: {product.origin.toUpperCase()}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Reviews */}
          <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
            <ProductReviews productId={product.id} />
          </View>

          {/* Marquee strip */}
          <View style={styles.marqueeContainer}>
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
              <Text style={styles.marqueeText}>
                {MARQUEE_TEXT.repeat(6)}
              </Text>
            </Animated.View>
          </View>

          {/* Admin Controls */}
          {isOwnerOrAdmin && (
            <View style={styles.adminSection}>
              <Text style={styles.selectorLabel}>MANAGE</Text>
              <View style={styles.adminRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/products/edit/${productId}`)}
                  style={styles.adminEditBtn}
                >
                  <Ionicons name="create-outline" size={16} color="#000" />
                  <Text style={styles.adminBtnLabel}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.adminDeleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color="#C41E3A" />
                  <Text style={styles.adminDeleteLabel}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + 12 },
          ]}
        >
          {allOutOfStock ? (
            <TouchableOpacity
              style={[
                styles.addToCollectionBtn,
                { backgroundColor: isSubscribedNotify ? "#444" : "#000" },
              ]}
              onPress={handleNotifyMe}
              disabled={notifyMeLoading || isSubscribedNotify}
              activeOpacity={0.85}
            >
              {notifyMeLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addToCollectionText}>
                  {isSubscribedNotify ? "SUBSCRIBED" : "NOTIFY ME"}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.addToCollectionBtn,
                { backgroundColor: inStock ? "#000" : "#888" },
              ]}
              onPress={addToCart}
              disabled={cartLoading || !inStock}
              activeOpacity={0.85}
            >
              {cartLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addToCollectionText}>
                  ADD TO COLLECTION
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 8 }} />

          <TouchableOpacity
            style={styles.tryOnBtn}
            onPress={() => setShowTryOn(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.tryOnBtnText}>TRY ON (AI VISUALIZER)</Text>
          </TouchableOpacity>
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
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 3,
    color: "#666",
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: 20,
    color: "#000",
  },
  goBackBtn: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: "#000",
  },
  goBackText: {
    fontSize: 12,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
    color: "#000",
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
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2.5,
    color: "#000",
    marginBottom: 6,
  },
  addedSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#666",
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
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
  },
  addedContinue: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  addedContinueText: {
    color: "#000",
    fontSize: 11,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1.5,
  },

  // ── Hero Image ────────────────────────────────────
  heroContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#eeeeee",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eeeeee",
  },

  // ── Thumbnail Row ─────────────────────────────────
  thumbnailRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  thumbnail: {
    width: 60,
    height: 72,
    backgroundColor: "#eeeeee",
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: "#000",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  // ── Product Info Section ──────────────────────────
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  brandName: {
    fontSize: 11,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 3,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  productName: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#000000",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 16,
  },
  statusChip: {
    alignSelf: "flex-start",
    backgroundColor: "#eeeeee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  statusChipText: {
    fontSize: 10,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1,
    color: "#666",
  },

  // ── Price ─────────────────────────────────────────
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  priceCurrent: {
    fontSize: 18,
    fontFamily: "SpaceMono_400Regular",
    color: "#000000",
  },
  priceCurrentSale: {
    fontSize: 18,
    fontFamily: "SpaceMono_400Regular",
    color: "#000000",
  },
  priceOriginalStrike: {
    fontSize: 16,
    fontFamily: "SpaceMono_400Regular",
    color: "#7d001d",
    textDecorationLine: "line-through",
  },
  saleBadge: {
    backgroundColor: "#C41E3A",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1.5,
  },

  // ── Wishlist ──────────────────────────────────────
  wishlistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wishlistLabel: {
    fontSize: 11,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1.5,
    color: "#000",
  },

  // ── Color / Size selectors ─────────────────────────
  selectorSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 10,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 12,
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
    width: 32,
    height: 32,
    padding: 3,
    borderWidth: 2,
    borderColor: "#000",
  },
  swatch: {
    flex: 1,
  },
  sizeRow: {
    flexDirection: "row",
    gap: 8,
  },
  sizeBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
  },
  sizeBoxSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  sizeBoxOos: {
    opacity: 0.35,
  },
  sizeBoxText: {
    fontSize: 13,
    fontFamily: "SpaceMono_400Regular",
    color: "#000",
  },
  sizeBoxTextSelected: {
    color: "#fff",
  },
  sizeBoxTextOos: {
    color: "#999",
  },

  // ── The Details ───────────────────────────────────
  detailsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  detailsLabel: {
    fontSize: 11,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
    color: "#000",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    color: "#474747",
  },
  metaLine: {
    fontSize: 11,
    fontFamily: "SpaceMono_400Regular",
    color: "#666",
    letterSpacing: 0.5,
    marginBottom: 6,
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
    fontFamily: "SpaceMono_400Regular",
    color: "#fff",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── Admin Controls ────────────────────────────────
  adminSection: {
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 8,
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
    borderWidth: 2,
    borderColor: "#000",
    gap: 8,
  },
  adminDeleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#C41E3A",
    gap: 8,
  },
  adminBtnLabel: {
    fontSize: 12,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1.5,
    color: "#000",
  },
  adminDeleteLabel: {
    fontSize: 12,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 1.5,
    color: "#C41E3A",
  },

  // ── Bottom CTA Bar ────────────────────────────────
  bottomBar: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addToCollectionBtn: {
    width: "100%",
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  addToCollectionText: {
    fontSize: 13,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
    color: "#fff",
    textTransform: "uppercase",
  },
  tryOnBtn: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "transparent",
  },
  tryOnBtnText: {
    fontSize: 12,
    fontFamily: "SpaceMono_400Regular",
    letterSpacing: 2,
    color: "#000",
    textTransform: "uppercase",
  },
});

export default ProductDetailScreen;
