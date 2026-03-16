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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useThemeColors } from "@/hooks/useThemeColor";

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
  enableSearch?: boolean;

  // Single-select (existing, e.g. sort)
  onSelect?: (id: string, label: string) => void;
  activeId?: string;

  // Multi-select (new, e.g. category + brand)
  multiSelect?: boolean;
  activeIds?: string[];
  onApply?: (ids: string[], labels: string[]) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  title,
  options,
  onSelect,
  activeId,
  enableSearch = false,
  multiSelect = false,
  activeIds,
  onApply,
}) => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showModal, setShowModal] = React.useState(visible);
  const [pendingIds, setPendingIds] = React.useState<string[]>([]);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const scrollTo = React.useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, { damping: 50 });
  }, []);

  React.useEffect(() => {
    if (visible) {
      setShowModal(true);
      if (multiSelect) setPendingIds(activeIds ?? []);
      setSearchQuery("");
      scrollTo(SNAP_POINTS.HALF);
    } else {
      translateY.value = withSpring(
        SNAP_POINTS.HIDDEN,
        { damping: 50 },
        (finished) => {
          if (finished) {
            runOnJS(setShowModal)(false);
          }
        },
      );
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
      [28, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateY.value,
        [SNAP_POINTS.HIDDEN, SNAP_POINTS.HALF],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      display: translateY.value === 0 ? "none" : "flex",
    };
  });

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClear = () => {
    if (multiSelect) {
      setPendingIds([]);
      onApply?.([], []);
      onClose();
    } else {
      onSelect?.("", "");
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: colors.surfaceOverlay },
            rBackdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface },
            rBottomSheetStyle,
          ]}
        >
          {/* Drag Handle Area */}
          <GestureDetector gesture={gesture}>
            <View style={styles.dragHandleArea}>
              <View style={styles.dragHandleContainer}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: colors.border },
                  ]}
                />
              </View>

              <SafeAreaView>
                <View
                  style={[
                    styles.header,
                    { borderBottomColor: colors.borderLight },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleClear}
                    style={styles.headerAction}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.headerActionText,
                        { color: colors.danger },
                      ]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                  </Text>

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.closeButtonCircle,
                        { backgroundColor: colors.surfaceRaised },
                      ]}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </GestureDetector>

          {/* Search Bar */}
          {enableSearch && (
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textTertiary}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = multiSelect
                ? pendingIds.includes(item.id)
                : item.id === activeId;
              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    isActive && { backgroundColor: colors.primarySoft },
                  ]}
                  onPress={() => {
                    if (multiSelect) {
                      setPendingIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((x) => x !== item.id)
                          : [...prev, item.id],
                      );
                    } else {
                      onSelect?.(item.id, item.label);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isActive ? colors.primary : colors.text },
                      isActive && styles.optionLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {multiSelect ? (
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isActive
                            ? colors.primary
                            : colors.border,
                          backgroundColor: isActive
                            ? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      {isActive && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primaryForeground}
                        />
                      )}
                    </View>
                  ) : (
                    isActive && (
                      <View
                        style={[
                          styles.checkCircle,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primaryForeground}
                        />
                      </View>
                    )
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.emptyText, { color: colors.textTertiary }]}
                >
                  No options found
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.borderLight },
                ]}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              multiSelect && { paddingBottom: 80 },
            ]}
          />

          {/* Apply Button (multi-select only) */}
          {multiSelect && (
            <View
              style={[
                styles.applyFooter,
                {
                  borderTopColor: colors.borderLight,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  const labels = pendingIds.map(
                    (id) =>
                      options.find((o) => o.id === id)?.label ?? id,
                  );
                  onApply?.(pendingIds, labels);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.applyButtonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {pendingIds.length > 0
                    ? `Apply (${pendingIds.length} selected)`
                    : "Apply"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    height: SCREEN_HEIGHT,
    width: "100%",
    position: "absolute",
    top: SCREEN_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  dragHandleArea: {
    width: "100%",
    paddingTop: 8,
  },
  dragHandleContainer: {
    width: "100%",
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  headerAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: 56,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 56,
    alignItems: "flex-end",
  },
  closeButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 46,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 10,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 60,
  },
  separator: {
    height: 1,
    marginHorizontal: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionLabelActive: {
    fontWeight: "700",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  applyFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  applyButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default FilterModal;
