import React, { useEffect, useState } from "react";
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
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { ProductVariant } from "@/types/product";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { ImageUploadProgress } from "@/components/ImageUploadProgress";
import * as ImageManipulator from "expo-image-manipulator";
import { ProductStatus } from "@/types/enums";


// Remove hardcoded productTypeOptions and subcategoryOptions


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

const colorPalette = [
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
];

// Gender/Season/Color remain static for now (or could be dynamic later)


const CreateProductScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { brandId } = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#e1e5e9", dark: "#38383a" },
    "text"
  );
  const primaryColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "tint"
  );
  const placeholderColor = useThemeColor(
    { light: "#8e8e93", dark: "#8e8e93" },
    "text"
  );

  // Basic Information
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  // const [productImages, setProductImages] = useState<any[]>([]);
  const [productType, setProductType] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [isNewSubcategory, setIsNewSubcategory] = useState(false);

  const [gender, setGender] = useState("");
  const [season, setSeason] = useState(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Dynamic Options State
  const [dynamicProductTypes, setDynamicProductTypes] = useState<{ label: string; value: string }[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<{ label: string; value: string }[]>([]);

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
  const [status, setStatus] = useState<ProductStatus>(ProductStatus.DRAFT);
  const [isFeatured, setIsFeatured] = useState(false);

  // Variants - simplified approach for the form
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: "", variantImages: [], stock: 0 },
  ]);

  const [stock, setStock] = useState(0);

  const [loading, setLoading] = useState(false);

  const { uploads, uploadImage, pickAndUpload } = useCloudinaryUpload();

  useEffect(() => {
    // console.log("variants", variants);
  }, [variants]);

  // Fetch Dynamic Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/products/filters`);
        if (response.ok) {
          const data = await response.json();
          // Map to dropdown format
          setDynamicProductTypes(
            (data.productTypes || []).map((t: string) => ({ label: t, value: t }))
          );
          setDynamicCategories(
            (data.categories || []).map((c: string) => ({ label: c, value: c }))
          );
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);


  const handleTagInput = (text: string) => {
    if (text.trim() && !tags.includes(text.trim())) {
      setTags([...tags, text.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...variants];

    updatedVariants[variantIndex].variantImages = updatedVariants[
      variantIndex
    ].variantImages.filter((_, i) => i !== imageIndex);

    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { color: "", variantImages: [], stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const handleVariantImagePick = async (index: number) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (result.canceled || !result.assets) return;

      const updatedVariants = [...variants];
      const startIndex = updatedVariants[index].variantImages.length;

      // Add local URIs immediately
      const newLocalUris = result.assets.map(a => a.uri);
      updatedVariants[index].variantImages = [...updatedVariants[index].variantImages, ...newLocalUris];
      setVariants(updatedVariants);

      // Start uploading each and update variants state when done
      result.assets.forEach(async (asset, assetIndex) => {
        const cloudUrl = await uploadImage(asset.uri);
        if (cloudUrl) {
          setVariants(currentVariants => {
            const newVariants = [...currentVariants];
            const imgIndex = startIndex + assetIndex;
            // Only update if it's still there (user might have removed it manually)
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

  const hasNonCloudinaryImage = variants.some((variant) =>
    variant.variantImages.some(
      (uri) => !uri.startsWith("https://res.cloudinary.")
    )
  );

  const handleCreateProduct = async () => {
    if (hasNonCloudinaryImage) {
      Alert.alert("Please wait", "Please wait for images to get uploaded");
      return;
    }

    if (
      !productName ||
      !productPrice ||
      !productType ||
      !gender ||
      variants.some((v) => !v.color || !v.variantImages.length || v.stock === undefined)
    ) {
      Alert.alert(
        "Validation Error",
        "Please fill in all required fields and ensure all variants color have images"
      );
      return;
    }
    setLoading(true);

    try {
      const productData = {
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
        weight: parseFloat(weight),
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        status,
        isFeatured,
        stock: variants.reduce((acc, v) => acc + (v.stock || 0), 0),
        brandId: parseInt(brandId as string),
        variants: variants.map(v => ({
          ...v,
          stock: Number(v.stock)
        })),
      };

      console.log("Product Data:", JSON.stringify(productData));

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
        Alert.alert("Success", "Product created successfully!");
        // router.replace({
        //   pathname: `..`,
        //   params: { refresh: "true" },
        // });
        router.replace(`/brands/${brandId}`);
        router.replace(`..`);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      fontSize: 32,
      fontWeight: "700",
      color: textColor,
      marginBottom: 30,
      textAlign: "center",
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
      marginBottom: 8,
    },
    required: {
      color: "#ff3b30",
    },
    input: {
      minHeight: 52,
      borderColor: borderColor,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: cardBackground,
      color: textColor,
      textAlignVertical: "top",
    },
    textArea: {
      minHeight: 100,
    },
    dropdown: {
      height: 52,
      borderColor: borderColor,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: cardBackground,
    },
    dropdownText: {
      fontSize: 16,
      color: textColor,
    },
    dropdownPlaceholder: {
      fontSize: 16,
      color: placeholderColor,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    imagePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: primaryColor,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 15,
    },
    imagePickerText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    imageContainer: {
      position: "relative",
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: cardBackground,
    },
    removeImageButton: {
      position: "absolute",
      top: -5,
      right: -5,
      backgroundColor: "#ff3b30",
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    variantContainer: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    variantHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    variantTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: textColor,
    },
    removeVariantButton: {
      backgroundColor: "#ff3b30",
      borderRadius: 8,
      padding: 8,
    },
    addVariantButton: {
      backgroundColor: primaryColor,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
    },
    addVariantText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
    rowContainer: {
      flexDirection: "row",
      gap: 10,
    },
    halfWidth: {
      flex: 1,
    },
    createButton: {
      backgroundColor: primaryColor,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      flexDirection: "row",
    },
    createButtonDisabled: {
      backgroundColor: placeholderColor,
    },
    createButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "700",
    },
    loadingText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      marginTop: 25,
      marginBottom: 15,
    },
    card: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    colorPaletteContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    selectedColor: {
      borderWidth: 3,
      borderColor: "#E4FDE1",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 10,
    },
    tag: {
      backgroundColor: "#007AFF",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    tagText: {
      color: "#ffffff",
      fontSize: 14,
      marginRight: 6,
    },
    removeTagText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
    uploadingImage: {
      opacity: 0.7,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    uploadingText: {
      color: "#ffffff",
      fontSize: 12,
      marginTop: 4,
      fontWeight: "500",
    },
    disabledButton: {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
    screenOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    overlayText: {
      color: "#fff",
      marginTop: 12,
      fontSize: 16,
      fontWeight: "600",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
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
              placeholderTextColor={placeholderColor}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed product description"
              placeholderTextColor={placeholderColor}
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
                placeholderTextColor={placeholderColor}
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
                placeholderTextColor={placeholderColor}
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Product Type <Text style={styles.required}>*</Text>
            </Text>
            <Dropdown
              labelField="label"
              valueField="value"
              data={dynamicProductTypes}
              value={productType}
              onChange={(item) => setProductType(item.value)}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>
                Category
              </Text>
              <TouchableOpacity onPress={() => {
                setIsNewSubcategory(!isNewSubcategory);
                setSubcategory(""); // Clear when switching
              }}>
                <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>
                  {isNewSubcategory ? "Select Existing" : "Type New"}
                </Text>
              </TouchableOpacity>
            </View>

            {isNewSubcategory ? (
              <TextInput
                style={styles.input}
                placeholder="Enter new category"
                placeholderTextColor={placeholderColor}
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
              value={tagInput} // Bind the TextInput value to the tagInput state
              onChangeText={setTagInput} // Update the state as the user types
              onSubmitEditing={(e) => handleTagInput(e.nativeEvent.text)} // Add tag when Enter is pressed
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Stock Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total stock quantity"
              placeholderTextColor={placeholderColor}
              value={String(stock)}
              onChangeText={(text) => setStock(parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Product Variants */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product Variants</Text>
          {variants.map((variant, index) => (
            <View key={index} style={styles.variantContainer}>
              <View style={styles.variantHeader}>
                <Text style={styles.variantTitle}>Variant {index + 1}</Text>
                {variants.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeVariantButton}
                    onPress={() => removeVariant(index)}
                  >
                    <Ionicons name="trash" size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>
                    Color <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.colorPaletteContainer}>
                    {colorPalette.map((color) => (
                      <TouchableOpacity
                        key={color.name}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color.hex },
                          variant.color === color.hex && styles.selectedColor,
                        ]}
                        onPress={() => updateVariant(index, "color", color.hex)}
                      >
                        {variant.color === color.hex && (
                          <Ionicons
                            name="checkmark"
                            size={24}
                            color="#ffffff"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Related Images <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.imageGrid}>
                  {variant.variantImages.map((uri, imgIndex) => (
                    <View key={imgIndex} style={styles.imageContainer}>
                      {uploads[uri] ? (
                        <ImageUploadProgress upload={uploads[uri]} size={80} />
                      ) : (
                        <Image
                          source={{ uri }}
                          style={styles.imagePreview}
                        />
                      )}
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeVariantImage(index, imgIndex)}
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
                    onPress={() => handleVariantImagePick(index)}
                  >
                    <Ionicons name="add" size={32} color={primaryColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Stock Quantity <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter stock for this variant"
                  placeholderTextColor={placeholderColor}
                  value={String(variant.stock)}
                  onChangeText={(text) => updateVariant(index, "stock", parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addVariantButton}
            onPress={addVariant}
          >
            <Text style={styles.addVariantText}>+ Add Another Variant</Text>
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Material</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100% Cotton, Polyester Blend"
              placeholderTextColor={placeholderColor}
              value={material}
              onChangeText={setMaterial}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Care Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Machine wash cold, tumble dry low"
              placeholderTextColor={placeholderColor}
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
              placeholderTextColor={placeholderColor}
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
              placeholderTextColor={placeholderColor}
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
                placeholderTextColor={placeholderColor}
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
                placeholderTextColor={placeholderColor}
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
              placeholderTextColor={placeholderColor}
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
            <Text style={styles.label}>Product Status</Text>
            <Dropdown
              data={Object.values(ProductStatus).map(s => ({ label: s.toUpperCase(), value: s }))}
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
              trackColor={{ false: placeholderColor, true: primaryColor }}
              thumbColor={isFeatured ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Create Product Button */}
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
      </ScrollView >
    </SafeAreaView >
  );
};

export default CreateProductScreen;
