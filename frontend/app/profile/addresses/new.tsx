import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import getApiUrl from '@/helpers/getApiUrl';
import { AddressType } from '@/types/address';

const NewAddressScreen = () => {
    const router = useRouter();
    const { token, refreshUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        phone: '',
        type: AddressType.SHIPPING,
        isDefault: false,
    });

    const handleSave = async () => {
        // Basic validation
        if (!formData.fullName || !formData.addressLine1 || !formData.city || !formData.state || !formData.zipCode) {
            Alert.alert('Incomplete Form', 'Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${getApiUrl()}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save address');
            }

            Alert.alert('Success', 'Address added successfully', [
                {
                    text: 'OK', onPress: () => {
                        refreshUser();
                        router.back();
                    }
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label: string, value: string, key: string, placeholder: string, required = true, keyboardType: any = 'default') => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                keyboardType={keyboardType}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Address</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderInput('Full Name', formData.fullName, 'fullName', 'John Doe')}
                    {renderInput('Address Line 1', formData.addressLine1, 'addressLine1', '123 Luxury St')}
                    {renderInput('Address Line 2 (Optional)', formData.addressLine2, 'addressLine2', 'Apt 4B', false)}

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            {renderInput('City', formData.city, 'city', 'New York')}
                        </View>
                        <View style={{ flex: 1 }}>
                            {renderInput('State', formData.state, 'state', 'NY')}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            {renderInput('Zip Code', formData.zipCode, 'zipCode', '10001', true, 'number-pad')}
                        </View>
                        <View style={{ flex: 1 }}>
                            {renderInput('Country', formData.country, 'country', 'USA')}
                        </View>
                    </View>

                    {renderInput('Phone Number', formData.phone, 'phone', '+1 234 567 890', false, 'phone-pad')}

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                    >
                        <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                            {formData.isDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Set as default shipping address</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Address</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    row: {
        flexDirection: 'row',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#346beb',
        borderColor: '#346beb',
    },
    checkboxLabel: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    saveButton: {
        backgroundColor: '#346beb',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default NewAddressScreen;
