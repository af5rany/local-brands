import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  isInWishlist?: boolean;
};

const RecommendationCard = ({
  product,
  onPress,
  onAddToWishlist,
  isInWishlist = false,
}: RecommendationCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleWishlistPress = async () => {
    setWishlistLoading(true);
    try {
      await onAddToWishlist();
    } finally {
      setWishlistLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={12} color="#f59e0b" />);
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color="#f59e0b" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={12}
          color="#d1d5db"
        />
      );
    }

    return stars;
  };

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
      ((product.originalPrice! - product.price) / product.originalPrice!) *
      100
    )
    : 0;

  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isTablet && styles.tabletCard
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.imageContainer, isTablet && styles.tabletImageContainer]}>
        {!imageError ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#9ca3af" />
          </View>
        )}

        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlistPress}
          disabled={wishlistLoading}
          activeOpacity={0.7}
        >
          {wishlistLoading ? (
            <Ionicons name="refresh" size={16} color="#ef4444" />
          ) : (
            <Ionicons
              name={isInWishlist ? "heart" : "heart-outline"}
              size={16}
              color="#ef4444"
            />
          )}
        </TouchableOpacity>

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Brand */}
        <Text style={styles.brandName} numberOfLines={1}>
          {product.brand}
        </Text>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(product.rating)}
            </View>
            <Text style={styles.ratingText}>({product.rating})</Text>
          </View>
        )}

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>
            {formatCurrency(product.price)}
          </Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>
              {formatCurrency(product.originalPrice!)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity style={styles.addToCartButton} activeOpacity={0.8}>
          <Ionicons name="cart-outline" size={16} color="white" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginRight: 16,
    width: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  tabletCard: {
    width: 240,
  },
  imageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: "#f8fafc",
  },
  tabletImageContainer: {
    height: 180,
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
    backgroundColor: "#f1f5f9",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    padding: 12,
  },
  brandName: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: "600",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 18,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  addToCartButton: {
    backgroundColor: "#346beb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    marginLeft: 4,
  },
});

export default RecommendationCard;
