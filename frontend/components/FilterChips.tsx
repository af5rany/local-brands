import React from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FilterChipProps {
    label: string;
    icon?: string;
    active?: boolean;
    onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, icon, active, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, active && styles.activeChip]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        {icon && (
            <Ionicons
                name={icon as any}
                size={16}
                color={active ? "#fff" : "#64748b"}
                style={styles.chipIcon}
            />
        )}
        <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
        {!active && <Ionicons name="chevron-down" size={14} color="#64748b" style={styles.dropdownIcon} />}
    </TouchableOpacity>
);

interface FilterChipsProps {
    onFilterPress: (filterType: string) => void;
    activeFilters?: {
        category?: string;
        type?: string;
        brand?: string;
        sort?: string;
    };
}

const FilterChips: React.FC<FilterChipsProps> = ({ onFilterPress, activeFilters = {} }) => {
    const filters = [
        { id: "category", label: "Category", icon: "grid-outline" },
        { id: "type", label: "Product Type", icon: "shirt-outline" },
        { id: "brand", label: "Brand", icon: "business-outline" },
        { id: "sort", label: "Sort", icon: "swap-vertical-outline" },
    ];

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {filters.map((filter) => {
                    const activeValue = activeFilters[filter.id as keyof typeof activeFilters];
                    const isActive = !!activeValue;
                    const displayLabel = isActive ? `${filter.label}: ${activeValue}` : filter.label;

                    return (
                        <FilterChip
                            key={filter.id}
                            label={displayLabel}
                            icon={filter.icon}
                            active={isActive}
                            onPress={() => onFilterPress(filter.id)}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    activeChip: {
        backgroundColor: "#346beb",
        borderColor: "#346beb",
    },
    chipIcon: {
        marginRight: 6,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#475569",
    },
    activeChipText: {
        color: "#fff",
    },
    dropdownIcon: {
        marginLeft: 4,
    },
});

export default FilterChips;
