import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/product";
import { ProductStatus } from "@/types/enums";

interface ProductManagementCardProps {
  product: Product;
  onEdit?: (productId: number) => void;
}

const ProductManagementCard: React.FC<ProductManagementCardProps> = ({
  product,
  onEdit,
}) => {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getStatusColor = (status: ProductStatus): string => {
    switch (status) {
      case ProductStatus.PUBLISHED: return colors.toastSuccess;
      case ProductStatus.ARCHIVED: return colors.toastError;
      default: return colors.textSecondary;
    }
  };

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

  const statusColor = getStatusColor(product.status);

  const meta = [product.productType, product.gender, product.season]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => router.push(`/products/${product.id}`)}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: colors.surfaceRaised }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: hasDiscount ? colors.toastSuccess : colors.text }]}>
            ${displayPrice}
          </Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
              ${product.price}
            </Text>
          )}
          <Text style={[styles.stock, { color: colors.textSecondary }]}>
            · {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Text>
        </View>

        {meta ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}

        {/* Color dot */}
        {product.color && (
          <View style={styles.colorRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: product.color, borderColor: colors.borderLight },
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
            style={[styles.editButton, { borderColor: colors.borderLight }]}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(product.id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    color: colors.textInverse,
    textTransform: "uppercase",
    // letterSpacing: 0.4,
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
