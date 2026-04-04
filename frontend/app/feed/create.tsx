import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import Header from "@/components/Header";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import * as ImagePicker from "expo-image-picker";

export default function CreatePostScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();
  const { uploadImage } = useCloudinaryUpload();

  const [myBrands, setMyBrands] = useState<any[]>([]);
  const [chosenBrand, setChosenBrand] = useState<any>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch user's owned brands
  useEffect(() => {
    if (!token) return;
    fetch(`${getApiUrl()}/brands/my-brands`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const brands = Array.isArray(data) ? data : [];
        setMyBrands(brands);
        if (brands.length === 1) setChosenBrand(brands[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingBrands(false));
  }, [token]);

  // Fetch brand products for tagging when chosen brand changes
  useEffect(() => {
    if (!chosenBrand?.id || !token) {
      setProducts([]);
      return;
    }
    setSelectedProductIds([]);
    setLoadingProducts(true);
    fetch(`${getApiUrl()}/products?brandId=${chosenBrand.id}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [chosenBrand?.id, token]);

  const pickImages = async () => {
    if (images.length >= 10) {
      Alert.alert("Limit", "Maximum 10 images per post.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const asset of result.assets) {
        const url = await uploadImage(asset.uri);
        if (url) newUrls.push(url);
      }
      setImages((prev) => [...prev, ...newUrls].slice(0, 10));
    } catch (e: any) {
      Alert.alert("Upload Error", e.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleSubmit = async () => {
    if (!images.length) {
      Alert.alert("Required", "Add at least one image.");
      return;
    }
    if (!chosenBrand?.id) {
      Alert.alert("Brand Required", "Please select a brand first.");
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        brandId: chosenBrand.id,
        images,
        caption: caption.trim() || undefined,
      };
      if (selectedProductIds.length) body.productIds = selectedProductIds;

      const res = await fetch(`${getApiUrl()}/feed/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create post");
      }

      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <Header />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand picker */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          POST AS BRAND
        </Text>
        {loadingBrands ? (
          <ActivityIndicator style={{ marginBottom: 24 }} color={colors.textTertiary} />
        ) : myBrands.length === 0 ? (
          <Text style={[styles.noProducts, { color: colors.textTertiary }]}>
            You don't own any brands yet.
          </Text>
        ) : (
          <View style={[styles.brandPickerRow, { marginBottom: 24 }]}>
            {myBrands.map((brand) => {
              const selected = chosenBrand?.id === brand.id;
              return (
                <TouchableOpacity
                  key={brand.id}
                  style={[
                    styles.brandChip,
                    {
                      borderColor: selected ? colors.text : colors.border,
                      backgroundColor: selected ? colors.surfaceRaised : "transparent",
                    },
                  ]}
                  onPress={() => setChosenBrand(brand)}
                  activeOpacity={0.7}
                >
                  {brand.logo && (
                    <Image source={{ uri: brand.logo }} style={styles.brandChipLogo} />
                  )}
                  <Text
                    style={[
                      styles.brandChipName,
                      { color: colors.text },
                      selected && { fontWeight: "700" },
                    ]}
                    numberOfLines={1}
                  >
                    {brand.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={16} color={colors.text} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Images */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          PHOTOS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroll}
          contentContainerStyle={styles.imagesContainer}
        >
          {images.map((uri, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri }} style={styles.thumbImage} />
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.text }]}
                onPress={() => removeImage(i)}
              >
                <Ionicons name="close" size={14} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 10 && (
            <TouchableOpacity
              style={[styles.addImageBtn, { borderColor: colors.border }]}
              onPress={pickImages}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.textTertiary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
                  <Text style={[styles.addImageText, { color: colors.textTertiary }]}>
                    {images.length}/10
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Caption */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          CAPTION
        </Text>
        <TextInput
          style={[
            styles.captionInput,
            { color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Write a caption..."
          placeholderTextColor={colors.textTertiary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2000}
        />

        {/* Tag Products */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          TAG PRODUCTS (optional)
        </Text>
        {loadingProducts ? (
          <ActivityIndicator style={{ marginTop: 10 }} color={colors.textTertiary} />
        ) : products.length === 0 ? (
          <Text style={[styles.noProducts, { color: colors.textTertiary }]}>
            No products available to tag
          </Text>
        ) : (
          <View style={styles.productGrid}>
            {products.map((p: any) => {
              const selected = selectedProductIds.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.productChip,
                    {
                      borderColor: selected ? colors.text : colors.border,
                      backgroundColor: selected
                        ? colors.surfaceRaised
                        : "transparent",
                    },
                  ]}
                  onPress={() => toggleProduct(p.id)}
                  activeOpacity={0.7}
                >
                  {p.images?.[0] && (
                    <Image
                      source={{ uri: p.images[0] }}
                      style={styles.productChipImage}
                    />
                  )}
                  <Text
                    style={[styles.productChipName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={16} color={colors.text} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Submit */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            (submitting || !images.length || !chosenBrand) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !images.length || !chosenBrand}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
              PUBLISH POST
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },

  brandPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  brandChipLogo: { width: 24, height: 24, borderRadius: 12 },
  brandChipName: { fontSize: 14, fontWeight: "500", maxWidth: 150 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Images
  imagesScroll: { marginBottom: 28 },
  imagesContainer: { gap: 10 },
  imageThumb: { position: "relative" },
  thumbImage: { width: 100, height: 100, backgroundColor: "#f5f5f5" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addImageText: { fontSize: 11, fontWeight: "600" },

  // Caption
  captionInput: {
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 28,
  },

  // Products
  noProducts: { fontSize: 13, marginBottom: 20 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  productChipImage: { width: 28, height: 28, backgroundColor: "#f5f5f5" },
  productChipName: { fontSize: 12, fontWeight: "600", maxWidth: 120 },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: 0.5,
  },
  submitBtn: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
