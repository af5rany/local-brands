import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import getApiUrl from "@/helpers/getApiUrl";
import { useRouter, useLocalSearchParams } from "expo-router";
import ProductCard from "@/components/ProductCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { Brand } from "@/types/brand";

const BrandDetailScreen = () => {
  const router = useRouter();
  const { brandId, refresh } = useLocalSearchParams();

  // Theme colors
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
  const secondaryTextColor = useThemeColor(
    { light: "#8E8E93", dark: "#8E8E93" },
    "text"
  );

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (brandId) {
      fetchBrandDetails();
    }
  }, [brandId]);

  useEffect(() => {
    if (refresh === "true") {
      fetchBrandDetails();
      router.setParams({ refresh: "" });
    }
  }, [refresh]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContainer: {
      padding: 20,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: backgroundColor,
    },
    brandHeader: {
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    brandLogo: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 15,
      borderWidth: 3,
      borderColor: borderColor,
    },
    brandName: {
      fontSize: 28,
      fontWeight: "700",
      color: textColor,
      marginBottom: 8,
      textAlign: "center",
    },
    brandDescription: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: "center",
      lineHeight: 22,
    },
    aboutSection: {
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
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      marginBottom: 15,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    infoIcon: {
      marginRight: 12,
      width: 20,
      alignItems: "center",
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: textColor,
      marginRight: 8,
    },
    infoValue: {
      fontSize: 16,
      color: secondaryTextColor,
      flex: 1,
    },
    ownerContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    ownerAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      backgroundColor: primaryColor,
    },
    ownerInitials: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 24,
    },
    ownerName: {
      fontSize: 16,
      color: secondaryTextColor,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
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
    statItem: {
      alignItems: "center",
    },
    statNumber: {
      fontSize: 24,
      fontWeight: "700",
      color: primaryColor,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: "center",
    },
    createButton: {
      backgroundColor: primaryColor,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      flexDirection: "row",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    createButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    productsTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      marginBottom: 15,
      marginTop: 10,
    },
    productCardContainer: {
      marginBottom: 15,
    },
    emptyProducts: {
      alignItems: "center",
      padding: 40,
      backgroundColor: cardBackground,
      borderRadius: 16,
      marginTop: 10,
    },
    emptyProductsText: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: "center",
      marginTop: 10,
    },
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>{error}</Text>
      </View>
    );
  }

  if (!brand) {
    return (
      <View style={styles.center}>
        <Text style={{ color: textColor }}>Brand not found.</Text>
      </View>
    );
  }

  const getOwnerInitials = (owner: any) => {
    if (!owner?.name) return "?";
    return owner.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          {brand.logo ? (
            <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
          ) : (
            <View
              style={[
                styles.brandLogo,
                {
                  backgroundColor: primaryColor,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 32, fontWeight: "700" }}
              >
                {brand.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.brandName}>{brand.name}</Text>
          {brand.description && (
            <Text style={styles.brandDescription}>{brand.description}</Text>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{brand.products?.length || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatDate(brand.createdAt).split(" ")[2]}
            </Text>
            <Text style={styles.statLabel}>Established</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.ceil(
                (new Date().getTime() - new Date(brand.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}
            </Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* About Brand Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Brand</Text>

          {brand.location && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={18} color={primaryColor} />
              </View>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{brand.location}</Text>
            </View>
          )}

          {brand.owner && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={18} color={primaryColor} />
              </View>
              <Text style={styles.infoLabel}>Owner:</Text>
              <View style={styles.ownerContainer}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerInitials}>
                    {getOwnerInitials(brand.owner)}
                  </Text>
                </View>
                <Text style={styles.ownerName}>
                  {brand.owner.name || "Unknown"}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar" size={18} color={primaryColor} />
            </View>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(brand.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="refresh" size={18} color={primaryColor} />
            </View>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{formatDate(brand.updatedAt)}</Text>
          </View>
        </View>

        {/* Create Product Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push(`/products/create/${brand.id}`)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>Create New Product</Text>
        </TouchableOpacity>

        {/* Products Section */}
        <Text style={styles.productsTitle}>
          Products ({brand.products?.length || 0})
        </Text>

        {brand.products && brand.products.length > 0 ? (
          <FlatList
            data={brand.products}
            scrollEnabled={false}
            keyExtractor={(p) => String(p.id)}
            renderItem={({ item }) => (
              <View style={styles.productCardContainer}>
                <ProductCard product={item} />
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyProducts}>
            <Ionicons
              name="cube-outline"
              size={48}
              color={secondaryTextColor}
            />
            <Text style={styles.emptyProductsText}>
              No products yet. Create your first product to get started!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BrandDetailScreen;
