import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/product";

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
  const { token } = useAuth();
  const [heartVisible, setHeartVisible] = useState(false);

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  const getMainImage = (): string | null => {
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.mainImage) return product.mainImage;
    return null;
  };

  const mainImage = getMainImage();

  return (
    <Pressable
      onPress={() => router.push(`/products/${product.id}`)}
      onPressIn={() => setHeartVisible(true)}
      onPressOut={() => setHeartVisible(false)}
      style={styles.card}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        {/* Sale badge */}
        {hasDiscount && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>SALE</Text>
          </View>
        )}

        {/* Wishlist heart — shown on press */}
        {mode === "view" && (
          <TouchableOpacity
            style={[styles.heartBtn, { opacity: heartVisible || isWishlisted ? 1 : 0 }]}
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
              color="#000000"
            />
          </TouchableOpacity>
        )}

        {/* Edit button */}
        {mode === "manage" && onEdit && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(product.id);
            }}
          >
            <Ionicons name="create-outline" size={16} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.brandLabel} numberOfLines={1}>
          {product.brandName ?? "BRAND"}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${displayPrice}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${product.price}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: 24,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f3f3f4",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    backgroundColor: "#eeeeee",
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#C41E3A",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 9,
    color: "#ffffff",
    letterSpacing: 1,
  },
  heartBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  brandLabel: {
    fontFamily: "SpaceMono_700Bold",
    fontSize: 10,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  productName: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 13,
    color: "#000000",
    marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 13,
    color: "#000000",
  },
  originalPrice: {
    fontFamily: "SpaceMono_400Regular",
    fontSize: 11,
    color: "#7d001d",
    textDecorationLine: "line-through",
  },
});

export default ProductCard;
