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
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ProductDetailScreen = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const userRole = user?.role || user?.userRole;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor({ light: "#FAFAFA", dark: "#0A0A0A" }, "background");
  const primaryColor = useThemeColor({ light: "#1A1A1A", dark: "#FFFFFF" }, "text");
  const secondaryTextColor = useThemeColor({ light: "#737373", dark: "#A3A3A3" }, "text");
  const accentColor = useThemeColor({ light: "#DC2626", dark: "#EF4444" }, "tint");

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId || isNaN(Number(productId))) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiUrl()}/products/${productId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch product details");
        }
        const data = await response.json();
        setProduct(data);

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    setSelectedVariantIndex(0);
    setSelectedImageIndex(0);
  }, [productId, token]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: backgroundColor === '#000000' ? '#000' : '#FFF' }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ color: textColor, marginTop: 20, fontSize: 11, letterSpacing: 2, fontWeight: "500" }}>
          LOADING
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={56} color={accentColor} />
        <Text style={{ color: textColor, fontSize: 18, fontWeight: "300", marginTop: 24, letterSpacing: 1 }}>
          Product Not Found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonSimple}>
          <Text style={{ color: primaryColor, fontWeight: "500", fontSize: 13, letterSpacing: 1 }}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex];
  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const isOwnerOrAdmin = userRole === "admin" || (user?.id && product?.brand?.owner?.id && user.id === product.brand.owner.id);

  const headerOpacity = scrollY.interpolate({
    inputRange: [200, 300],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const imageParallax = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [100, 0],
    extrapolate: "clamp",
  });

  const titleTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 700],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const handleDelete = async () => {
    Alert.alert(
      "Delete Product",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${getApiUrl()}/products/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) throw new Error("Failed to delete product");
              Alert.alert("Success", "Product removed.");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const renderMinimalHeader = () => (
    <Animated.View style={[styles.minimalHeader, { opacity: headerOpacity }]}>
      <BlurView intensity={100} tint={Platform.OS === 'ios' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
      <View style={styles.minimalHeaderContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.minimalHeaderTitle, { color: textColor }]} numberOfLines={1}>
          {product.name}
        </Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="share-outline" size={20} color={textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderFloatingControls = () => (
    <View style={styles.floatingControls}>
      <TouchableOpacity onPress={() => router.back()} style={styles.floatingBtn}>
        <View style={[styles.floatingBtnInner, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
          <Ionicons name="arrow-back" size={18} color="#000" />
        </View>
      </TouchableOpacity>
      <View style={styles.floatingRightGroup}>
        <TouchableOpacity style={styles.floatingBtn}>
          <View style={[styles.floatingBtnInner, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Ionicons name="heart-outline" size={18} color="#000" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingBtn}>
          <View style={[styles.floatingBtnInner, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Ionicons name="share-outline" size={18} color="#000" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.galleryWrapper}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
        }}
      >
        {currentVariant?.variantImages.map((uri, index) => (
          <Animated.View
            key={index}
            style={[
              styles.imageContainer,
              { transform: [{ translateY: imageParallax }] }
            ]}
          >
            <Image
              source={{ uri }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.15)"]}
              style={styles.imageGradient}
            />
          </Animated.View>
        ))}
      </Animated.ScrollView>

      {/* Image Counter */}
      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {selectedImageIndex + 1} / {currentVariant?.variantImages.length}
        </Text>
      </View>

      {/* Minimal Pagination */}
      <View style={styles.minimalPagination}>
        {currentVariant?.variantImages.map((_, i) => (
          <View
            key={i}
            style={[
              styles.paginationLine,
              selectedImageIndex === i && styles.paginationLineActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {renderMinimalHeader()}
      {renderFloatingControls()}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderGallery()}

        <Animated.View
          style={[
            styles.contentWrapper,
            {
              backgroundColor,
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Editorial Header */}
          <Animated.View
            style={[
              styles.editorialHeader,
              {
                transform: [{ translateY: titleTranslate }],
                opacity: titleOpacity,
              }
            ]}
          >
            {/* Brand Badge */}
            <TouchableOpacity
              onPress={() => router.push(`/brands/${product.brand.id}`)}
              style={styles.brandLink}
            >
              <Text style={[styles.brandName, { color: secondaryTextColor }]}>
                {product.brand.name.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Product Title */}
            <Text style={[styles.productTitle, { color: textColor }]}>
              {product.name}
            </Text>

            {/* Status Badge */}
            <View style={styles.statusRow}>
              <View style={[
                styles.statusPill,
                {
                  backgroundColor: product.status === 'published' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(163, 163, 163, 0.1)'
                }
              ]}>
                <Text style={[
                  styles.statusLabel,
                  { color: product.status === 'published' ? '#22C55E' : '#A3A3A3' }
                ]}>
                  {(product.status || "draft").toUpperCase()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceGroup}>
              {hasDiscount && (
                <Text style={[styles.originalPrice, { color: secondaryTextColor }]}>
                  ${product.price.toFixed(2)}
                </Text>
              )}
              <Text style={[styles.currentPrice, { color: hasDiscount ? accentColor : textColor }]}>
                ${(hasDiscount ? product.salePrice : product.price)?.toFixed(2)}
              </Text>
            </View>
            {hasDiscount && (
              <View style={[styles.savingsBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.savingsText}>
                  SAVE {Math.round(((product.price - product.salePrice!) / product.price) * 100)}%
                </Text>
              </View>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <View style={[
              styles.stockIndicator,
              { backgroundColor: product.stock > 0 ? '#22C55E' : accentColor }
            ]} />
            <Text style={[styles.stockText, { color: secondaryTextColor }]}>
              {product.stock > 0
                ? `${product.stock} AVAILABLE`
                : "OUT OF STOCK"
              }
            </Text>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: textColor, opacity: 0.08 }]} />

          {/* Color Variants */}
          <View style={styles.variantSection}>
            <View style={styles.variantHeader}>
              <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>
                COLOR
              </Text>
              <Text style={[styles.selectedVariant, { color: textColor }]}>
                {currentVariant?.color}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorList}
            >
              {product.variants.map((v, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSelectedVariantIndex(i);
                    setSelectedImageIndex(0);
                  }}
                  style={styles.colorOption}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: v.color,
                        borderColor: selectedVariantIndex === i ? textColor : 'transparent',
                      },
                    ]}
                  />
                  {selectedVariantIndex === i && (
                    <View style={styles.selectedRing} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: textColor, opacity: 0.08 }]} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionLabel, { color: secondaryTextColor, marginBottom: 16 }]}>
              DESCRIPTION
            </Text>
            <Text style={[styles.descriptionText, { color: textColor }]}>
              {product.description}
            </Text>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: textColor, opacity: 0.08 }]} />

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionLabel, { color: secondaryTextColor, marginBottom: 20 }]}>
              DETAILS
            </Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: secondaryTextColor }]}>Type</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.productType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: secondaryTextColor }]}>Material</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.material || "Premium Cotton"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: secondaryTextColor }]}>Origin</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.origin || "Locally Made"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: secondaryTextColor }]}>Season</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.season}
                </Text>
              </View>
            </View>
          </View>

          {/* Admin Actions */}
          {isOwnerOrAdmin && (
            <>
              <View style={[styles.dividerLine, { backgroundColor: textColor, opacity: 0.08 }]} />
              <View style={styles.adminSection}>
                <Text style={[styles.sectionLabel, { color: secondaryTextColor, marginBottom: 16 }]}>
                  ADMIN CONTROLS
                </Text>
                <View style={styles.adminButtons}>
                  <TouchableOpacity
                    onPress={() => router.push(`/products/edit/${productId}`)}
                    style={[styles.adminBtn, { borderColor: textColor, opacity: 0.8 }]}
                  >
                    <Ionicons name="create-outline" size={16} color={textColor} />
                    <Text style={[styles.adminBtnText, { color: textColor }]}>EDIT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[styles.adminBtn, { borderColor: accentColor }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={accentColor} />
                    <Text style={[styles.adminBtnText, { color: accentColor }]}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 140 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomActionBar, { backgroundColor }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity style={[styles.iconOnlyBtn, { borderColor: textColor, opacity: 0.2 }]}>
            <Ionicons name="heart-outline" size={22} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: textColor }]}
          >
            <Text style={[styles.primaryActionText, { color: backgroundColor }]}>
              ADD TO COLLECTION
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Minimal Header
  minimalHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 100,
    paddingTop: StatusBar.currentHeight || 44,
  },
  minimalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 46,
  },
  minimalHeaderTitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1.5,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
    textTransform: 'uppercase',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Floating Controls
  floatingControls: {
    position: "absolute",
    top: (StatusBar.currentHeight || 44) + 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 90,
  },
  floatingBtn: {
    width: 36,
    height: 36,
  },
  floatingBtnInner: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floatingRightGroup: {
    flexDirection: "row",
    gap: 10,
  },

  // Gallery
  galleryWrapper: {
    height: screenHeight * 0.65,
    backgroundColor: "#F5F5F5",
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight * 0.65,
  },
  productImage: {
    width: screenWidth,
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageCounter: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCounterText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  minimalPagination: {
    position: "absolute",
    bottom: 24,
    left: 24,
    flexDirection: "row",
    gap: 6,
  },
  paginationLine: {
    width: 20,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
  },
  paginationLineActive: {
    backgroundColor: "#FFF",
    width: 32,
  },

  // Content
  contentWrapper: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },

  editorialHeader: {
    marginBottom: 28,
  },
  brandLink: {
    marginBottom: 8,
  },
  brandName: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
  productTitle: {
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  // Price
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priceGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: "400",
    textDecorationLine: "line-through",
    letterSpacing: 0.5,
  },
  currentPrice: {
    fontSize: 30,
    fontWeight: "300",
    letterSpacing: -0.5,
  },
  savingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  savingsText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Stock
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  stockIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  stockText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.2,
  },

  dividerLine: {
    height: 1,
    marginVertical: 32,
  },

  // Variants
  variantSection: {
    marginBottom: 8,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  selectedVariant: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  colorList: {
    gap: 16,
    paddingVertical: 4,
  },
  colorOption: {
    position: "relative",
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  selectedRing: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },

  // Description
  descriptionSection: {
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0.2,
  },

  // Details
  detailsSection: {
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  detailKey: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  // Admin
  adminSection: {
    marginTop: 8,
  },
  adminButtons: {
    flexDirection: "row",
    gap: 12,
  },
  adminBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 2,
    borderWidth: 1,
    gap: 8,
  },
  adminBtnText: {
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 1.5,
  },

  // Bottom Bar
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  bottomBarInner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconOnlyBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAction: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  backButtonSimple: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});

export default ProductDetailScreen;
