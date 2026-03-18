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
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

const WishlistTab = () => {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { width } = useWindowDimensions();
  const columnCount = width > 600 ? 3 : 2;
  const itemWidth = (width - 48) / columnCount;

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
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

  // Refresh on tab focus
  useFocusEffect(
    useCallback(() => {
      if (token) fetchWishlist();
    }, [token]),
  );

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
    const firstVariant = product.variants?.[0];
    const image =
      firstVariant?.images?.[0] || firstVariant?.variantImages?.[0] || "";

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { width: itemWidth, backgroundColor: colors.surface },
        ]}
        onPress={() => router.push(`/products/${product.id}`)}
      >
        <Image source={{ uri: image }} style={styles.productImage} />
        <TouchableOpacity
          style={[styles.removeIcon, { backgroundColor: colors.surface }]}
          onPress={() => toggleWishlist(product.id)}
          disabled={removingId === product.id}
        >
          {removingId === product.id ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="heart" size={20} color={colors.danger} />
          )}
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text
            style={[styles.brandName, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {product.brand?.name || "Brand"}
          </Text>
          <Text
            style={[styles.productName, { color: colors.text }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text style={[styles.productPrice, { color: colors.text }]}>
            ${Number(product.price).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!token) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centeredContent}>
          <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your wishlist is waiting
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Sign in to save the items you love.
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.authBtnText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>WISHLIST</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.centeredContent}>
          <Ionicons
            name="heart-dislike-outline"
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Tap the heart on any product to save it for later.
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/shop" as any)}
          >
            <Text style={styles.shopBtnText}>BROWSE SHOP</Text>
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
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
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

export default WishlistTab;
