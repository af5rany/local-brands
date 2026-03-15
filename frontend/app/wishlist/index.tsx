import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

const WishlistScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { width } = useWindowDimensions();
  const columnCount = width > 600 ? 3 : 2;
  const itemWidth = (width - 48) / columnCount;

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background",
  );
  const secondaryTextColor = useThemeColor(
    { light: "#737373", dark: "#A3A3A3" },
    "text",
  );
  const accentColor = useThemeColor(
    { light: "#DC2626", dark: "#EF4444" },
    "tint",
  );

  const fetchWishlist = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${getApiUrl()}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId: number) => {
    setRemovingId(productId);
    try {
      const response = await fetch(
        `${getApiUrl()}/wishlist/toggle/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error("Failed to update wishlist");
      await fetchWishlist();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const product = item.product;
    const image = product.variants?.[0]?.images?.[0] || "";

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { width: itemWidth, backgroundColor: cardBackground },
        ]}
        onPress={() => router.push(`/products/${product.id}`)}
      >
        <Image source={{ uri: image }} style={styles.productImage} />
        <TouchableOpacity
          style={styles.removeIcon}
          onPress={() => toggleWishlist(product.id)}
          disabled={removingId === product.id}
        >
          {removingId === product.id ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="heart" size={20} color={accentColor} />
          )}
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text
            style={[styles.brandName, { color: secondaryTextColor }]}
            numberOfLines={1}
          >
            {product.brand?.name || "Brand"}
          </Text>
          <Text
            style={[styles.productName, { color: textColor }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text style={[styles.productPrice, { color: textColor }]}>
            ${product.price.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!token) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Ionicons name="heart-outline" size={64} color={secondaryTextColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          Your wishlist is waiting
        </Text>
        <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
          Sign in to save the items you love.
        </Text>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.authBtnText}>SIGN IN</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>WISHLIST</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="heart-dislike-outline"
            size={64}
            color={secondaryTextColor}
          />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            Tap the heart on any product to save it for later.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={columnCount}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f5f5f5",
  },
  removeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 20,
  },
  cardContent: {
    padding: 12,
  },
  brandName: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  shopBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  authBtn: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  authBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});

export default WishlistScreen;
