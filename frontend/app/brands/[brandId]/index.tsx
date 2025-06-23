import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Button,
} from "react-native";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import ProductCard from "@/components/ProductCard"; // Import the ProductCard component

type BrandDetail = {
  id: number;
  name: string;
  logo: string | null;
  description: string;
  products: { id: string; name: string; imageUrls: string[]; price: number }[];
};

const BrandDetailScreen = () => {
  const router = useRouter();
  const { brandId } = useLocalSearchParams();
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrandDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${getApiUrl()}/brands/${brandId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch brand details");
        }
        const data = await response.json();
        setBrand(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (brandId) {
      fetchBrandDetails();
    }
  }, [brandId]);

  if (loading) {
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#346beb" />
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={styles.center}>
        <Text>Brand not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.brandHeader}>
        {brand.logo ? (
          <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
        ) : null}
        <Text style={styles.brandName}>{brand.name}</Text>
        <Text style={styles.brandDescription}>{brand.description}</Text>
      </View>

      <Button
        title="Create New Product"
        onPress={() => router.push(`/brands/${brand.id}/create`)} // Navigate to create product screen
      />

      <Text style={styles.productsTitle}>Products</Text>
      <FlatList
        data={brand.products}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <ProductCard
            name={item.name}
            imageUrls={item.imageUrls}
            price={item.price}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  brandHeader: { alignItems: "center", marginBottom: 20 },
  brandLogo: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  brandName: { fontSize: 24, fontWeight: "bold" },
  brandDescription: { fontSize: 16, color: "#666", textAlign: "center" },
  productsTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
});

export default BrandDetailScreen;
