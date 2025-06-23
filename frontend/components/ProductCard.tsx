import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";

import { useRouter } from "expo-router";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/app/_layout";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string[];
    brand?: { name: string };
    productType: string;
    subcategory?: string;
    description?: string;
  };
  onPress?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // navigation.navigate("BrandDetail", { brandId: brandId });
  const router = useRouter();
  const firstImage = product.imageUrl?.[0] || "https://via.placeholder.com/150";

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({
      pathname: "/products/[id]",
      params: { id: product.id },
    });
    // router.navigate({
    //   pathname: "/products/[ProductDetailScreen]",
    //   params: { ProductDetailScreen: "bacon" },
    // });
    // router.navigate("/products");
    // navigation.navigate("BrandsList");
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <Image
        source={{ uri: firstImage }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brandName}>
            {product.brand?.name || "No Brand"}
          </Text>
          <Text style={styles.productType}>{product.productType}</Text>
        </View>

        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>

        {product.subcategory && (
          <Text style={styles.subcategory}>{product.subcategory}</Text>
        )}

        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 1.2,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  brandName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
  },
  productType: {
    fontSize: 12,
    color: "#888",
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  subcategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontStyle: "italic",
  },
  description: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#346beb",
  },
});

export default ProductCard;
