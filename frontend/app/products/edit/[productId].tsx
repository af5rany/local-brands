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
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { Dropdown } from "react-native-element-dropdown";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/product";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
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

const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  Shoes: ["shoe", "sneaker", "boot", "sandal", "loafer", "heel", "slipper", "moccasin", "oxford", "derby", "trainer"],
  Hoodies: ["hoodie", "sweatshirt", "pullover"],
  Shirts: ["shirt", "tee", "t-shirt", "polo", "blouse", "top", "tank", "tshirt"],
  Pants: ["pant", "jean", "trouser", "short", "legging", "jogger", "chino", "cargo", "sweatpant"],
  Jackets: ["jacket", "coat", "blazer", "bomber", "windbreaker", "parka", "vest", "gilet", "cardigan"],
  Bags: ["bag", "backpack", "tote", "purse", "clutch", "duffle", "duffel", "satchel", "messenger"],
  Hats: ["hat", "cap", "beanie", "visor", "fedora", "beret", "snapback", "bucket"],
  Accessories: ["watch", "belt", "scarf", "glove", "wallet", "sunglasses", "bracelet", "necklace", "ring", "earring", "keychain", "tie", "socks"],
  "T-Shirts": ["tshirt", "t-shirt", "tee"],
};

function detectProductType(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [type, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}s?\\b`, "i");
      if (regex.test(lower)) return type;
    }
  }
  return null;
}

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
  const [productImages, setProductImages] = useState<string[]>([]);
  const [color, setColor] = useState("");
  const [sizeVariants, setSizeVariants] = useState<{ size: string; stock: number }[]>([]);
  const [stock, setStock] = useState(0);
  const [brandId, setBrandId] = useState<number | null>(null);

  const [autoDetectedType, setAutoDetectedType] = useState(false);

  const { uploads, uploadImage, pickAndUpload, isUploading } = useCloudinaryUpload();

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
      setProductImages((data.images || []).filter(Boolean));
      setColor(data.color || "");
      if (data.variants && data.variants.length > 0) {
        const seen = new Set<string>();
        const deduped: { size: string; stock: number }[] = [];
        for (const v of data.variants) {
          const s = v.size || "";
          if (!seen.has(s)) {
            seen.add(s);
            deduped.push({ size: s, stock: v.stock || 0 });
          }
        }
        setSizeVariants(deduped);
      } else {
        setSizeVariants([]);
      }
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

  const handleProductNameChange = useCallback((name: string) => {
    setProductName(name);
    const detected = detectProductType(name);
    if (detected && !productType) {
      setProductType(detected);
      setAutoDetectedType(true);
    }
  }, [productType]);

  const handleProductTypeChange = useCallback((value: string) => {
    setProductType(value);
    setAutoDetectedType(false);
    setSizeVariants([]);
  }, []);

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

    if (productImages.length === 0) {
      Alert.alert("Validation Error", "Please add at least one product image.");
      return;
    }

    if (isUploading) {
      Alert.alert(
        "Please wait",
        "Please wait for images to finish uploading.",
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

      productData.color = color || null;
      productData.images = productImages;

      if (sizeVariants.length > 0) {
        productData.variants = sizeVariants.map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        }));
        productData.stock = sizeVariants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
      } else {
        productData.stock = Number(stock);
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

  const sizes = getSizesForProductType(productType);
  const hasSizes = sizes.length > 0;

  const toggleSizeVariant = (size: string) => {
    setSizeVariants((prev) => {
      const existing = prev.find((v) => v.size === size);
      if (existing) return prev.filter((v) => v.size !== size);
      return [...prev, { size, stock: 0 }];
    });
  };

  const updateSizeStock = (size: string, stockVal: number) => {
    setSizeVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, stock: stockVal } : v)),
    );
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
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
      {/* Nav header */}
      <View style={[styles.navHeader, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={[styles.backCircle, { backgroundColor: cardBackground }]}>
            <Ionicons name="chevron-back" size={22} color={textColor} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: textColor }]}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>
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
                onChangeText={handleProductNameChange}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>
                  Product Type <Text style={styles.required}>*</Text>
                </Text>
                {autoDetectedType && (
                  <View style={{ backgroundColor: "#000000", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 0 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Auto-detected</Text>
                  </View>
                )}
              </View>
              <Dropdown
                data={dynamicProductTypes}
                labelField="label"
                valueField="value"
                value={productType}
                onChange={(item) => handleProductTypeChange(item.value)}
                style={[styles.dropdown, { borderColor, marginTop: 8 }]}
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

          {/* Color & Images */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Color & Images
            </Text>

            {/* Color Picker */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Color</Text>
              <View style={styles.colorPaletteContainer}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c.hex },
                      color === c.hex && styles.selectedColor,
                    ]}
                    onPress={() => setColor(color === c.hex ? "" : c.hex)}
                  >
                    {color === c.hex && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={c.hex === "#FFFFFF" || c.hex === "#FDD835" ? "#000" : "#fff"}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {color ? (
                <Text style={{ color: placeholderColor, fontSize: 12, marginTop: 6 }}>
                  Selected: {COLOR_PALETTE.find((c) => c.hex === color)?.name || color}
                </Text>
              ) : null}
            </View>

            {/* Product Images */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>
                Product Images <Text style={{ color: "#ff3b30" }}>*</Text>
              </Text>
              <View style={styles.imageGrid}>
                {productImages.map((uri, imgIndex) => (
                  <View key={imgIndex} style={styles.imageContainer}>
                    {uploads[uri] ? (
                      <ImageUploadProgress upload={uploads[uri]} size={80} />
                    ) : (
                      <Image source={{ uri }} style={styles.imagePreview} />
                    )}
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeProductImage(imgIndex)}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
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

          {/* Size & Stock */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {hasSizes ? "Sizes & Stock" : "Stock"}
            </Text>

            {hasSizes ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: textColor }]}>
                    Select Available Sizes <Text style={{ color: "#ff3b30" }}>*</Text>
                  </Text>
                  <View style={styles.colorPaletteContainer}>
                    {sizes.map((size) => {
                      const isSelected = sizeVariants.some((v) => v.size === size);
                      return (
                        <TouchableOpacity
                          key={size}
                          onPress={() => toggleSizeVariant(size)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderWidth: 1.5,
                            borderColor: isSelected ? primaryColor : borderColor,
                            backgroundColor: isSelected ? primaryColor : "transparent",
                            borderRadius: 0,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 14,
                              color: isSelected ? "#fff" : textColor,
                            }}
                          >
                            {size}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {sizeVariants.length > 0 && (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: textColor }]}>Stock per Size</Text>
                    {sizeVariants.map((sv, idx) => (
                      <View
                        key={`${sv.size}-${idx}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 8,
                          paddingHorizontal: 4,
                          borderBottomWidth: 1,
                          borderBottomColor: borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "600", color: textColor, width: 60 }}>
                          {sv.size}
                        </Text>
                        <TextInput
                          style={[styles.input, { flex: 1, marginLeft: 12, minHeight: 44 }]}
                          placeholder="Stock quantity"
                          placeholderTextColor={placeholderColor}
                          value={String(sv.stock)}
                          onChangeText={(text) => updateSizeStock(sv.size, parseInt(text) || 0)}
                          keyboardType="numeric"
                        />
                      </View>
                    ))}
                    <Text
                      style={{
                        color: placeholderColor,
                        fontSize: 13,
                        marginTop: 8,
                        textAlign: "right",
                      }}
                    >
                      Total stock: {sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: textColor }]}>
                  Stock Quantity <Text style={{ color: "#ff3b30" }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total stock quantity"
                  placeholderTextColor={placeholderColor}
                  value={String(stock)}
                  onChangeText={(text) => setStock(parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

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
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 2 },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: { fontSize: 16, fontWeight: "700", // letterSpacing: 0.2 
},
  scrollContainer: { padding: 20, paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  required: { color: "#ff3b30" },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  rowContainer: { flexDirection: "row", gap: 10 },
  halfWidth: { flex: 1 },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 15,
  },
  colorPaletteContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedColor: { borderWidth: 3, borderColor: "#000" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageContainer: { position: "relative" },
  imagePreview: { width: 70, height: 70, borderRadius: 0 },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 0,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  createButton: {
    height: 55,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

export default EditProductScreen;
