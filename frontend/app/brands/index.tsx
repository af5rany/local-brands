import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const BrandsListScreen = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonColor = useThemeColor(
    { light: "#007AFF", dark: "#0A84FF" },
    "tint"
  );
  const cardBackground = useThemeColor(
    { light: "#ffffff", dark: "#1c1c1e" },
    "background"
  );
  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "text"
  );

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/brands`);
        if (!response.ok) {
          throw new Error("Failed to fetch brands");
        }
        const data = await response.json();
        setBrands(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const renderBrand = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[
        styles.brandContainer,
        {
          backgroundColor: cardBackground,
          transform: [{ scale: 1 }],
        },
      ]}
      onPress={() => router.push(`/brands/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.brandContent}>
        <View style={styles.brandHeader}>
          <View style={styles.logoContainer}>
            {item.logo ? (
              <Image
                style={styles.brandLogo}
                source={{ uri: item.logo }}
                defaultSource={require("@/assets/images/placeholder-logo.png")}
              />
            ) : (
              <View
                style={[
                  styles.logoPlaceholder,
                  { backgroundColor: buttonColor },
                ]}
              >
                <Ionicons name="business" size={24} color="white" />
              </View>
            )}
          </View>
          <View style={styles.brandInfo}>
            <Text
              style={[styles.brandName, { color: textColor }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.brandDescription, { color: secondaryTextColor }]}
              numberOfLines={2}
            >
              {item.description || "No description available"}
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={secondaryTextColor}
            />
          </View>
        </View>

        {/* Optional: Add brand stats or additional info */}
        <View style={styles.brandStats}>
          <View style={styles.statItem}>
            <Ionicons
              name="storefront-outline"
              size={16}
              color={secondaryTextColor}
            />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {item.storeCount || 0} stores
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {item.rating || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.header, { color: textColor }]}>Brands</Text>
      <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
        Discover and manage your favorite brands
      </Text>
    </View>
  );

  const renderCreateButton = () => (
    <TouchableOpacity
      style={[styles.createButton, { backgroundColor: buttonColor }]}
      onPress={() => router.push("/brands/create")}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[buttonColor, `${buttonColor}CC`]}
        style={styles.gradientButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createButtonText}>Create New Brand</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color={secondaryTextColor} />
      <Text style={[styles.emptyStateTitle, { color: textColor }]}>
        No Brands Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
        Create your first brand to get started
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={buttonColor} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading brands...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={[styles.errorTitle, { color: textColor }]}>
          Oops! Something went wrong
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: buttonColor }]}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />

      <FlatList
        data={brands}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBrand}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderCreateButton()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    opacity: 0.8,
  },
  brandContainer: {
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  brandContent: {
    padding: 16,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logoContainer: {
    marginRight: 12,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInfo: {
    flex: 1,
    marginRight: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  createButton: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
});

export default BrandsListScreen;
