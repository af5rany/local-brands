import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    RefreshControl,
    StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { Brand } from "@/types/brand";

const BrandSelectionScreen = () => {
    const { token } = useAuth();
    const { setSelectedBrandId } = useBrand();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const router = useRouter();

    // Theme colors
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const buttonColor = useThemeColor({ light: "#007AFF", dark: "#0A84FF" }, "tint");
    const cardBackground = useThemeColor({ light: "#ffffff", dark: "#1c1c1e" }, "background");
    const secondaryTextColor = useThemeColor({ light: "#666666", dark: "#999999" }, "text");
    const borderColor = useThemeColor({ light: "#E5E5EA", dark: "#38383A" }, "background");

    const fetchMyBrands = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getApiUrl()}/brands/my-brands`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch brands");
            const data: Brand[] = await response.json();
            setBrands(data);
            setError("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMyBrands();
    }, [fetchMyBrands]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyBrands();
    };

    const handleBrandSelect = (brandId: number) => {
        setSelectedBrandId(brandId);
        router.push(`/brands/${brandId}/products`);
    };

    const handleViewAllProducts = () => {
        setSelectedBrandId(null);
        router.push("/products");
    };

    const renderBrand = ({ item }: { item: Brand }) => (
        <TouchableOpacity
            style={[styles.brandCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => handleBrandSelect(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.brandContent}>
                <View style={styles.brandImageContainer}>
                    {item.logo ? (
                        <Image
                            source={{ uri: item.logo }}
                            style={styles.brandImage}
                            defaultSource={require("@/assets/images/placeholder-logo.png")}
                        />
                    ) : (
                        <View style={[styles.brandImagePlaceholder, { backgroundColor: buttonColor }]}>
                            <Ionicons name="storefront" size={32} color="white" />
                        </View>
                    )}
                </View>

                <View style={styles.brandInfo}>
                    <Text style={[styles.brandName, { color: textColor }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.description && (
                        <Text style={[styles.brandDescription, { color: secondaryTextColor }]} numberOfLines={2}>
                            {item.description}
                        </Text>
                    )}
                    <View style={styles.brandStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="cube-outline" size={16} color={secondaryTextColor} />
                            <Text style={[styles.statText, { color: secondaryTextColor }]}>
                                {item.productCount || 0} Products
                            </Text>
                        </View>
                        {item.location && (
                            <View style={styles.statItem}>
                                <Ionicons name="location-outline" size={16} color={secondaryTextColor} />
                                <Text style={[styles.statText, { color: secondaryTextColor }]} numberOfLines={1}>
                                    {item.location}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color={secondaryTextColor} />
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor }]}>
                <ActivityIndicator size="large" color={buttonColor} />
            </View>
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={textColor} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={[styles.title, { color: textColor }]}>Select Brand</Text>
                    <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                        Choose a brand to manage its products
                    </Text>
                </View>
            </View>

            {/* Brand List */}
            <FlatList
                data={brands}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderBrand}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="storefront-outline" size={64} color={secondaryTextColor} />
                        <Text style={[styles.emptyText, { color: textColor }]}>No Brands Found</Text>
                        <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>
                            You don't have any brands assigned yet
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: { marginRight: 12 },
    headerTextContainer: { flex: 1 },
    title: { fontSize: 28, fontWeight: "bold" },
    subtitle: { fontSize: 14, marginTop: 2 },
    list: { padding: 16, paddingBottom: 40 },
    brandCard: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: "hidden",
    },
    brandContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    brandImageContainer: {
        marginRight: 16,
    },
    brandImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
    },
    brandImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    brandInfo: {
        flex: 1,
    },
    brandName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    brandDescription: {
        fontSize: 14,
        marginBottom: 8,
    },
    brandStats: {
        flexDirection: "row",
        gap: 16,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
    },
    emptyState: {
        alignItems: "center",
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "600",
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        textAlign: "center",
    },
    viewAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
        gap: 8,
    },
    viewAllText: {
        fontSize: 16,
        fontWeight: "600",
    },
});

export default BrandSelectionScreen;
