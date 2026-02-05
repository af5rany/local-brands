import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import getApiUrl from '@/helpers/getApiUrl';
import { Address, AddressType } from '@/types/address';

const ShippingAddressesScreen = () => {
    const router = useRouter();
    const { token, user, refreshUser } = useAuth();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getApiUrl()}/addresses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch addresses');

            const data = await response.json();
            setAddresses(data);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${getApiUrl()}/addresses/${id}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            if (!response.ok) throw new Error('Failed to delete address');

                            setAddresses(addresses.filter(addr => addr.id !== id));
                            Alert.alert('Success', 'Address deleted successfully');
                            refreshUser(); // Update user object in context if default changed
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (id: number) => {
        try {
            const response = await fetch(`${getApiUrl()}/addresses/${id}/default`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to set default address');

            await fetchAddresses();
            await refreshUser();
            Alert.alert('Success', 'Default address updated');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const renderAddressItem = ({ item }: { item: Address }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <View style={styles.nameRow}>
                    <Text style={styles.fullName}>{item.fullName}</Text>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>DEFAULT</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>{item.addressLine1}</Text>
            {item.addressLine2 ? <Text style={styles.addressText}>{item.addressLine2}</Text> : null}
            <Text style={styles.addressText}>
                {item.city}, {item.state} {item.zipCode}
            </Text>
            <Text style={styles.addressText}>{item.country}</Text>

            {item.phone && (
                <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={14} color="#64748b" />
                    <Text style={styles.phoneText}>{item.phone}</Text>
                </View>
            )}

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/profile/addresses/${item.id}`)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                {!item.isDefault && (
                    <TouchableOpacity
                        style={styles.setDefaultButton}
                        onPress={() => handleSetDefault(item.id)}
                    >
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shipping Addresses</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#346beb" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddressItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchAddresses();
                    }}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="location-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No Addresses Found</Text>
                            <Text style={styles.emptySubtitle}>Add a shipping address to get started with your orders.</Text>
                        </View>
                    }
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/profile/addresses/new')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fullName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginRight: 8,
    },
    defaultBadge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0284c7',
    },
    addressText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    phoneText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 6,
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 12,
    },
    editButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#346beb',
    },
    setDefaultButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    setDefaultText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    addButton: {
        backgroundColor: '#346beb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#475569',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});

export default ShippingAddressesScreen;
