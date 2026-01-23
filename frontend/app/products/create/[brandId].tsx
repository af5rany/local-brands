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
import { ProductVariant } from "@/types/product";
import { useAuth } from "@/context/AuthContext";

const productTypeOptions = [
  { label: "Shoes", value: "Shoes" },
  { label: "Hoodies", value: "Hoodies" },
  { label: "Shirts", value: "Shirts" },
  { label: "Accessories", value: "Accessories" },
];

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

const subcategoryOptions = {
  Hoodies: ["Pullover", "Zip-up", "Oversized", "Cropped"],
  Shoes: ["Sneakers", "Boots", "Sandals", "Formal"],
  Shirts: ["T-Shirt", "Button-up", "Tank Top", "Long Sleeve"],
  Accessories: ["Bags", "Hats", "Jewelry", "Belts"],
};

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
  const [gender, setGender] = useState("");
  const [season, setSeason] = useState(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

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
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Variants - simplified approach for the form
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: "", variantImages: [] },
  ]);

  const [stock, setStock] = useState(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // console.log("variants", variants);
  }, [variants]);

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
    setVariants([...variants, { color: "", variantImages: [] }]);
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

  const uploadSingleImageToCloudinary = async (
    imageUri: string
  ): Promise<string | null> => {
    const formData = new FormData();
    const filename = imageUri.split("/").pop();

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type: "image/jpeg",
    } as any);
    formData.append("upload_preset", "UnsignedPreset");
    formData.append("cloud_name", "dg4l2eelg");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data.secure_url;
      } else {
        throw new Error(data?.message || "Image upload failed.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleVariantImagePick = async (index: number) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access camera roll is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const updatedVariants = [...variants];

      // Step 1: Immediately add local URIs to show images in UI
      const localUris = result.assets.map((asset) => asset.uri);
      const startIndex = updatedVariants[index].variantImages.length;

      updatedVariants[index].variantImages = [
        ...updatedVariants[index].variantImages,
        ...localUris,
      ];

      // Update state immediately with local images
      setVariants(updatedVariants);

      // Step 2: Upload each image and replace local URI with cloud URL
      const uploadPromises = result.assets.map(async (asset, assetIndex) => {
        const imageIndex = startIndex + assetIndex;

        try {
          const cloudUrl = await uploadSingleImageToCloudinary(asset.uri);

          if (cloudUrl) {
            // Replace the specific local URI with cloud URL
            setVariants((currentVariants) => {
              const newVariants = [...currentVariants];
              newVariants[index].variantImages[imageIndex] = cloudUrl;
              return newVariants;
            });
            return { success: true, imageIndex, cloudUrl };
          } else {
            throw new Error("Upload returned null URL");
          }
        } catch (error) {
          console.error(`22 Error uploading image ${assetIndex + 1}:`, error);

          // Remove the failed image from the array
          setVariants((currentVariants) => {
            const newVariants = [...currentVariants];
            // Remove the image at the specific index
            newVariants[index].variantImages.splice(imageIndex, 1);
            return newVariants;
          });

          return { success: false, imageIndex, error };
        }
      });

      // Wait for all uploads to complete
      try {
        const results = await Promise.all(uploadPromises);
        // console.log("Image Picker Result:", results);
        const successCount = results[0];

        if (!successCount.success) {
          Alert.alert("Upload Status", `Error uploading image`);
        }
      } catch (error) {
        console.error("Error in upload process:", error);
      }
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
      variants.some((v) => !v.color || !v.variantImages.length)
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
        isActive,
        isFeatured,
        stock: stock,
        brandId,
        variants,
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
              data={productTypeOptions}
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
            <Text style={styles.label}>Subcategory</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter subcategory"
              placeholderTextColor={placeholderColor}
              value={subcategory}
              onChangeText={setSubcategory}
            />
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
                  {/* Color Palette */}
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
                  Related Image <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => handleVariantImagePick(index)}
                >
                  <Ionicons name="camera" size={20} color="#ffffff" />
                  <Text style={styles.imagePickerText}>Upload Image</Text>
                </TouchableOpacity>
                {variant.variantImages.length > 0 && (
                  <View style={styles.imageGrid}>
                    {variant.variantImages.map((imageUri, imageIndex) => {
                      const isUploading = imageUri.startsWith("file://");

                      return (
                        <View key={imageIndex} style={styles.imageContainer}>
                          <Image
                            source={{ uri: imageUri }}
                            style={[
                              styles.imagePreview,
                              isUploading && styles.uploadingImage,
                            ]}
                          />

                          {isUploading && (
                            <View style={styles.loadingOverlay}>
                              <ActivityIndicator size="small" color="#ffffff" />
                            </View>
                          )}

                          <TouchableOpacity
                            style={[
                              styles.removeImageButton,
                              isUploading && styles.disabledButton,
                            ]}
                            onPress={() =>
                              !isUploading &&
                              removeVariantImage(index, imageIndex)
                            }
                            disabled={isUploading}
                          >
                            <Ionicons
                              name="close"
                              size={16}
                              color={isUploading ? "#cccccc" : "#ffffff"}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
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

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Active Product</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: placeholderColor, true: primaryColor }}
              thumbColor={isActive ? "#ffffff" : "#f4f3f4"}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateProductScreen;
