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
  ActionSheetIOS,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { useImageSearch } from "@/hooks/useImageSearch";
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

  const {
    searching: imageSearching,
    results: imageResults,
    error: imageError,
    searchedImageUri,
    pickFromGallery,
    takePhoto,
    clear: clearImageSearch,
  } = useImageSearch();

  const inImageSearchMode = !!searchedImageUri;
  const itemWidth = (width - 48) / 2;

  // Fetch initial/popular products when modal opens
  useEffect(() => {
    if (!visible) {
      setQuery("");
      setProducts([]);
      clearImageSearch();
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
  }, [visible, token, clearImageSearch]);

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

  const handleOpenPicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Take a photo", "Choose from gallery", "Cancel"],
          cancelButtonIndex: 2,
          title: "Search by image",
        },
        (index) => {
          if (index === 0) takePhoto();
          else if (index === 1) pickFromGallery();
        },
      );
    } else {
      Alert.alert("Search by image", "", [
        { text: "Take a photo", onPress: () => takePhoto() },
        { text: "Choose from gallery", onPress: () => pickFromGallery() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleClearImageSearch = () => {
    clearImageSearch();
  };

  const displayedProducts = inImageSearchMode ? imageResults : products;
  const isLoading = inImageSearchMode ? imageSearching : loading;

  const renderProduct = ({ item }: { item: Product }) => {
    const image = item.mainImage;
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
            editable={!inImageSearchMode}
          />
          <Pressable onPress={handleOpenPicker} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="camera-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Visual search banner */}
        {inImageSearchMode && (
          <View style={[styles.visualBanner, { borderBottomColor: colors.border }]}>
            {searchedImageUri && (
              <Image
                source={{ uri: searchedImageUri }}
                style={styles.visualThumb}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.visualLabel, { color: colors.text }]}>
              VISUAL SEARCH
            </Text>
            <Pressable onPress={handleClearImageSearch} hitSlop={8}>
              <Text style={[styles.clearLabel, { color: colors.textTertiary }]}>
                CLEAR
              </Text>
            </Pressable>
          </View>
        )}

        {/* Error banner */}
        {imageError && inImageSearchMode && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{imageError}</Text>
          </View>
        )}

        {/* Results */}
        {isLoading && displayedProducts.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={colors.text}
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={displayedProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={renderProduct}
            ListHeaderComponent={
              displayedProducts.length > 0 ? (
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                  {inImageSearchMode
                    ? "SIMILAR PRODUCTS"
                    : query.trim()
                      ? "RESULTS"
                      : "PRODUCTS"}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    {inImageSearchMode
                      ? "No similar products found"
                      : query.trim()
                        ? "No products found"
                        : ""}
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
  iconButton: {
    paddingHorizontal: 2,
  },
  visualBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  visualThumb: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  visualLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 2,
  },
  clearLabel: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 2,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff0f0",
  },
  errorText: {
    color: "#cc0000",
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 2,
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
    // letterSpacing: 0.5,
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
