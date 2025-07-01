import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";

const { width: screenWidth } = Dimensions.get("window");

const ProductDetailScreen = () => {
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/products/${productId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch product details");
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>Product not found.</Text>
      </View>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex];
  const hasDiscount = (product.salePrice ?? 0) < (product.price ?? 0);

  const renderColorSelector = () => (
    <View style={styles.colorContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Colors</Text>
      <View style={styles.colorOptions}>
        {product.variants.map((variant, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: variant.color },
              selectedVariantIndex === index && styles.selectedColor,
            ]}
            onPress={() => {
              setSelectedVariantIndex(index);
              setSelectedImageIndex(0);
            }}
          />
        ))}
      </View>
    </View>
  );

  const renderImageGallery = () => (
    <View style={styles.imageContainer}>
      <FlatList
        data={currentVariant?.variantImages || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.productImage} />
        )}
        keyExtractor={(item, index) => index.toString()}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth
          );
          setSelectedImageIndex(newIndex);
        }}
      />

      {/* Image indicators */}
      <View style={styles.imageIndicators}>
        {currentVariant?.variantImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              selectedImageIndex === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderProductInfo = () => (
    <View style={[styles.infoContainer, { backgroundColor: cardBackground }]}>
      {/* Brand Section */}
      <View style={styles.brandSection}>
        {product.brand.logo && (
          <Image
            source={{ uri: product.brand.logo }}
            style={styles.brandLogo}
          />
        )}
        <View style={styles.brandInfo}>
          <Text style={[styles.brandName, { color: textColor }]}>
            {product.brand.name}
          </Text>
          <Text style={[styles.brandLocation, { color: "#666" }]}>
            {product.brand.location}
          </Text>
        </View>
      </View>

      {/* Product Name */}
      <Text style={[styles.productName, { color: textColor }]}>
        {product.name}
      </Text>

      {/* Price Section */}
      <View style={styles.priceContainer}>
        <Text style={styles.salePrice}>${product.salePrice ?? 0}</Text>
        {hasDiscount && (
          <Text style={styles.originalPrice}>${product.price ?? 0}</Text>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(
                ((parseFloat(String(product.price ?? "0")) -
                  parseFloat(String(product.salePrice ?? "0"))) /
                  parseFloat(String(product.price ?? "0"))) *
                  100
              )}
              % OFF
            </Text>
          </View>
        )}
      </View>

      {/* Stock Status */}
      <View style={styles.stockContainer}>
        <Text
          style={[
            styles.stockText,
            { color: product.totalStock > 0 ? "#28a745" : "#dc3545" },
          ]}
        >
          {product.totalStock > 0
            ? `${product.totalStock} in stock`
            : "Out of stock"}
        </Text>
      </View>

      {/* Description */}
      <Text style={[styles.productDescription, { color: textColor }]}>
        {product.description}
      </Text>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Product Details
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Type:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.productType}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Category:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.subcategory}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Gender:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.gender}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Season:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.season}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Material:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.material}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: "#666" }]}>Origin:</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>
            {product.origin}
          </Text>
        </View>
      </View>

      {/* Care Instructions */}
      <View style={styles.careContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Care Instructions
        </Text>
        <Text style={[styles.careText, { color: textColor }]}>
          {product.careInstructions}
        </Text>
      </View>

      {/* Tags */}
      {product.tags && product.tags?.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Tags</Text>
          <View style={styles.tagsWrapper}>
            {product.tags?.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {renderImageGallery()}
      {renderColorSelector()}
      {renderProductInfo()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Image Gallery Styles
  imageContainer: { position: "relative" },
  productImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: "cover",
  },
  imageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#007AFF",
  },

  // Color Selector Styles
  colorContainer: {
    padding: 16,
  },
  colorOptions: {
    flexDirection: "row",
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },

  // Product Info Styles
  infoContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
  },
  brandLocation: {
    fontSize: 14,
    marginTop: 2,
  },

  productName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#28a745",
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 18,
    textDecorationLine: "line-through",
    color: "#888",
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  stockContainer: {
    marginBottom: 16,
  },
  stockText: {
    fontSize: 16,
    fontWeight: "500",
  },

  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },

  // Details Styles
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
    textAlign: "right",
  },

  // Care Instructions
  careContainer: {
    marginBottom: 20,
  },
  careText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Tags
  tagsContainer: {
    marginBottom: 20,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#333",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
});

export default ProductDetailScreen;
