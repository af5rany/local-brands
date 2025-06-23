import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ProductCardProps {
  name: string;
  imageUrls: string[];
  price: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  imageUrls,
  price,
}) => {
  return (
    <View style={styles.productContainer}>
      {/* Display the first image from imageUrls array */}
      {imageUrls[0] ? (
        <Image source={{ uri: imageUrls[0] }} style={styles.productImage} />
      ) : null}
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{name}</Text>
        <Text style={styles.productPrice}>${price}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    borderColor: "#ddd",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
  },
});

export default ProductCard;
