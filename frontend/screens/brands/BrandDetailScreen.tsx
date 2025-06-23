// screens/brands/BrandDetailScreen.tsx
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
import {
  useRoute,
  RouteProp,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import axios from "axios";
import getApiUrl from "@/helpers/getApiUrl";

type RootStackParamList = {
  BrandDetail: { brandId: string };
  CreateProduct: { brandId: string };
};

type BrandDetailRouteProp = RouteProp<RootStackParamList, "BrandDetail">;

interface BrandDetail {
  id: number;
  name: string;
  logo: string | null;
  description: string;
  // Add a products array if products are available
  products: { id: string; name: string; imageUrl: string; price: number }[];
}

const BrandDetailScreen = () => {
  const { params } = useRoute<BrandDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<BrandDetail>(`${getApiUrl()}/brands/${params.brandId}`)
      .then((res) => setBrand(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [params.brandId]);

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#346beb" />
    );
  if (!brand)
    return (
      <View style={styles.center}>
        <Text>Brand not found.</Text>
      </View>
    );

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
        onPress={() =>
          navigation.navigate("CreateProduct", { brandId: String(brand.id) })
        }
      />

      <Text style={styles.productsTitle}>Products</Text>
      <FlatList
        data={brand.products}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          </View>
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
  productContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productName: { fontSize: 16, flex: 1 },
  productPrice: { fontSize: 16, fontWeight: "600" },
});

export default BrandDetailScreen;
