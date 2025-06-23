import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NavigationProp, useRoute } from "@react-navigation/native";
import getApiUrl from "@/helpers/getApiUrl";
import { Dropdown } from "react-native-element-dropdown";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

const productTypeOptions = [
  { label: "Shoes", value: "Shoes" },
  { label: "Hoodies", value: "Hoodies" },
  { label: "Shirts", value: "Shirts" },
  { label: "Accessories", value: "Accessories" },
];

type RootStackParamList = {
  BrandDetail: { brandId: string };
};

const CreateProductScreen = () => {
  const router = useRouter();
  const route = useRoute<any>();
  const { brandId } = route.params;

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productImages, setProductImages] = useState<any[]>([]); // To store image URIs
  const [productType, setProductType] = useState(""); // Product type
  const [subcategory, setSubcategory] = useState(""); // Optional subcategory
  const [loading, setLoading] = useState(false); // Add loading state

  // Allow user to pick multiple images
  const handleImagePick = async () => {
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
      selectionLimit: 5, // Limit to 5 images
    });

    if (!result.canceled && result.assets) {
      setProductImages(result.assets); // Set selected images
    }
  };

  // Upload multiple images to Cloudinary
  const uploadToCloudinary = async () => {
    const formData = new FormData();
    let urls = [];

    for (let i = 0; i < productImages.length; i++) {
      const filename = productImages[i].uri.split("/").pop();
      formData.append("file", {
        uri: productImages[i].uri,
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
          urls.push(data.secure_url); // Push each URL
        } else {
          throw new Error(data?.message || "Image upload failed.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", "An error occurred while uploading the images.");
      }
    }
    return urls;
  };

  const handleCreateProduct = async () => {
    if (
      !productName ||
      !productPrice ||
      productImages.length === 0 ||
      !productType
    ) {
      Alert.alert("All fields are required");
      return;
    }

    setLoading(true); // Start loading

    try {
      const imageUrls = await uploadToCloudinary(); // Upload all selected images

      const productData = {
        name: productName,
        price: parseFloat(productPrice),
        imageUrls: imageUrls, // Store image URLs
        productType: productType,
        subcategory: subcategory,
        brandId: brandId,
      };

      const response = await fetch(`${getApiUrl()}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.status === 201) {
        Alert.alert("Success", "Product created successfully!");
        // router.push("/brands", { brandId: brandId });
      }
    } catch (error) {
      console.error("Error creating product:", error);
      Alert.alert("Error", "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create New Product</Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
        placeholderTextColor="#A0A0A0"
      />
      <TextInput
        style={styles.input}
        placeholder="Product Price"
        value={productPrice}
        onChangeText={setProductPrice}
        keyboardType="numeric"
        placeholderTextColor="#A0A0A0"
      />

      {/* Image upload button */}
      <Button title="Select Images" onPress={handleImagePick} />

      {/* Display selected images */}
      {/* <FlatList
        data={productImages}
        keyExtractor={(item, index) => String(index)}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={styles.imagePreview} />
        )}
      /> */}

      {/* Dropdown for Product Type */}
      <Dropdown
        labelField="label"
        valueField="value"
        data={productTypeOptions}
        value={productType}
        onChange={(item) => setProductType(item.value)}
        placeholder="Select Product Type"
        searchPlaceholder="Search product types..."
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
      />

      {/* Optional Subcategory Field */}
      <TextInput
        style={styles.input}
        placeholder="Subcategory (Optional)"
        value={subcategory}
        onChangeText={setSubcategory}
        placeholderTextColor="#A0A0A0"
      />

      <Button
        title={loading ? "Creating Product..." : "Create Product"}
        onPress={handleCreateProduct}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  dropdown: {
    height: 45,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  placeholderStyle: {
    color: "#A0A0A0",
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
});

export default CreateProductScreen;
