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

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const primaryColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "primary",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#8E8E93", dark: "#8E8E93" },
    "text",
  );

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
          throw new Error(
            errorData.message || "Failed to fetch product details",
          );
        }
        const data = await response.json();
        setProduct(data);
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
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ color: textColor, marginTop: 10, fontWeight: "500" }}>
          Loading Collections...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text
          style={{
            color: textColor,
            fontSize: 20,
            fontWeight: "600",
            marginTop: 16,
          }}
        >
          Product Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonSimple}
        >
          <Text style={{ color: primaryColor, fontWeight: "600" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex];
  const hasDiscount =
    product.salePrice !== undefined && product.salePrice < product.price;
  const isOwnerOrAdmin =
    userRole === "admin" ||
    (user?.id &&
      product?.brand?.owner?.id &&
      user.id === product.brand.owner.id);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const bannerScale = scrollY.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [2, 1, 1],
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
              const response = await fetch(
                `${getApiUrl()}/products/${productId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (!response.ok) throw new Error("Failed to delete product");
              Alert.alert("Success", "Product removed.");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
      <BlurView
        intensity={80}
        tint={Platform.OS === "ios" ? "default" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: textColor }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={24} color={textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderFloatingBack = () => (
    <View style={styles.floatingHeader}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.floatingIconButton}
      >
        <BlurView intensity={60} tint="light" style={styles.blurIconBg}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </BlurView>
      </TouchableOpacity>
      <View style={styles.rightFloatingIcons}>
        <TouchableOpacity style={styles.floatingIconButton}>
          <BlurView intensity={60} tint="light" style={styles.blurIconBg}>
            <Ionicons name="heart-outline" size={24} color="#000" />
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGallery = () => (
    <View style={styles.galleryContainer}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: new Animated.Value(0) } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          setSelectedImageIndex(
            Math.round(e.nativeEvent.contentOffset.x / screenWidth),
          );
        }}
      >
        {currentVariant?.variantImages?.map((uri, index) => (
          <Animated.Image
            key={index}
            source={{ uri }}
            style={[
              styles.galleryImage,
              { transform: [{ scale: bannerScale }] },
            ]}
          />
        ))}
      </Animated.ScrollView>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)"]}
        style={styles.galleryGradient}
      />
      <View style={styles.pagination}>
        {currentVariant?.variantImages?.map((_, i) => (
          <View
            key={i}
            style={[
              styles.paginationDot,
              selectedImageIndex === i && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      {renderFloatingBack()}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {renderGallery()}

        <View style={[styles.contentSection, { backgroundColor }]}>
          {/* Brand Line */}
          <View style={styles.brandRow}>
            <TouchableOpacity
              onPress={() => router.push(`/brands/${product.brand.id}`)}
              style={styles.brandBadge}
            >
              {product.brand.logo && (
                <Image
                  source={{ uri: product.brand.logo }}
                  style={styles.smallBrandLogo}
                />
              )}
              <Text style={styles.brandText}>{product.brand.name}</Text>
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {(product.status || "draft").toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: textColor }]}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text
                style={[
                  styles.mainPrice,
                  { color: hasDiscount ? "#FF3B30" : textColor },
                ]}
              >
                ${hasDiscount ? product.salePrice : product.price}
              </Text>
              {hasDiscount && (
                <Text style={styles.oldPrice}>${product.price}</Text>
              )}
            </View>
            {hasDiscount && (
              <View style={styles.discountTag}>
                <Text style={styles.discountText}>
                  -
                  {Math.round(
                    ((product.price - product.salePrice!) / product.price) *
                      100,
                  )}
                  %
                </Text>
              </View>
            )}
          </View>

          <View style={styles.stockInfo}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: product.stock > 0 ? "#4CD964" : "#FF3B30" },
              ]}
            />
            <Text style={[styles.stockValue, { color: secondaryTextColor }]}>
              {product.stock > 0
                ? `${product.stock} units available`
                : "Out of Stock"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Variants */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Select Color
            </Text>
            <Text style={styles.variantName}>{currentVariant?.color}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.variantScroll}
          >
            {product.variants.map((v, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setSelectedVariantIndex(i);
                  setSelectedImageIndex(0);
                }}
                style={[
                  styles.colorCircle,
                  { backgroundColor: v.color },
                  selectedVariantIndex === i && styles.selectedCircle,
                ]}
              >
                {selectedVariantIndex === i && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={v.color === "#FFFFFF" ? "#000" : "#FFF"}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* Description */}
          <Text
            style={[
              styles.sectionTitle,
              { color: textColor, marginBottom: 10 },
            ]}
          >
            Description
          </Text>
          <Text style={[styles.description, { color: secondaryTextColor }]}>
            {product.description}
          </Text>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={primaryColor}
              />
              <View>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.productType}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="shirt-outline" size={20} color={primaryColor} />
              <View>
                <Text style={styles.detailLabel}>Material</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.material || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="earth-outline" size={20} color={primaryColor} />
              <View>
                <Text style={styles.detailLabel}>Origin</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.origin || "Local"}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="sunny-outline" size={20} color={primaryColor} />
              <View>
                <Text style={styles.detailLabel}>Season</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {product.season}
                </Text>
              </View>
            </View>
          </View>

          {isOwnerOrAdmin && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                onPress={() => router.push(`/products/edit/${productId}`)}
                style={[styles.adminButton, { borderColor: primaryColor }]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={primaryColor}
                />
                <Text style={[styles.adminButtonText, { color: primaryColor }]}>
                  Edit Product
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.adminButton, { borderColor: "#FF3B30" }]}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.adminButtonText, { color: "#FF3B30" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <BlurView
        intensity={90}
        tint={Platform.OS === "ios" ? "light" : "dark"}
        style={styles.bottomBar}
      >
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.wishlistButton}>
            <Ionicons name="heart-outline" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addToCartButton, { backgroundColor: primaryColor }]}
          >
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.addToCartText}>Add to Collection</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 100,
    paddingTop: StatusBar.currentHeight || 44,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingHeader: {
    position: "absolute",
    top: StatusBar.currentHeight || 44,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 90,
  },
  floatingIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  blurIconBg: { flex: 1, alignItems: "center", justifyContent: "center" },
  rightFloatingIcons: { flexDirection: "row", gap: 12 },

  // Gallery
  galleryContainer: { height: screenWidth * 1.25, backgroundColor: "#EFEFF4" },
  galleryImage: {
    width: screenWidth,
    height: screenWidth * 1.25,
    resizeMode: "cover",
  },
  galleryGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignSelf: "center",
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  paginationDotActive: { backgroundColor: "#FFF", width: 12 },

  // Content
  contentSection: {
    paddingTop: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    padding: 6,
    paddingRight: 12,
    borderRadius: 20,
  },
  smallBrandLogo: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  brandText: { fontSize: 13, fontWeight: "600", color: "#666" },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, fontWeight: "800", color: "#2E7D32" },

  title: { fontSize: 26, fontWeight: "700", marginBottom: 16, lineHeight: 32 },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 12,
  },
  priceCol: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  mainPrice: { fontSize: 28, fontWeight: "800" },
  oldPrice: {
    fontSize: 18,
    color: "#8E8E93",
    textDecorationLine: "line-through",
  },
  discountTag: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  stockInfo: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stockValue: { fontSize: 14, fontWeight: "500" },

  divider: { height: 1, backgroundColor: "#E5E5EA", marginVertical: 20 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  variantName: { fontSize: 15, color: "#8E8E93", fontWeight: "500" },

  variantScroll: { flexDirection: "row", marginBottom: 10 },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: { borderWidth: 3, borderColor: "#007AFF" },

  description: { fontSize: 16, lineHeight: 24 },

  // Details Grid
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  detailItem: {
    width: (screenWidth - 56) / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 16,
  },
  detailLabel: { fontSize: 12, color: "#8E8E93", marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "600" },

  // Admin Actions
  adminActions: { flexDirection: "row", gap: 12, marginTop: 32 },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  adminButtonText: { fontWeight: "600", fontSize: 15 },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 34,
    paddingTop: 16,
  },
  bottomBarContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 16,
    alignItems: "center",
  },
  wishlistButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  addToCartText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  backButtonSimple: { marginTop: 24, padding: 12 },
});

export default ProductDetailScreen;
