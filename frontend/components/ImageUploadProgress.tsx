import React from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UploadState } from '../hooks/useCloudinaryUpload';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ImageUploadProgressProps {
    upload: UploadState;
    size?: number;
}

export const ImageUploadProgress: React.FC<ImageUploadProgressProps> = ({
    upload,
    size = 80,
}) => {
    const cardBackground = useThemeColor({ light: '#f8f8f8', dark: '#2c2c2e' }, 'background');
    const textColor = useThemeColor({}, 'text');

    return (
        <View style={[styles.container, { width: size, height: size, backgroundColor: cardBackground }]}>
            <Image source={{ uri: upload.uri }} style={styles.image} />

            {upload.status === 'compressing' && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.text}>Busy...</Text>
                </View>
            )}

            {upload.status === 'uploading' && (
                <View style={styles.overlay}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${upload.progress}%` }]} />
                    </View>
                    <Text style={styles.text}>{upload.progress}%</Text>
                </View>
            )}

            {upload.status === 'success' && (
                <View style={[styles.overlay, styles.successOverlay]}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
            )}

            {upload.status === 'error' && (
                <View style={[styles.overlay, styles.errorOverlay]}>
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                    <Text style={[styles.text, { fontSize: 8 }]}>{upload.error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    successOverlay: {
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    errorOverlay: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    text: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
    },
    progressBarContainer: {
        width: '80%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        marginBottom: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
    },
});
