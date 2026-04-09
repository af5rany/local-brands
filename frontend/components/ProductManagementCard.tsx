import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/product";
import { ProductStatus } from "@/types/enums";

interface ProductManagementCardProps {
  product: Product;
  onEdit?: (productId: number) => void;
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  [ProductStatus.PUBLISHED]: "#10b981",
  [ProductStatus.DRAFT]: "#64748b",
  [ProductStatus.ARCHIVED]: "#ef4444",
};

const ProductManagementCard: React.FC<ProductManagementCardProps> = ({
  product,
  onEdit,
}) => {
  const router = useRouter();

  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const borderColor = useThemeColor(
    { light: "#f0f0f0", dark: "#2c2c2e" },
    "text",
  );
  const textColor = useThemeColor({}, "text");
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
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

  const thumbnail =
    product.images?.[0] ??
    product.mainImage ??
    null;

  const displayPrice =
    product.salePrice && product.salePrice < product.price
      ? product.salePrice
      : product.price;

  const hasDiscount =
    product.salePrice != null && product.salePrice < product.price;

  const statusColor = STATUS_COLORS[product.status] ?? "#64748b";

  const meta = [product.productType, product.gender, product.season]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={() => router.push(`/products/${product.id}`)}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: imageBackgroundColor }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <Ionicons name="image-outline" size={24} color={secondaryTextColor} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: hasDiscount ? "#10b981" : textColor }]}>
            ${displayPrice}
          </Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: secondaryTextColor }]}>
              ${product.price}
            </Text>
          )}
          <Text style={[styles.stock, { color: secondaryTextColor }]}>
            · {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Text>
        </View>

        {meta ? (
          <Text style={[styles.meta, { color: secondaryTextColor }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}

        {/* Color dot */}
        {product.color && (
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: product.color, borderColor },
              ]}
            />
          </View>
        )}
      </View>

      {/* Right column: status + edit */}
      <View style={styles.actions}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{product.status}</Text>
        </View>

        {onEdit && (
          <TouchableOpacity
            style={[styles.editButton, { borderColor }]}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(product.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={16} color={buttonColor} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 0,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 0,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  stock: {
    fontSize: 12,
  },
  meta: {
    fontSize: 11,
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 0,
    borderWidth: 1,
  },
  actions: {
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 0,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProductManagementCard;
