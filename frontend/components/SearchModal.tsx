import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { Product } from "@/types/product";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SearchModal({ visible, onClose }: SearchModalProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const cachedProducts = useRef<Product[]>([]);

  const itemWidth = (width - 48) / 2;

  // Fetch initial/popular products when modal opens
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setProducts([]);
      return;
    }

    setTimeout(() => inputRef.current?.focus(), 300);

    if (cachedProducts.current.length > 0) {
      setProducts(cachedProducts.current);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(
      `${getApiUrl()}/products/trending?limit=10`,
      { headers: { ...(token && { Authorization: `Bearer ${token}` }) } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data.items || []);
        cachedProducts.current = items;
        setProducts(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [visible, token]);

  const searchProducts = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setProducts(cachedProducts.current);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `${getApiUrl()}/products?limit=20&status=published&search=${encodeURIComponent(text)}`,
          { headers: { ...(token && { Authorization: `Bearer ${token}` }) } },
        );
        const data = await res.json();
        setProducts(data.items || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(text), 300);
  };

  const handleProductPress = (id: number) => {
    router.push(`/products/${id}` as any);
    onClose();
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const image = item.mainImage || item.variants?.[0]?.images?.[0];
    const hasDiscount = item.salePrice && item.salePrice < item.price;

    return (
      <Pressable
        style={[styles.productCard, { width: itemWidth }]}
        onPress={() => handleProductPress(item.id)}
      >
        <View
          style={[
            styles.productImageWrap,
            { backgroundColor: colors.surfaceRaised, height: itemWidth * 1.3 },
          ]}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
          )}
        </View>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text
            style={[
              styles.productPrice,
              { color: hasDiscount ? colors.priceCurrent : colors.text },
            ]}
          >
            LE {(item.salePrice || item.price).toFixed(2)}
          </Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
              LE {item.price.toFixed(2)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Search Bar */}
        <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Results */}
        {loading && products.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={colors.text}
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={renderProduct}
            ListHeaderComponent={
              products.length > 0 ? (
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  {query.trim() ? "RESULTS" : "PRODUCTS"}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    {query.trim() ? "No products found" : ""}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  grid: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  productCard: {
    gap: 6,
  },
  productImageWrap: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productName: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: "500",
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
