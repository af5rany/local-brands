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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Brand } from "@/types/brand";
import { Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

const ProductDetailScreen = () => {
  const { productId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const userRole = user?.role || user?.userRole;
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
      if (!token || !productId || isNaN(Number(productId))) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiUrl()}/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch product details");
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

    // Reset selection when product changes
    setSelectedVariantIndex(0);
    setSelectedImageIndex(0);
  }, [productId, token]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#346beb" />
        <Text style={{ color: textColor, marginTop: 10 }}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
        <Text style={{ color: textColor, fontSize: 18, marginTop: 10 }}>Product not found.</Text>
      </View>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex];
  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const isOwnerOrAdmin = userRole === "admin" || (user?.id && product?.brand?.owner?.id && user.id === product.brand.owner.id);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${getApiUrl()}/products/${productId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete product");
              }
              Alert.alert("Success", "Product deleted successfully");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const renderColorSelector = () => (
    <View style={styles.colorContainer}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Colors</Text>
      <View style={styles.colorOptions}>
        {product.variants?.map((variant, index) => (
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
        {currentVariant?.variantImages?.map((_, index) => (
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
        <Text style={styles.salePrice}>
          ${hasDiscount ? product.salePrice ?? product.price : product.price}
        </Text>
        {hasDiscount && (
          <Text style={styles.originalPrice}>${product.price}</Text>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(
                ((product.price - (product.salePrice ?? 0)) / product.price) * 100
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
            { color: product.stock > 0 ? "#28a745" : "#dc3545" },
          ]}
        >
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
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

      {/* Admin/Owner Actions */}
      {isOwnerOrAdmin && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => Alert.alert("Coming Soon", "Edit functionality is not available yet.")}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete Product</Text>
          </TouchableOpacity>
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
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
});

export default ProductDetailScreen;
