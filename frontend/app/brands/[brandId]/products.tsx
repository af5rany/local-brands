import React, { useEffect, useState, useCallback, useMemo } from "react";
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
    TextInput,
    Modal,
    ScrollView,
    RefreshControl,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/product";
import { Brand } from "@/types/brand";
import { PaginatedResult, Filters, SortOptions } from "@/types/filters";
import ProductCard from "@/components/ProductCard";

const { width } = Dimensions.get("window");

const BrandProductsScreen = () => {
    const router = useRouter();
    const { brandId } = useLocalSearchParams();
    const { token, user } = useAuth();
    const [productsData, setProductsData] = useState<PaginatedResult<Product> | null>(null);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Theme colors
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const secondaryTextColor = useThemeColor({ light: "#666666", dark: "#999999" }, "text");
    const buttonColor = useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "tint");
    const cardBackground = useThemeColor({ light: "#ffffff", dark: "#1c1c1e" }, "background");
    const borderColor = useThemeColor({ light: "#E5E5EA", dark: "#38383A" }, "background");

    const fetchBrand = useCallback(async () => {
        try {
            const response = await fetch(`${getApiUrl()}/brands/${brandId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch brand");
            const data = await response.json();
            setBrand(data);
        } catch (err: any) {
            console.error("Error fetching brand:", err);
        }
    }, [brandId, token]);

    const fetchProducts = useCallback(async (page: number = 1) => {
        try {
            if (page === 1) setLoading(true);
            const response = await fetch(
                `${getApiUrl()}/products?brandId=${brandId}&page=${page}&limit=10`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch products");
            const data: PaginatedResult<Product> = await response.json();

            if (page === 1) {
                setProductsData(data);
            } else {
                setProductsData(prev => ({
                    ...data,
                    items: [...(prev?.items || []), ...data.items]
                }));
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [brandId, token]);

    useEffect(() => {
        if (brandId && token) {
            fetchBrand();
            fetchProducts();
        }
    }, [brandId, token, fetchBrand, fetchProducts]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts(1);
    };

    const loadMore = () => {
        if (productsData?.hasNextPage && !loading) {
            fetchProducts(productsData.page + 1);
        }
    };

    const handleEditProduct = (productId: number) => {
        router.push(`/products/edit/${productId}`);
    };

    const handleEditBrand = () => {
        router.push(`/brands/${brandId}/edit`);
    };

    if (loading && !refreshing && !productsData) {
        return (
            <View style={[styles.center, { backgroundColor }]}>
                <ActivityIndicator size="large" color={buttonColor} />
            </View>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: brand?.name || "Brand Products",
                headerBackTitle: "Brands",
            }} />

            <FlatList
                data={productsData?.items || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ProductCard
                        product={{ ...item, brandName: brand?.name }}
                        onEdit={handleEditProduct}
                    />
                )}
                contentContainerStyle={styles.list}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={64} color={secondaryTextColor} />
                        <Text style={[styles.emptyText, { color: textColor }]}>No Products Found</Text>
                        <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
                            This brand doesn't have any products yet.
                        </Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={[styles.headerContainer, { backgroundColor: cardBackground, borderColor }]}>
                        <View style={styles.brandHeaderTop}>
                            <View style={styles.brandLogoContainer}>
                                {brand?.logo ? (
                                    <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
                                ) : (
                                    <View style={[styles.brandLogoPlaceholder, { backgroundColor: buttonColor }]}>
                                        <Ionicons name="storefront" size={28} color="white" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.brandMainInfo}>
                                <Text style={[styles.brandTitle, { color: textColor }]} numberOfLines={1}>
                                    {brand?.name}
                                </Text>
                                <Text style={[styles.productCountText, { color: secondaryTextColor }]}>
                                    {productsData?.total || 0} Products
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.gearButton, { backgroundColor: backgroundColor + "80", borderColor }]}
                                onPress={handleEditBrand}
                            >
                                <Ionicons name="settings-outline" size={22} color={textColor} />
                            </TouchableOpacity>
                        </View>

                        {brand?.description && (
                            <Text style={[styles.brandDescription, { color: secondaryTextColor }]} numberOfLines={2}>
                                {brand.description}
                            </Text>
                        )}

                        {brand?.location && (
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color={secondaryTextColor} />
                                <Text style={[styles.locationText, { color: secondaryTextColor }]}>
                                    {brand.location}
                                </Text>
                            </View>
                        )}
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: buttonColor }]}
                onPress={() => router.push(`/products/create/${brandId}`)}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { padding: 16, paddingBottom: 100 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "bold" },
    subtitle: { fontSize: 14, marginTop: 4 },
    emptyState: { alignItems: "center", marginTop: 60 },
    emptyText: { fontSize: 18, fontWeight: "600", marginTop: 16 },
    emptySubtext: { fontSize: 14, textAlign: "center", marginTop: 8 },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerContainer: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    brandHeaderTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    brandLogoContainer: {
        marginRight: 12,
    },
    brandLogo: {
        width: 50,
        height: 50,
        borderRadius: 12,
    },
    brandLogoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    brandMainInfo: {
        flex: 1,
    },
    brandTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    productCountText: {
        fontSize: 13,
        marginTop: 2,
    },
    gearButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    brandDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 13,
    },
});

export default BrandProductsScreen;
