import React from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Pressable,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 100;
const SNAP_POINTS = {
    HIDDEN: 0,
    HALF: -SCREEN_HEIGHT / 2,
    FULL: MAX_TRANSLATE_Y,
};

interface FilterOption {
    id: string;
    label: string;
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: FilterOption[];
    onSelect: (id: string, label: string) => void;
    activeId?: string;
    enableSearch?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    title,
    options,
    onSelect,
    activeId,
    enableSearch = false,
}) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [showModal, setShowModal] = React.useState(visible);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const scrollTo = React.useCallback((destination: number) => {
        "worklet";
        translateY.value = withSpring(destination, { damping: 50 });
    }, []);

    React.useEffect(() => {
        if (visible) {
            setShowModal(true);
            scrollTo(SNAP_POINTS.HALF);
        } else {
            translateY.value = withSpring(SNAP_POINTS.HIDDEN, { damping: 50 }, (finished) => {
                if (finished) {
                    runOnJS(setShowModal)(false);
                }
            });
        }
    }, [visible]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = event.translationY + context.value.y;
            translateY.value = Math.max(translateY.value, MAX_TRANSLATE_Y);
        })
        .onEnd(() => {
            if (translateY.value > -SCREEN_HEIGHT * 0.25) {
                runOnJS(onClose)();
            } else if (translateY.value < -SCREEN_HEIGHT * 0.6) {
                scrollTo(SNAP_POINTS.FULL);
            } else {
                scrollTo(SNAP_POINTS.HALF);
            }
        });

    const rBottomSheetStyle = useAnimatedStyle(() => {
        const borderRadius = interpolate(
            translateY.value,
            [MAX_TRANSLATE_Y + 50, MAX_TRANSLATE_Y],
            [32, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY: translateY.value }],
            borderRadius,
        };
    });

    const rBackdropStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateY.value,
                [SNAP_POINTS.HIDDEN, SNAP_POINTS.HALF],
                [0, 1],
                Extrapolation.CLAMP
            ),
            display: translateY.value === 0 ? "none" : "flex",
        };
    });

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={showModal}
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                <Animated.View style={[styles.backdrop, rBackdropStyle]}>
                    <Pressable style={{ flex: 1 }} onPress={onClose} />
                </Animated.View>
                <Animated.View style={[styles.modalContent, rBottomSheetStyle]}>
                    <GestureDetector gesture={gesture}>
                        <View style={styles.dragHandleArea}>
                            <View style={styles.dragHandleContainer}>
                                <View style={styles.dragHandle} />
                            </View>
                            <SafeAreaView style={styles.safeArea}>
                                <View style={styles.header}>
                                    <TouchableOpacity onPress={() => onSelect("", "")} style={styles.headerActionButton}>
                                        <Ionicons name="trash-outline" size={22} color="#94a3b8" />
                                    </TouchableOpacity>
                                    <Text style={styles.title}>{title}</Text>
                                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                        <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                            </SafeAreaView>
                        </View>
                    </GestureDetector>

                    {enableSearch && (
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={18} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search brands..."
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <FlatList
                        data={filteredOptions}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const isActive = item.id === activeId;
                            return (
                                <TouchableOpacity
                                    style={[styles.optionItem, isActive && styles.activeOption]}
                                    onPress={() => onSelect(item.id, item.label)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.optionLabel, isActive && styles.activeOptionLabel]}>
                                        {item.label}
                                    </Text>
                                    {isActive && (
                                        <Ionicons name="checkmark-circle" size={20} color="#346beb" />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No options available</Text>
                            </View>
                        }
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={styles.listContent}
                    />
                </Animated.View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalContent: {
        height: SCREEN_HEIGHT,
        width: "100%",
        backgroundColor: "#fff",
        position: "absolute",
        top: SCREEN_HEIGHT,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    dragHandleArea: {
        width: "100%",
        paddingTop: 10,
        backgroundColor: "transparent",
    },
    dragHandleContainer: {
        width: "100%",
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: "#e2e8f0",
        borderRadius: 3,
    },
    safeArea: {
        // Remove flex: 1 if it interferes
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        textAlign: "center",
        flex: 1,
    },
    closeButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    headerActionButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#1e293b",
        marginLeft: 8,
        paddingVertical: 10,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 60,
    },
    separator: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginHorizontal: 12,
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginVertical: 2,
    },
    activeOption: {
        backgroundColor: "#346beb10",
    },
    optionLabel: {
        fontSize: 16,
        color: "#1e293b",
        fontWeight: "600",
    },
    activeOptionLabel: {
        color: "#346beb",
        fontWeight: "700",
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: "center",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: 15,
        fontWeight: "500",
    },
});

export default FilterModal;
