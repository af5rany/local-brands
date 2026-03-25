import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  rating?: number;
  originalPrice?: number;
};

type RecommendationCardProps = {
  product: Product;
  onPress: () => void;
  onAddToWishlist: () => void;
  onAddToCart?: () => Promise<void>;
  isInWishlist?: boolean;
  style?: any;
};

const RecommendationCard = ({
  product,
  onPress,
  onAddToWishlist,
  onAddToCart,
  isInWishlist = false,
  style,
}: RecommendationCardProps) => {
  const colors = useThemeColors();
  const [imageError, setImageError] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const handleWishlistPress = async () => {
    setWishlistLoading(true);
    try {
      await onAddToWishlist();
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCartPress = async () => {
    if (!onAddToCart) return;
    setCartLoading(true);
    try {
      await onAddToCart();
    } finally {
      setCartLoading(false);
    }
  };

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100,
      )
    : 0;

  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
          shadowColor: colors.cardShadow,
        },
        isTablet && styles.tabletCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: colors.surfaceRaised },
          isTablet && styles.tabletImageContainer,
        ]}
      >
        {!imageError && product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholderImage,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={36}
              color={colors.textTertiary}
            />
          </View>
        )}

        {/* Wishlist Heart */}
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            {
              backgroundColor: isInWishlist
                ? colors.dangerSoft
                : colors.surface,
            },
          ]}
          onPress={handleWishlistPress}
          disabled={wishlistLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isInWishlist ? "heart" : "heart-outline"}
            size={16}
            color={colors.wishlistHeart}
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {hasDiscount && (
          <View
            style={[
              styles.discountBadge,
              { backgroundColor: colors.discountBadge },
            ]}
          >
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.brandName, { color: colors.textTertiary }]}
          numberOfLines={1}
        >
          {product.brand}
        </Text>

        <Text
          style={[styles.productName, { color: colors.text }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Rating */}
        {product.rating != null && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.accent} />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {product.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.currentPrice, { color: colors.priceCurrent }]}>
            {formatCurrency(product.price)}
          </Text>
          {hasDiscount && (
            <Text
              style={[styles.originalPrice, { color: colors.priceOriginal }]}
            >
              {formatCurrency(product.originalPrice!)}
            </Text>
          )}
        </View>

        {/* Add to Cart */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            { backgroundColor: colors.primary },
            cartLoading && { opacity: 0.7 },
          ]}
          activeOpacity={0.8}
          disabled={cartLoading}
          onPress={handleCartPress}
        >
          <Ionicons
            name={cartLoading ? "hourglass-outline" : "bag-add-outline"}
            size={15}
            color={colors.primaryForeground}
          />
          <Text
            style={[styles.addToCartText, { color: colors.primaryForeground }]}
          >
            {cartLoading ? "Adding…" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    width: 180,
    borderWidth: 1,
    overflow: "hidden",
  },
  tabletCard: {
    width: 240,
  },
  imageContainer: {
    position: "relative",
    height: 150,
  },
  tabletImageContainer: {
    height: 190,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistButton: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 14,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  content: {
    padding: 12,
    gap: 4,
  },
  brandName: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 0,
    marginTop: 8,
    gap: 5,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default RecommendationCard;
