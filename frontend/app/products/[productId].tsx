// screens/products/ProductDetailScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import axios from "axios";

type RootStackParamList = {
  ProductDetail: { productId: string };
};

type ProductDetailRouteProp = RouteProp<RootStackParamList, "ProductDetail">;

interface ProductDetail {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
  // add other product fields as needed
}

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your actual API endpoint from Payload CMS
    axios
      .get<ProductDetail>(`https://your-cms-api.com/products/${productId}`)
      .then((response) => {
        setProduct(response.data);
      })
      .catch((error) => {
        console.error("Error fetching product details:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  productImage: { width: "100%", height: 300 },
  infoContainer: { padding: 16 },
  productName: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  productPrice: { fontSize: 20, color: "#888", marginBottom: 12 },
  productDescription: { fontSize: 16, color: "#333" },
});

export default ProductDetailScreen;
