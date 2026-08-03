import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import getApiUrl from "@/helpers/getApiUrl";
import { formatPrice } from "@/utils/formatPrice";

interface Variant {
  id: number;
  size: string | null;
  stock: number;
  isAvailable: boolean;
}

interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: number;
    salePrice?: number | null;
    mainImage?: string;
    variants: Variant[];
  } | null;
}

const QuickAddSheet: React.FC<QuickAddSheetProps> = ({ visible, onClose, product }) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { refresh: refreshCart } = useCart();
  const { showToast } = useToast();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const selectedVariantOos = selectedVariant ? (!selectedVariant.isAvailable || selectedVariant.stock === 0) : false;

  const handleAdd = async () => {
    if (!selectedVariantId) {
      showToast("Please select a size", "error");
      return;
    }
    if (selectedVariantOos) {
      // Notify me for OOS selected size
      setLoading(true);
      try {
        const res = await fetch(`${getApiUrl()}/notifications/notify-me/${product.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          showToast("You'll be notified when back in stock", "success");
          setSelectedVariantId(null);
          onClose();
        } else {
          showToast("Could not subscribe", "error");
        }
      } catch {
        showToast("Could not subscribe", "error");
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/cart/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariantId, quantity: 1 }),
      });
      if (res.ok) {
        refreshCart();
        showToast("Added to bag", "success");
        setSelectedVariantId(null);
        onClose();
      } else {
        const d = await res.json();
        showToast(d.message || "Could not add to bag", "error");
      }
    } catch {
      showToast("Could not add to bag", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedVariantId(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Product row */}
        <View style={styles.productRow}>
          {product.mainImage ? (
            <Image source={{ uri: product.mainImage }} style={[styles.thumb, { backgroundColor: colors.surfaceRaised }]} resizeMode="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: colors.surfaceRaised }]} />
          )}
          <View style={styles.productMeta}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
              {product.name.toUpperCase()}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text }]}>{formatPrice(displayPrice)}</Text>
              {hasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>{formatPrice(product.price)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Size label */}
        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SELECT SIZE</Text>

        {/* Size chips */}
        <View style={styles.sizeGrid}>
          {product.variants.map((v) => {
            const outOfStock = !v.isAvailable || v.stock === 0;
            const isSelected = selectedVariantId === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[
                  styles.sizeChip,
                  { borderColor: isSelected ? colors.text : colors.border, backgroundColor: isSelected ? colors.text : colors.background },
                  outOfStock && styles.sizeChipOos,
                ]}
                onPress={() => setSelectedVariantId(v.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sizeLabel, { color: isSelected ? colors.background : outOfStock ? colors.textTertiary : colors.text }]}>
                  {v.size || "ONE SIZE"}
                </Text>
                {outOfStock && <View style={[styles.strikethrough, { backgroundColor: colors.border }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Low stock warning */}
        {selectedVariantId && (() => {
          const v = product.variants.find((x) => x.id === selectedVariantId);
          return v && v.stock <= 3 ? (
            <Text style={[styles.lowStock, { color: colors.accentRed }]}>ONLY {v.stock} LEFT</Text>
          ) : null;
        })()}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: selectedVariantId ? colors.text : colors.border }]}
          onPress={handleAdd}
          disabled={!selectedVariantId || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[styles.addBtnText, { color: selectedVariantId ? colors.background : colors.textTertiary }]}>
              {!selectedVariantId ? "SELECT A SIZE" : selectedVariantOos ? "NOTIFY ME" : "ADD TO BAG"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default QuickAddSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  productRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  thumb: {
    width: 72,
    height: 88,
  },
  productMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  productName: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 12,
  },
  sizeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  sizeChip: {
    minWidth: 52,
    height: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    position: "relative",
    overflow: "hidden",
  },
  sizeChipOos: {
    opacity: 0.4,
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  strikethrough: {
    position: "absolute",
    height: 1,
    left: 0,
    right: 0,
    top: "50%",
  },
  lowStock: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  addBtn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
