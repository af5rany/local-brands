import React, { useMemo } from "react";
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
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

interface ProductCardProps {
  product: Product;
  mode?: "view" | "manage";
  onEdit?: (productId: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  mode = "view",
  onEdit,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;
  const mainImage = product.images?.[0] ?? product.mainImage ?? null;

  return (
    <Pressable
      onPress={() => router.push(`/products/${product.id}`)}
      style={styles.card}
    >
      {({ pressed }) => (
        <>
          {/* Image */}
          <View style={[styles.imageWrap, { backgroundColor: colors.surfaceContainer }]}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.image} />
            )}

            {/* Sale badge */}
            {hasDiscount && (
              <View style={[styles.saleBadge, { backgroundColor: colors.discountBadge }]}>
                <Text style={styles.saleBadgeText}>SALE</Text>
              </View>
            )}

            {/* Wishlist heart — shown on press or when wishlisted */}
            {mode === "view" && (
              <TouchableOpacity
                style={[styles.heartBtn, { backgroundColor: colors.surface, opacity: pressed || isWishlisted ? 1 : 0 }]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!token) { router.push("/auth/login"); return; }
                  onToggleWishlist?.(product.id);
                }}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={16}
                  color={colors.wishlistHeart}
                />
              </TouchableOpacity>
            )}

            {/* Edit button */}
            {mode === "manage" && onEdit && (
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.surface }]}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(product.id);
                }}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            {/* <Text style={[styles.brandLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.brandName ?? "BRAND"}
            </Text> */}
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.priceCurrent }]}>
                ${displayPrice}
              </Text>
              {hasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.priceOriginal }]}>
                  ${product.price}
                </Text>
              )}
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: 24,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontFamily: undefined,
    fontSize: 9,
    color: colors.textInverse,
    // // letterSpacing: 1,
  },
  heartBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  brandLabel: {
    fontFamily: undefined,
    fontSize: 10,
    textTransform: "uppercase",
    // letterSpacing: 1,
    marginBottom: 3,
  },
  productName: {
    fontFamily: undefined,
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontFamily: undefined,
    fontSize: 13,
  },
  originalPrice: {
    fontFamily: undefined,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
});

export default ProductCard;
