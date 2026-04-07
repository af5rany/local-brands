import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useThemeColor, useThemeColors } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/product";
import { ProductStatus } from "@/types/enums";
import AutoSwipeImages from "@/components/AutoSwipeImages";

// Full width for the card
const { width } = Dimensions.get("window");

interface ProductCardProps {
  product: Product;
  mode?: "view" | "manage";
  onEdit?: (productId: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  mode = "view",
  onEdit,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const router = useRouter();
  const [isNotified, setIsNotified] = React.useState(false);

  // Press animation — subtle scale like App Store cards
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);
  const { token } = useAuth();
  const { showToast } = useToast();
  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const borderColor = useThemeColor(
    { light: "#f0f0f0", dark: "#2c2c2e" },
    "text",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text",
  );
  const accentColor = useThemeColor(
    { light: "#000000", dark: "#ffffff" },
    "text",
  );
  const imageBackgroundColor = useThemeColor(
    { light: "#f8f8f8", dark: "#2c2c2e" },
    "background",
  );
  const buttonColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "primary",
  );
  const colors = useThemeColors();

  const handlePress = () => {
    router.push(`/products/${product.id}`);
  };

  // Collect all images from product level
  const getAllProductImages = (): string[] => {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    if (product.mainImage) {
      return [product.mainImage];
    }
    return [];
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product.salePrice && product.salePrice < product.price) {
      return Math.round(
        ((product.price - product.salePrice) / product.price) * 100,
      );
    }
    return 0;
  };

  // Get display price
  const getDisplayPrice = () => {
    return product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;
  };

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercentage = getDiscountPercentage();
  const displayPrice = getDisplayPrice();
  const productImages = getAllProductImages();

  const styles = StyleSheet.create({
    cardContainer: {
      width: width - 32,
      backgroundColor: cardBackground,
      borderRadius: 0,
      padding: 0,
      marginBottom: 24,
      borderWidth: 0,
      borderColor: borderColor,
    },
    imageContainer: {
      width: "100%",
      height: width - 32,
      backgroundColor: imageBackgroundColor,
      borderRadius: 0,
      marginBottom: 12,
      overflow: "hidden",
      position: "relative",
    },
    typeTag: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: accentColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
    },
    typeText: {
      fontSize: 10,
      fontWeight: "600",
      color: cardBackground,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    discountBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: colors.discountBadge,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 0,
    },
    discountText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textInverse,
    },
    favoriteButton: {
      position: "absolute",
      bottom: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: cardBackground,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stockIndicator: {
      position: "absolute",
      bottom: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: product.stock > 0 ? colors.primary : colors.textTertiary,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    stockText: {
      fontSize: 9,
      fontWeight: "600",
      color: colors.primaryForeground,
      marginLeft: 3,
    },
    statusBadge: {
      position: "absolute",
      top: 12,
      right: onEdit ? 48 : 12, // Offset if edit button exists
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor:
        product.status === ProductStatus.PUBLISHED
          ? colors.primary
          : product.status === ProductStatus.DRAFT
            ? colors.textTertiary
            : colors.discountBadge,
    },
    productDetails: {
      flex: 1,
    },
    brandName: {
      fontSize: 12,
      fontWeight: "500",
      color: secondaryTextColor,
      marginBottom: 4,
    },
    productName: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
      marginBottom: 8,
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    productPrice: {
      fontSize: 18,
      fontWeight: "700",
      color: hasDiscount ? colors.priceCurrent : accentColor,
      marginRight: 8,
    },
    originalPrice: {
      fontSize: 14,
      fontWeight: "500",
      color: secondaryTextColor,
      textDecorationLine: "line-through",
    },
    productInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
    },
    infoText: {
      fontSize: 11,
      color: secondaryTextColor,
      marginLeft: 3,
    },
    colorPreview: {
      flexDirection: "row",
      marginBottom: 12,
    },
    colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 6,
      borderWidth: 1,
      borderColor: borderColor,
    },
    addToCartButton: {
      backgroundColor: accentColor,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 0,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    addToCartText: {
      color: cardBackground,
      fontSize: 13,
      fontWeight: "600",
      marginLeft: 6,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    notifyButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: accentColor,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 0,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    notifyButtonText: {
      color: accentColor,
      fontSize: 13,
      fontWeight: "600",
      marginLeft: 6,
      textTransform: "uppercase",
      letterSpacing: 1,
    },

    decorativeElements: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
    },
    circle1: {
      position: "absolute",
      top: 20,
      right: 30,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: secondaryTextColor,
      opacity: 0.3,
    },
    circle2: {
      position: "absolute",
      top: 40,
      right: 50,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: secondaryTextColor,
      opacity: 0.2,
    },
    wave: {
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 20,
      height: 2,
      backgroundColor: secondaryTextColor,
      opacity: 0.2,
      borderRadius: 1,
    },
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Product Image Carousel */}
        <View style={styles.imageContainer}>
          <AutoSwipeImages
            images={productImages}
            width={width - 32}
            height={width - 32}
            borderRadius={0}
          />

          {/* Product Type Tag */}
          {product.productType && (
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{product.productType}</Text>
            </View>
          )}

          {/* Discount Badge */}
          {hasDiscount && mode === "view" && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
            </View>
          )}

          {/* Stock Indicator */}
          <View style={styles.stockIndicator}>
            <Ionicons
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={10}
              color={colors.primaryForeground}
            />
            <Text style={styles.stockText}>
              {product.stock > 0 ? `${product.stock}` : "Out"}
            </Text>
          </View>

          {/* Favorite Button */}
          {mode === "view" && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                if (!token) {
                  router.push("/auth/login");
                  return;
                }
                onToggleWishlist?.(product.id);
              }}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={16}
                color={isWishlisted ? colors.wishlistHeart : textColor}
              />
            </TouchableOpacity>
          )}

          {/* Edit Button for Management */}
          {mode === "manage" && onEdit && (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                { top: 12, right: 12, bottom: undefined },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(product.id);
              }}
            >
              <Ionicons name="create-outline" size={16} color={buttonColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.productDetails}>
          {/* Brand Name */}
          <Text style={styles.brandName}>{product.brandName}</Text>

          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Price Container */}
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${displayPrice}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>${product.price}</Text>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            {product.gender && (
              <View style={styles.infoItem}>
                <Ionicons
                  name="person-outline"
                  size={12}
                  color={secondaryTextColor}
                />
                <Text style={styles.infoText}>{product.gender}</Text>
              </View>
            )}
            {product.season && (
              <View style={styles.infoItem}>
                <Ionicons
                  name="sunny-outline"
                  size={12}
                  color={secondaryTextColor}
                />
                <Text style={styles.infoText}>{product.season}</Text>
              </View>
            )}
            {product.isFeatured && (
              <View style={styles.infoItem}>
                <Ionicons name="star" size={12} color={colors.text} />
                <Text style={styles.infoText}>Featured</Text>
              </View>
            )}
          </View>

          {/* Color Preview */}
          {product.color && (
            <View style={styles.colorPreview}>
              <View
                style={[styles.colorDot, { backgroundColor: product.color }]}
              />
            </View>
          )}

          {/* Add to Cart / Notify Me */}
          {product.stock > 0 ? (
            <TouchableOpacity style={styles.addToCartButton}>
              <Ionicons name="bag-outline" size={16} color={cardBackground} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <View>
              {/* Status indicator — inform first, then offer action */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    flex: 1,
                    backgroundColor: borderColor,
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    color: colors.textTertiary,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    fontWeight: "600",
                    paddingHorizontal: 12,
                  }}
                >
                  Sold Out
                </Text>
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    flex: 1,
                    backgroundColor: borderColor,
                  }}
                />
              </View>

              {/* CTA — flush bottom, matching Add to Cart placement */}
              <TouchableOpacity
                style={[
                  styles.notifyButton,
                  isNotified && {
                    opacity: 0.5,
                    borderColor: colors.textTertiary,
                  },
                ]}
                disabled={isNotified}
                onPress={() => {
                  if (!token) {
                    router.push("/auth/login");
                    return;
                  }
                  setIsNotified(true);
                  showToast(
                    "You'll be notified when it's back in stock",
                    "success",
                  );
                }}
              >
                <Ionicons
                  name={
                    isNotified
                      ? "checkmark-circle-outline"
                      : "notifications-outline"
                  }
                  size={14}
                  color={isNotified ? colors.textTertiary : accentColor}
                />
                <Text
                  style={[
                    styles.notifyButtonText,
                    isNotified && { color: colors.textTertiary },
                  ]}
                >
                  {isNotified ? "Subscribed" : "Notify Me"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default ProductCard;
