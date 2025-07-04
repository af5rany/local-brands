import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/product";

// Full width for the card
const { width } = Dimensions.get("window");

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  // console.log("ProductCard rendered with product:", JSON.stringify(product));
  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#f0f0f0", dark: "#2c2c2e" },
    "text"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text"
  );
  const accentColor = useThemeColor(
    { light: "#000000", dark: "#ffffff" },
    "text"
  );
  const imageBackgroundColor = useThemeColor(
    { light: "#f8f8f8", dark: "#2c2c2e" },
    "background"
  );

  const handlePress = () => {
    router.push(`/products/${product.id}`);
  };

  // Get the first variant's first image or fallback
  const getProductImage = () => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.variantImages && firstVariant.variantImages.length > 0) {
        return firstVariant.variantImages[0];
      }
    }
    return null;
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product.salePrice && product.salePrice < product.price) {
      return Math.round(
        ((product.price - product.salePrice) / product.price) * 100
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
  const productImage = getProductImage();

  const styles = StyleSheet.create({
    cardContainer: {
      width: width - 32, // Full width minus margins
      backgroundColor: cardBackground,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: borderColor,
    },
    imageContainer: {
      width: "100%",
      height: width - 32 - 32, // Maintain aspect ratio
      backgroundColor: imageBackgroundColor,
      borderRadius: 16,
      marginBottom: 16,
      overflow: "hidden",
      position: "relative",
    },
    productImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    placeholderContainer: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: imageBackgroundColor,
    },
    typeTag: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: accentColor,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    typeText: {
      fontSize: 10,
      fontWeight: "600",
      color: cardBackground,
      textTransform: "uppercase",
    },
    discountBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "#ff4444",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    discountText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#ffffff",
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
      backgroundColor: product.totalStock > 0 ? "#28a745" : "#dc3545",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },
    stockText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#ffffff",
      marginLeft: 3,
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
      color: hasDiscount ? "#28a745" : accentColor,
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      opacity: product.totalStock > 0 ? 1 : 0.5,
    },
    addToCartText: {
      color: cardBackground,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
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
    <TouchableOpacity onPress={handlePress} style={styles.cardContainer}>
      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.wave} />
      </View>

      {/* Product Image */}
      <View style={styles.imageContainer}>
        {productImage ? (
          <Image source={{ uri: productImage }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="image-outline"
              size={40}
              color={secondaryTextColor}
            />
          </View>
        )}

        {/* Product Type Tag */}
        {product.productType && (
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{product.productType}</Text>
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Stock Indicator */}
        <View style={styles.stockIndicator}>
          <Ionicons
            name={product.totalStock > 0 ? "checkmark-circle" : "close-circle"}
            size={10}
            color="#ffffff"
          />
          <Text style={styles.stockText}>
            {product.totalStock > 0 ? `${product.totalStock}` : "Out"}
          </Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={16} color={textColor} />
        </TouchableOpacity>
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
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.infoText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Color Preview */}
        {product.variants && product.variants.length > 0 && (
          <View style={styles.colorPreview}>
            {product.variants.slice(0, 4).map((variant, index) => (
              <View
                key={index}
                style={[
                  styles.colorDot,
                  { backgroundColor: variant.colorHex || variant.color },
                ]}
              />
            ))}
            {product.variants.length > 4 && (
              <Text style={styles.infoText}>
                +{product.variants.length - 4}
              </Text>
            )}
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={styles.addToCartButton}
          disabled={product.totalStock === 0}
        >
          <Ionicons name="bag-outline" size={16} color={cardBackground} />
          <Text style={styles.addToCartText}>
            {product.totalStock > 0 ? "Add to Cart" : "Out of Stock"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
