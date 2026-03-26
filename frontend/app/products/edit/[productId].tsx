import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { Dropdown } from "react-native-element-dropdown";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Product, ProductVariant } from "@/types/product";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import * as ImageManipulator from "expo-image-manipulator";
import { ProductStatus } from "@/types/enums";
import { COLOR_PALETTE, getSizesForProductType } from "@/constants/SizeChart";

const genderOptions = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
  { label: "Kids", value: "kids" },
];

const seasonOptions = [
  { label: "Spring", value: "Spring" },
  { label: "Summer", value: "Summer" },
  { label: "Fall", value: "Fall" },
  { label: "Winter", value: "Winter" },
  { label: "All Season", value: "All Season" },
];

const colorPalette = COLOR_PALETTE;

const EditProductScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { productId } = useLocalSearchParams();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const borderColor = useThemeColor(
    { light: "#e1e5e9", dark: "#38383a" },
    "text",
  );
  const primaryColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "primary",
  );
  const placeholderColor = useThemeColor(
    { light: "#8e8e93", dark: "#8e8e93" },
    "text",
  );

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [productType, setProductType] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [gender, setGender] = useState("");
  const [season, setSeason] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [origin, setOrigin] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.DRAFT);
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [stock, setStock] = useState(0);
  const [brandId, setBrandId] = useState<number | null>(null);

  const { uploads, uploadImage, pickAndUpload } = useCloudinaryUpload();

  const [dynamicProductTypes, setDynamicProductTypes] = useState<
    { label: string; value: string }[]
  >([]);
  const [dynamicCategories, setDynamicCategories] = useState<
    { label: string; value: string }[]
  >([]);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch product");
      const data: Product = await response.json();

      setProductName(data.name);
      setDescription(data.description || "");
      setProductPrice(String(data.price));
      setSalePrice(data.salePrice ? String(data.salePrice) : "");
      setProductType(data.productType || "");
      setSubcategory(data.subcategory || "");
      setGender(data.gender || "");
      setSeason(data.season ? String(data.season) : null);
      setTags(data.tags || []);
      setMaterial(data.material || "");
      setCareInstructions(data.careInstructions || "");
      setOrigin(data.origin || "");
      setWeight(data.weight ? String(data.weight) : "");
      setLength(data.length ? String(data.length) : "");
      setWidth(data.width ? String(data.width) : "");
      setHeight(data.height ? String(data.height) : "");
      setStatus(data.status);
      setIsFeatured(data.isFeatured);
      setHasVariants((data.variants?.length || 0) > 0);
      setProductImages(data.images || []);
      setVariants(
        data.variants && data.variants.length > 0
          ? data.variants
          : [{ color: "", size: "", variantImages: [], stock: 0 }],
      );
      setStock(data.stock || 0);
      setBrandId(data.brandId);
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert("Error", "Failed to fetch product details.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [productId, token, router]);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/products/filters`);
      if (response.ok) {
        const data = await response.json();
        setDynamicProductTypes(
          (data.productTypes || []).map((t: string) => ({
            label: t,
            value: t,
          })),
        );
        setDynamicCategories(
          (data.categories || []).map((c: string) => ({ label: c, value: c })),
        );
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  useEffect(() => {
    if (productId && token) {
      fetchProduct();
      fetchOptions();
    }
  }, [productId, token, fetchProduct, fetchOptions]);

  const handleUpdateProduct = async () => {
    if (submitting) return;

    if (!productName || !productPrice || !productType || !gender) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    if (salePrice && parseFloat(salePrice) >= parseFloat(productPrice)) {
      Alert.alert(
        "Validation Error",
        "Sale price must be less than the regular price.",
      );
      return;
    }

    if (hasVariants) {
      if (
        variants.some(
          (v) => !v.color || !v.variantImages.length || v.stock === undefined,
        )
      ) {
        Alert.alert(
          "Validation Error",
          "Each variant needs a color, at least one image, and stock quantity.",
        );
        return;
      }
    } else {
      if (productImages.length === 0) {
        Alert.alert("Validation Error", "Please add at least one product image.");
        return;
      }
    }

    const hasNonCloudinaryImage =
      productImages.some((uri) => !uri.startsWith("https://res.cloudinary.")) ||
      variants.some((variant) =>
        (variant.variantImages || []).some(
          (uri: string) => !uri.startsWith("https://res.cloudinary."),
        ),
      );

    if (hasNonCloudinaryImage) {
      Alert.alert(
        "Please wait",
        "Please wait for images to get uploaded before saving.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const productData: any = {
        name: productName,
        description,
        price: parseFloat(productPrice),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        productType,
        subcategory,
        gender,
        season,
        tags: tags.length > 0 ? tags : null,
        material,
        careInstructions,
        origin,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        status,
        isFeatured,
      };

      if (hasVariants) {
        productData.variants = variants.map((v) => ({
          color: v.color,
          size: v.size || undefined,
          variantImages: v.variantImages,
          stock: Number(v.stock),
        }));
        productData.stock = variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
      } else {
        productData.stock = Number(stock);
        productData.images = productImages;
      }

      const response = await fetch(`${getApiUrl()}/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        Alert.alert("Success", "Product updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update product");
      }
    } catch (error: any) {
      console.error("Error updating product:", error);
      Alert.alert("Error", error.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagInput = (text: string) => {
    if (text.trim() && !tags.includes(text.trim())) {
      setTags([...tags, text.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants([...variants, { color: "", size: "", variantImages: [], stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any,
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const handleVariantImagePick = async (index: number) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!",
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (result.canceled || !result.assets) return;

      const updatedVariants = [...variants];
      const startIndex = updatedVariants[index].variantImages.length;

      // Add local URIs immediately
      const newLocalUris = result.assets.map((a) => a.uri);
      updatedVariants[index].variantImages = [
        ...updatedVariants[index].variantImages,
        ...newLocalUris,
      ];
      setVariants(updatedVariants);

      // Start uploading each
      result.assets.forEach(async (asset, assetIndex) => {
        const cloudUrl = await uploadImage(asset.uri);
        if (cloudUrl) {
          setVariants((currentVariants) => {
            const newVariants = [...currentVariants];
            const imgIndex = startIndex + assetIndex;
            if (newVariants[index].variantImages[imgIndex] === asset.uri) {
              newVariants[index].variantImages[imgIndex] = cloudUrl;
            }
            return newVariants;
          });
        }
      });
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const handleProductImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!",
        );
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 1,
      });
      if (result.canceled || !result.assets) return;

      const newLocalUris = result.assets.map((a) => a.uri);
      setProductImages((prev) => [...prev, ...newLocalUris]);

      result.assets.forEach(async (asset) => {
        const cloudUrl = await uploadImage(asset.uri);
        if (cloudUrl) {
          setProductImages((prev) =>
            prev.map((u) => (u === asset.uri ? cloudUrl : u)),
          );
        }
      });
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title: "Edit Product", headerShown: true }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.header, { color: textColor }]}>
            Update Product Information
          </Text>

          {/* Basic Info */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Basic Information
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Product Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor }]}
                value={productName}
                onChangeText={setProductName}
                placeholder="Enter name"
                placeholderTextColor={placeholderColor}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: textColor, borderColor },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.label, { color: textColor }]}>
                  Price ($) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={productPrice}
                  onChangeText={setProductPrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.label, { color: textColor }]}>
                  Sale Price ($)
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={salePrice}
                  onChangeText={setSalePrice}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Product Type <Text style={styles.required}>*</Text>
              </Text>
              <Dropdown
                data={dynamicProductTypes}
                labelField="label"
                valueField="value"
                value={productType}
                onChange={(item) => setProductType(item.value)}
                style={[styles.dropdown, { borderColor }]}
                placeholderStyle={{ color: placeholderColor }}
                selectedTextStyle={{ color: textColor }}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.label, { color: textColor }]}>
                  Gender <Text style={styles.required}>*</Text>
                </Text>
                <Dropdown
                  data={genderOptions}
                  labelField="label"
                  valueField="value"
                  value={gender}
                  onChange={(item) => setGender(item.value)}
                  style={[styles.dropdown, { borderColor }]}
                  placeholderStyle={{ color: placeholderColor }}
                  selectedTextStyle={{ color: textColor }}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={[styles.label, { color: textColor }]}>Season</Text>
                <Dropdown
                  data={seasonOptions}
                  labelField="label"
                  valueField="value"
                  value={season}
                  onChange={(item) => setSeason(item.value)}
                  style={[styles.dropdown, { borderColor }]}
                  placeholderStyle={{ color: placeholderColor }}
                  selectedTextStyle={{ color: textColor }}
                />
              </View>
            </View>
          </View>

          {/* Has Variants Toggle */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <View style={styles.switchContainer}>
              <View>
                <Text style={[styles.label, { color: textColor }]}>
                  Has Color/Size Variants?
                </Text>
                <Text style={{ color: placeholderColor, fontSize: 13, marginTop: 2 }}>
                  {hasVariants
                    ? "Each variant has its own stock & images"
                    : "Simple product with one stock count"}
                </Text>
              </View>
              <Switch
                value={hasVariants}
                onValueChange={setHasVariants}
                trackColor={{ false: placeholderColor, true: primaryColor }}
                thumbColor={hasVariants ? "#ffffff" : "#f4f3f4"}
              />
            </View>
          </View>

          {!hasVariants ? (
            /* Simple Product: Stock + Images */
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Stock & Images
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>
                  Stock Quantity <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor }]}
                  value={String(stock)}
                  onChangeText={(text) => setStock(parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="Enter total stock quantity"
                  placeholderTextColor={placeholderColor}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>
                  Product Images <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.imageGrid}>
                  {productImages.map((uri, imgIndex) => (
                    <View key={imgIndex} style={styles.imageContainer}>
                      {uploads[uri] ? (
                        <ImageUploadProgress upload={uploads[uri]} size={70} />
                      ) : (
                        <Image source={{ uri }} style={styles.imagePreview} />
                      )}
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeProductImage(imgIndex)}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.imagePreview,
                      {
                        justifyContent: "center",
                        alignItems: "center",
                        borderStyle: "dashed",
                        borderWidth: 1.5,
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={handleProductImagePick}
                  >
                    <Ionicons name="add" size={32} color={primaryColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* Variant Product: Color + Size + Stock + Images per variant */
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Product Variants
              </Text>
              {variants.map((variant, index) => {
                const sizes = getSizesForProductType(productType);
                return (
                  <View
                    key={index}
                    style={[styles.variantContainer, { borderColor }]}
                  >
                    <View style={styles.variantHeader}>
                      <Text style={[styles.variantTitle, { color: textColor }]}>
                        Variant {index + 1}
                      </Text>
                      {variants.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeVariant(index)}
                          style={styles.removeVariantButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff3b30"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Color Picker */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: textColor }]}>
                        Color <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.colorPaletteContainer}>
                        {colorPalette.map((color) => (
                          <TouchableOpacity
                            key={color.name}
                            onPress={() => updateVariant(index, "color", color.hex)}
                            style={[
                              styles.colorOption,
                              { backgroundColor: color.hex },
                              variant.color === color.hex && styles.selectedColor,
                            ]}
                          >
                            {variant.color === color.hex && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={
                                  color.hex === "#FFFFFF" || color.hex === "#FDD835"
                                    ? "#000"
                                    : "#fff"
                                }
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                      {variant.color ? (
                        <Text
                          style={{
                            color: placeholderColor,
                            fontSize: 12,
                            marginTop: 6,
                          }}
                        >
                          Selected:{" "}
                          {colorPalette.find((c) => c.hex === variant.color)
                            ?.name || variant.color}
                        </Text>
                      ) : null}
                    </View>

                    {/* Size Picker (if product type has sizes) */}
                    {sizes.length > 0 && (
                      <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: textColor }]}>
                          Size
                        </Text>
                        <View style={styles.colorPaletteContainer}>
                          {sizes.map((size) => (
                            <TouchableOpacity
                              key={size}
                              onPress={() =>
                                updateVariant(index, "size" as any, size)
                              }
                              style={[
                                {
                                  paddingHorizontal: 14,
                                  paddingVertical: 8,
                                  borderWidth: 1.5,
                                  borderColor:
                                    variant.size === size
                                      ? primaryColor
                                      : borderColor,
                                  backgroundColor:
                                    variant.size === size
                                      ? primaryColor
                                      : "transparent",
                                  borderRadius: 8,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color:
                                    variant.size === size ? "#fff" : textColor,
                                  fontWeight: "600",
                                  fontSize: 14,
                                }}
                              >
                                {size}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Variant Images */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: textColor }]}>
                        Images <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.imageGrid}>
                        {(variant.variantImages || []).map(
                          (uri: string, imgIdx: number) => (
                            <View key={imgIdx} style={styles.imageContainer}>
                              {uploads[uri] ? (
                                <ImageUploadProgress
                                  upload={uploads[uri]}
                                  size={70}
                                />
                              ) : (
                                <Image source={{ uri }} style={styles.imagePreview} />
                              )}
                              <TouchableOpacity
                                onPress={() => {
                                  const newV = [...variants];
                                  newV[index].variantImages = (
                                    newV[index].variantImages || []
                                  ).filter((_: any, i: number) => i !== imgIdx);
                                  setVariants(newV);
                                }}
                                style={styles.removeImageButton}
                              >
                                <Ionicons name="close" size={14} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          ),
                        )}
                        <TouchableOpacity
                          style={[
                            styles.imagePreview,
                            {
                              justifyContent: "center",
                              alignItems: "center",
                              borderStyle: "dashed",
                              borderWidth: 1.5,
                              borderColor: primaryColor,
                            },
                          ]}
                          onPress={() => handleVariantImagePick(index)}
                        >
                          <Ionicons name="add" size={32} color={primaryColor} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Variant Stock */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: textColor }]}>
                        Stock <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[styles.input, { color: textColor, borderColor }]}
                        value={String(variant.stock || 0)}
                        onChangeText={(text) =>
                          updateVariant(index, "stock", parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                        placeholder="Stock for this variant"
                        placeholderTextColor={placeholderColor}
                      />
                    </View>
                  </View>
                );
              })}
              <TouchableOpacity
                onPress={addVariant}
                style={[styles.addVariantButton, { borderColor: primaryColor }]}
              >
                <Text style={[styles.addVariantText, { color: primaryColor }]}>
                  + Add Another Variant
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status & Visibility */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Status & Visibility
            </Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Product Status
              </Text>
              <Dropdown
                data={Object.values(ProductStatus).map((s) => ({
                  label: s.toUpperCase(),
                  value: s,
                }))}
                labelField="label"
                valueField="value"
                value={status}
                onChange={(item) => setStatus(item.value as ProductStatus)}
                style={[styles.dropdown, { borderColor }]}
                placeholderStyle={{ color: placeholderColor }}
                selectedTextStyle={{ color: textColor }}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Featured Product
              </Text>
              <Switch
                value={isFeatured}
                onValueChange={setIsFeatured}
                trackColor={{ true: primaryColor }}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              submitting && styles.createButtonDisabled,
              { backgroundColor: primaryColor },
            ]}
            onPress={handleUpdateProduct}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Save Product Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  required: { color: "#ff3b30" },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  rowContainer: { flexDirection: "row", gap: 10 },
  halfWidth: { flex: 1 },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  variantContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  variantTitle: { fontWeight: "600" },
  colorPaletteContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedColor: { borderWidth: 3, borderColor: "#000" },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  imagePickerText: { color: "#fff", fontWeight: "600" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageContainer: { position: "relative" },
  imagePreview: { width: 70, height: 70, borderRadius: 8 },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeVariantButton: {
    padding: 8,
  },
  addVariantButton: {
    height: 50,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addVariantText: { fontWeight: "600" },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  createButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

export default EditProductScreen;
