import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Pressable,
  LayoutChangeEvent,
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [taggedProducts, setTaggedProducts] = useState<{ productId: number; xPercent?: number; yPercent?: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [placingPinForProduct, setPlacingPinForProduct] = useState<number | null>(null);
  const [imageLayout, setImageLayout] = useState({ width: 1, height: 1 });

  const selectedProductIds = taggedProducts.map((t) => t.productId);

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
    setTaggedProducts([]);
    setLoadingProducts(true);
    fetch(`${getApiUrl()}/products?brandIds=${chosenBrand.id}&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [chosenBrand?.id, token]);

  const uploadFromAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const asset of assets) {
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
    await uploadFromAssets(result.assets);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission required", "Camera access is needed."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets.length) return;
    await uploadFromAssets(result.assets);
  };

  const pickVideo = async () => {
    if (videoUrl) { setVideoUrl(null); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1,
    });
    if (result.canceled || !result.assets.length) return;
    const asset = result.assets[0];
    setUploadingVideo(true);
    try {
      const CLOUD_VIDEO_URL = "https://api.cloudinary.com/v1_1/dg4l2eelg/video/upload";
      const formData = new FormData();
      const filename = asset.uri.split("/").pop() || "video.mp4";
      formData.append("file", { uri: asset.uri, name: filename, type: "video/mp4" } as any);
      formData.append("upload_preset", "UnsignedPreset");
      const res = await fetch(CLOUD_VIDEO_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Video upload failed");
      const data = await res.json();
      if (data.secure_url) setVideoUrl(data.secure_url);
      else throw new Error("No URL returned");
    } catch (e: any) {
      Alert.alert("Video Upload Error", e.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProduct = (productId: number) => {
    const already = taggedProducts.some((t) => t.productId === productId);
    if (already) {
      setTaggedProducts((prev) => prev.filter((t) => t.productId !== productId));
      if (placingPinForProduct === productId) setPlacingPinForProduct(null);
    } else {
      setTaggedProducts((prev) => [...prev, { productId }]);
    }
  };

  const handleImageTap = (e: any) => {
    if (!placingPinForProduct) return;
    const { locationX, locationY } = e.nativeEvent;
    const xPercent = Math.min(100, Math.max(0, (locationX / imageLayout.width) * 100));
    const yPercent = Math.min(100, Math.max(0, (locationY / imageLayout.height) * 100));
    setTaggedProducts((prev) =>
      prev.map((t) => t.productId === placingPinForProduct ? { ...t, xPercent, yPercent } : t)
    );
    setPlacingPinForProduct(null);
  };

  const handleSubmit = async () => {
    if (!images.length && !videoUrl) {
      Alert.alert("Required", "Add at least one photo or a video.");
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
        images: images.length ? images : ["placeholder"],
        caption: caption.trim() || undefined,
      };
      if (videoUrl) body.videoUrl = videoUrl;
      if (taggedProducts.length) body.products = taggedProducts;

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

        {/* Media: Photos + Video */}
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          PHOTOS & VIDEO
        </Text>

        {/* Quick-add buttons */}
        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: colors.border }]}
            onPress={takePhoto}
            disabled={uploading || images.length >= 10}
          >
            <Ionicons name="camera" size={22} color={colors.text} />
            <Text style={[styles.mediaBtnText, { color: colors.text }]}>CAMERA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: colors.border }]}
            onPress={pickImages}
            disabled={uploading || images.length >= 10}
          >
            <Ionicons name="images-outline" size={22} color={colors.text} />
            <Text style={[styles.mediaBtnText, { color: colors.text }]}>GALLERY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaBtn, { borderColor: videoUrl ? colors.text : colors.border, backgroundColor: videoUrl ? colors.surfaceRaised : "transparent" }]}
            onPress={pickVideo}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? (
              <ActivityIndicator color={colors.textTertiary} size="small" />
            ) : (
              <Ionicons name={videoUrl ? "checkmark-circle" : "videocam-outline"} size={22} color={videoUrl ? colors.text : colors.textTertiary} />
            )}
            <Text style={[styles.mediaBtnText, { color: videoUrl ? colors.text : colors.textTertiary }]}>
              {videoUrl ? "VIDEO ✓" : "VIDEO"}
            </Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <ActivityIndicator color={colors.textTertiary} size="small" />
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Uploading photos...</Text>
          </View>
        )}

        {/* Image thumbnails */}
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll} contentContainerStyle={styles.imagesContainer}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageThumb}>
                <Image source={{ uri }} style={[styles.thumbImage, { backgroundColor: colors.surfaceRaised }]} />
                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.text }]} onPress={() => removeImage(i)}>
                  <Ionicons name="close" size={14} color={colors.background} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

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

        {/* Pin placement image preview */}
        {placingPinForProduct && images.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              TAP IMAGE TO PLACE PIN
            </Text>
            <Pressable
              onPress={handleImageTap}
              onLayout={(e: LayoutChangeEvent) =>
                setImageLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })
              }
              style={{ position: "relative" }}
            >
              <Image
                source={{ uri: images[0] }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
                resizeMode="cover"
              />
              {/* Show already-placed pins */}
              {taggedProducts.filter((t) => t.xPercent !== undefined && t.yPercent !== undefined).map((t) => (
                <View
                  key={t.productId}
                  style={{
                    position: "absolute",
                    left: `${t.xPercent}%` as any,
                    top: `${t.yPercent}%` as any,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: "white",
                    borderWidth: 2, borderColor: "black",
                    transform: [{ translateX: -10 }, { translateY: -10 }],
                  }}
                />
              ))}
            </Pressable>
            <TouchableOpacity
              onPress={() => setPlacingPinForProduct(null)}
              style={{ marginTop: 8, alignSelf: "center", padding: 8 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cancel pin placement</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tag Products — only show after brand is chosen */}
        {chosenBrand && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              TAG PRODUCTS (optional)
            </Text>
            {selectedProductIds.length > 0 && (
              <Text style={[styles.selectedCount, { color: colors.text }]}>
                {selectedProductIds.length} product{selectedProductIds.length > 1 ? "s" : ""} selected
              </Text>
            )}
            {loadingProducts ? (
              <ActivityIndicator style={{ marginTop: 10 }} color={colors.textTertiary} />
            ) : products.length === 0 ? (
              <Text style={[styles.noProducts, { color: colors.textTertiary }]}>
                No products found for {chosenBrand.name}
              </Text>
            ) : (
              <View style={styles.productGrid}>
                {products.map((p: any) => {
                  const selected = selectedProductIds.includes(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.productCard,
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
                      {selected && (
                        <View style={[styles.productCheckmark, { backgroundColor: colors.text }]}>
                          <Ionicons name="checkmark" size={14} color={colors.background} />
                        </View>
                      )}
                      <View style={styles.productImageWrap}>
                        {p.images?.[0] ? (
                          <Image
                            source={{ uri: p.images[0] }}
                            style={[styles.productCardImage, { backgroundColor: colors.surfaceRaised }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.productCardImage, { backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }]}>
                            <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.productCardName, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {p.name}
                      </Text>
                      {p.price != null && (
                        <Text style={[styles.productCardPrice, { color: colors.textTertiary }]}>
                          ${Number(p.price).toFixed(2)}
                        </Text>
                      )}
                      {selected && images.length > 0 && (
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); setPlacingPinForProduct(p.id); }}
                          style={{ marginTop: 4, paddingVertical: 4, alignItems: "center" }}
                        >
                          <Ionicons
                            name={taggedProducts.find((t) => t.productId === p.id)?.xPercent !== undefined ? "location" : "location-outline"}
                            size={14}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
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
            (submitting || (!images.length && !videoUrl) || !chosenBrand) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || (!images.length && !videoUrl) || !chosenBrand}
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
  brandChipLogo: { width: 24, height: 24, borderRadius: 0 },
  brandChipName: { fontSize: 14, fontWeight: "500", maxWidth: 150 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Media buttons
  mediaButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  mediaBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  mediaBtnText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Images
  imagesScroll: { marginBottom: 28 },
  imagesContainer: { gap: 10 },
  imageThumb: { position: "relative" },
  thumbImage: { width: 100, height: 100 },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 0,
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
  selectedCount: { fontSize: 12, fontWeight: "600", marginBottom: 12 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  productCard: {
    borderWidth: 1,
    width: "47%" as any,
    position: "relative",
    overflow: "hidden",
  },
  productCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  productImageWrap: {
    width: "100%",
    aspectRatio: 1,
  },
  productCardImage: {
    width: "100%",
    height: "100%",
    // backgroundColor set dynamically via theme
  },
  productCardName: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
  },
  productCardPrice: {
    fontSize: 11,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },

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
    // letterSpacing: 2,
  },
});
