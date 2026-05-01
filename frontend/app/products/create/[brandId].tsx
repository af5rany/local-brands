import React, { useEffect, useState, useCallback, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { Dropdown } from "react-native-element-dropdown";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
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

const colorPalette = COLOR_PALETTE;

// Auto-detect product type from name
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
      // Match whole word boundaries
      const regex = new RegExp(`\\b${kw}s?\\b`, "i");
      if (regex.test(lower)) return type;
    }
  }
  return null;
}

const CreateProductScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { incrementProductListVersion } = useBrand();
  const { brandId } = useLocalSearchParams();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Basic Information
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [productType, setProductType] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [isNewSubcategory, setIsNewSubcategory] = useState(false);
  const [gender, setGender] = useState("");
  const [season, setSeason] = useState(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Dynamic Options State
  const [dynamicProductTypes, setDynamicProductTypes] = useState<
    { label: string; value: string }[]
  >([]);
  const [dynamicCategories, setDynamicCategories] = useState<
    { label: string; value: string }[]
  >([]);

  // Product Details
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [origin, setOrigin] = useState("");

  // Dimensions and Weight
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Status
  const [status, setStatus] = useState<ProductStatus | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);

  // Color (product-level)
  const [color, setColor] = useState("");

  // Images (product-level, always)
  const [productImages, setProductImages] = useState<string[]>([]);

  // Stock (for products without size variants)
  const [stock, setStock] = useState(0);

  // Size variants: { size: string, stock: number }[]
  const [sizeVariants, setSizeVariants] = useState<{ size: string; stock: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [autoDetectedType, setAutoDetectedType] = useState(false);

  const { uploads, uploadImage } = useCloudinaryUpload();

  // Auto-detect product type from name
  const handleProductNameChange = useCallback((name: string) => {
    setProductName(name);
    const detected = detectProductType(name);
    if (detected) {
      setProductType(detected);
      setAutoDetectedType(true);
      // Clear size variants when type changes (sizes differ per type)
      setSizeVariants([]);
    }
  }, []);

  // Reset auto-detected flag when user manually changes type
  const handleProductTypeChange = useCallback((value: string) => {
    setProductType(value);
    setAutoDetectedType(false);
    // Clear size variants when type changes (sizes differ per type)
    setSizeVariants([]);
  }, []);

  // Fetch Dynamic Options
  useEffect(() => {
    const fetchOptions = async () => {
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
            (data.categories || []).map((c: string) => ({
              label: c,
              value: c,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const sizes = getSizesForProductType(productType);
  const hasSizes = sizes.length > 0;

  const toggleSizeVariant = (size: string) => {
    setSizeVariants((prev) => {
      const existing = prev.find((v) => v.size === size);
      if (existing) {
        return prev.filter((v) => v.size !== size);
      }
      return [...prev, { size, stock: 0 }];
    });
  };

  const updateSizeStock = (size: string, stockVal: number) => {
    setSizeVariants((prev) =>
      prev.map((v) => (v.size === size ? { ...v, stock: stockVal } : v)),
    );
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

  const handleProductImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
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

  const hasNonCloudinaryImage = productImages.some(
    (uri) => !uri.startsWith("https://res.cloudinary."),
  );

  const handleCreateProduct = async () => {
    if (hasNonCloudinaryImage) {
      Alert.alert("Please wait", "Please wait for images to get uploaded");
      return;
    }

    if (!productName || !productPrice || !productType || !gender || !status) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    if (productImages.length === 0) {
      Alert.alert("Validation Error", "Please add at least one product image.");
      return;
    }

    if (salePrice && parseFloat(salePrice) >= parseFloat(productPrice)) {
      Alert.alert(
        "Validation Error",
        "Sale price must be less than the regular price.",
      );
      return;
    }

    if (hasSizes && sizeVariants.length === 0) {
      Alert.alert("Validation Error", "Please select at least one size.");
      return;
    }

    setLoading(true);

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
        weight: weight ? parseFloat(weight) : undefined,
        length: length ? parseFloat(length) : undefined,
        width: width ? parseFloat(width) : undefined,
        height: height ? parseFloat(height) : undefined,
        status,
        isFeatured,
        brandId: parseInt(brandId as string),
        color: color || null,
        images: productImages,
      };

      if (hasSizes && sizeVariants.length > 0) {
        productData.variants = sizeVariants.map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        }));
        productData.stock = sizeVariants.reduce(
          (acc, v) => acc + (Number(v.stock) || 0),
          0,
        );
      } else {
        productData.stock = Number(stock);
      }

      const response = await fetch(`${getApiUrl()}/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const responseData = await response.json();

      if (response.status === 201) {
        incrementProductListVersion();
        Alert.alert("Success", "Product created successfully!");
        router.replace(`/brands/${brandId}`);
      } else {
        throw new Error(responseData?.message || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      Alert.alert("Error", "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Nav header */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={[styles.backCircle, { backgroundColor: colors.surfaceRaised }]}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Create Product</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && (
        <View style={styles.screenOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Creating product…</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Create New Product</Text>

        {/* Basic Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Product Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor={colors.textSecondary}
              value={productName}
              onChangeText={handleProductNameChange}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed product description"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                Price ($) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Sale Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={styles.label}>
                Product Type <Text style={styles.required}>*</Text>
              </Text>
              {autoDetectedType && productType ? (
                <View style={styles.autoDetectBadge}>
                  <Text style={styles.autoDetectText}>Auto-detected</Text>
                </View>
              ) : null}
            </View>
            <Dropdown
              labelField="label"
              valueField="value"
              data={dynamicProductTypes}
              value={productType}
              onChange={(item) => handleProductTypeChange(item.value)}
              placeholder="Select Product Type"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              style={styles.dropdown}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                Gender <Text style={styles.required}>*</Text>
              </Text>
              <Dropdown
                labelField="label"
                valueField="value"
                data={genderOptions}
                value={gender}
                onChange={(item) => setGender(item.value)}
                placeholder="Select Gender"
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                style={styles.dropdown}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Season</Text>
              <Dropdown
                labelField="label"
                valueField="value"
                data={seasonOptions}
                value={season}
                onChange={(item) => setSeason(item.value || null)}
                placeholder="Select Season"
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                style={styles.dropdown}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsNewSubcategory(!isNewSubcategory);
                  setSubcategory("");
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                  {isNewSubcategory ? "Select Existing" : "Type New"}
                </Text>
              </TouchableOpacity>
            </View>
            {isNewSubcategory ? (
              <TextInput
                style={styles.input}
                placeholder="Enter new category"
                placeholderTextColor={colors.textSecondary}
                value={subcategory}
                onChangeText={setSubcategory}
              />
            ) : (
              <Dropdown
                labelField="label"
                valueField="value"
                data={dynamicCategories}
                value={subcategory}
                onChange={(item) => setSubcategory(item.value)}
                placeholder="Select Category"
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownText}
                style={styles.dropdown}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter tags (press Enter to add)"
              placeholderTextColor="#8e8e93"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={(e) => handleTagInput(e.nativeEvent.text)}
            />
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => handleRemoveTag(index)}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.removeTagText}>X</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color & Images */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Color & Images</Text>

          {/* Color Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorPaletteContainer}>
              {colorPalette.map((c) => (
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
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
                Selected: {colorPalette.find((c) => c.hex === color)?.name || color}
              </Text>
            ) : null}
          </View>

          {/* Product Images */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Product Images <Text style={styles.required}>*</Text>
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
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleProductImagePick}
              >
                <Ionicons name="add" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Size & Stock */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {hasSizes ? "Sizes & Stock" : "Stock"}
          </Text>

          {hasSizes ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Select Available Sizes <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.colorPaletteContainer}>
                  {sizes.map((size) => {
                    const isSelected = sizeVariants.some((v) => v.size === size);
                    return (
                      <TouchableOpacity
                        key={size}
                        onPress={() => toggleSizeVariant(size)}
                        style={[
                          styles.sizeChip,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary : "transparent",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            { color: isSelected ? "#fff" : colors.text },
                          ]}
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
                  <Text style={styles.label}>Stock per Size</Text>
                  {sizeVariants.map((sv) => (
                    <View key={sv.size} style={styles.sizeStockRow}>
                      <Text style={styles.sizeLabel}>{sv.size}</Text>
                      <TextInput
                        style={styles.sizeStockInput}
                        placeholder="Stock quantity"
                        placeholderTextColor={colors.textSecondary}
                        value={String(sv.stock)}
                        onChangeText={(text) =>
                          updateSizeStock(sv.size, parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginTop: 8,
                      textAlign: "right",
                    }}
                  >
                    Total stock:{" "}
                    {sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Stock Quantity <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total stock quantity"
                placeholderTextColor={colors.textSecondary}
                value={String(stock)}
                onChangeText={(text) => setStock(parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Material</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100% Cotton, Polyester Blend"
              placeholderTextColor={colors.textSecondary}
              value={material}
              onChangeText={setMaterial}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Care Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Machine wash cold, tumble dry low"
              placeholderTextColor={colors.textSecondary}
              value={careInstructions}
              onChangeText={setCareInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Origin/Made In</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Made in USA, China"
              placeholderTextColor={colors.textSecondary}
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
        </View>

        {/* Dimensions & Weight */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor={colors.textSecondary}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Length (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor={colors.textSecondary}
                value={length}
                onChangeText={setLength}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Width (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.0"
                placeholderTextColor={colors.textSecondary}
                value={width}
                onChangeText={setWidth}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor={colors.textSecondary}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Status & Visibility */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status & Visibility</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Product Status <Text style={styles.required}>*</Text>
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
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
            />
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Featured Product</Text>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={isFeatured ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateProduct}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.loadingText}>Creating Product...</Text>
            </>
          ) : (
            <Text style={styles.createButtonText}>Create Product</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    navHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    navTitle: { fontSize: 16, fontWeight: "700" },
    screenOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 999,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    overlayText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    scrollContainer: { padding: 16, paddingBottom: 60 },
    header: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
      textTransform: "uppercase",
    },
    inputContainer: { marginBottom: 14 },
    label: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    required: { color: colors.danger },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surfaceRaised,
    },
    textArea: { height: 100, paddingTop: 12, textAlignVertical: "top" },
    rowContainer: { flexDirection: "row", gap: 12 },
    halfWidth: { flex: 1 },
    dropdown: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      backgroundColor: colors.surfaceRaised,
    },
    dropdownPlaceholder: { fontSize: 14, color: colors.textSecondary },
    dropdownText: { fontSize: 14, color: colors.text },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    createButton: {
      height: 52,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
      marginBottom: 32,
    },
    createButtonDisabled: { opacity: 0.5 },
    createButtonText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: "800",
    },
    loadingText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    autoDetectBadge: {
      marginLeft: 8,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    autoDetectText: { fontSize: 10, color: colors.textSecondary, fontWeight: "600" },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -4 },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: { fontSize: 12, color: colors.text, fontWeight: "500" },
    removeTagText: { fontSize: 10, color: colors.textSecondary, fontWeight: "700" },
    colorPaletteContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    colorOption: {
      width: 36,
      height: 36,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedColor: { borderWidth: 2, borderColor: colors.text },
    imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    imageContainer: { width: 80, height: 80, position: "relative" },
    imagePreview: { width: 80, height: 80, backgroundColor: colors.surfaceRaised },
    removeImageButton: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
    },
    sizeChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
    sizeChipText: { fontSize: 12, fontWeight: "600" },
    sizeStockRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    sizeLabel: { width: 50, fontSize: 13, fontWeight: "700", color: colors.text },
    sizeStockInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surfaceRaised,
    },
  });

export default CreateProductScreen;
