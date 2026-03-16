import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useThemeColors } from "@/hooks/useThemeColor";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + 60;
const SNAP_HALF = -SCREEN_HEIGHT * 0.65;

export interface PanelFilters {
  categories: string[];
  brands: string[]; // brand IDs as strings
  sortOrder: "ASC" | "DESC";
}

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: PanelFilters;
  categoryOptions: string[];
  brandOptions: { id: string; name: string }[];
  onApply: (filters: PanelFilters) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  activeFilters,
  categoryOptions,
  brandOptions,
  onApply,
}) => {
  const colors = useThemeColors();
  const [pendingCategories, setPendingCategories] = React.useState<string[]>(
    [],
  );
  const [pendingBrands, setPendingBrands] = React.useState<string[]>([]);
  const [pendingSortOrder, setPendingSortOrder] = React.useState<
    "ASC" | "DESC"
  >("DESC");
  const [brandSearch, setBrandSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const timingConfig = { duration: 300, easing: Easing.out(Easing.cubic) };

  const scrollTo = React.useCallback((destination: number) => {
    "worklet";
    translateY.value = withTiming(destination, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, []);

  React.useEffect(() => {
    if (visible) {
      // Initialize pending state from current applied filters on every open
      setPendingCategories([...activeFilters.categories]);
      setPendingBrands([...activeFilters.brands]);
      setPendingSortOrder(activeFilters.sortOrder);
      setBrandSearch("");
      setShowModal(true);
      scrollTo(SNAP_HALF);
    } else {
      translateY.value = withTiming(
        0,
        timingConfig,
        (finished) => {
          if (finished) runOnJS(setShowModal)(false);
        },
      );
    }
  }, [visible]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        event.translationY + context.value.y,
        MAX_TRANSLATE_Y,
      );
    })
    .onEnd(() => {
      if (translateY.value > -SCREEN_HEIGHT * 0.25) {
        translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else if (translateY.value < -SCREEN_HEIGHT * 0.75) {
        scrollTo(MAX_TRANSLATE_Y);
      } else {
        scrollTo(SNAP_HALF);
      }
    });

  const rSheetStyle = useAnimatedStyle(() => {
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

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, SNAP_HALF],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    display: translateY.value === 0 ? "none" : "flex",
  }));

  const activeCount =
    (pendingCategories.length > 0 ? 1 : 0) +
    (pendingBrands.length > 0 ? 1 : 0) +
    (pendingSortOrder !== "DESC" ? 1 : 0);

  const filteredBrands = brandOptions.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const handleApply = () => {
    onApply({
      categories: pendingCategories,
      brands: pendingBrands,
      sortOrder: pendingSortOrder,
    });
    onClose();
  };

  const handleClearAll = () => {
    setPendingCategories([]);
    setPendingBrands([]);
    setPendingSortOrder("DESC");
  };

  const toggleCategory = (cat: string) =>
    setPendingCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  const toggleBrand = (id: string) =>
    setPendingBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );

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
            styles.sheet,
            { backgroundColor: colors.surface },
            rSheetStyle,
          ]}
        >
          <View style={styles.sheetInner}>
          {/* Drag handle + Header */}
          <GestureDetector gesture={gesture}>
            <View>
              <View style={styles.handleWrap}>
                <View
                  style={[styles.handle, { backgroundColor: colors.border }]}
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
                    onPress={handleClearAll}
                    style={styles.headerSide}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.headerActionText,
                        { color: colors.danger },
                      ]}
                    >
                      Clear All
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Filters
                  </Text>

                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.headerSide, styles.headerSideRight]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.closeCircle,
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

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── Sort ── */}
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                SORT BY
              </Text>
              <View style={styles.sortRow}>
                {(
                  [
                    {
                      id: "DESC" as const,
                      label: "Newest First",
                      icon: "arrow-down-outline",
                    },
                    {
                      id: "ASC" as const,
                      label: "Oldest First",
                      icon: "arrow-up-outline",
                    },
                  ] as const
                ).map((opt) => {
                  const isActive = pendingSortOrder === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.sortCard,
                        {
                          backgroundColor: isActive
                            ? colors.primarySoft
                            : colors.surfaceRaised,
                          borderColor: isActive
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => setPendingSortOrder(opt.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={
                          isActive ? colors.primary : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.sortCardLabel,
                          {
                            color: isActive ? colors.primary : colors.text,
                          },
                          isActive && styles.boldText,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.borderLight }]}
            />

            {/* ── Category ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  CATEGORY
                  {pendingCategories.length > 0 && (
                    <Text style={{ color: colors.primary }}>
                      {" "}
                      ({pendingCategories.length})
                    </Text>
                  )}
                </Text>
                {pendingCategories.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setPendingCategories([])}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.clearLink,
                        { color: colors.textTertiary },
                      ]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.chipWrap}>
                {categoryOptions.map((cat) => {
                  const isActive = pendingCategories.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: isActive
                            ? colors.primarySoft
                            : colors.surfaceRaised,
                          borderColor: isActive
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => toggleCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          {
                            color: isActive ? colors.primary : colors.text,
                          },
                          isActive && styles.boldText,
                        ]}
                      >
                        {cat}
                      </Text>
                      {isActive && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.primary}
                          style={styles.chipCheck}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {categoryOptions.length === 0 && (
                  <Text
                    style={[styles.emptyText, { color: colors.textTertiary }]}
                  >
                    No categories available
                  </Text>
                )}
              </View>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.borderLight }]}
            />

            {/* ── Brand ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  BRAND
                  {pendingBrands.length > 0 && (
                    <Text style={{ color: colors.primary }}>
                      {" "}
                      ({pendingBrands.length})
                    </Text>
                  )}
                </Text>
                {pendingBrands.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setPendingBrands([])}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.clearLink,
                        { color: colors.textTertiary },
                      ]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {brandOptions.length > 5 && (
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: colors.surfaceRaised,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={16}
                    color={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search brands..."
                    placeholderTextColor={colors.textTertiary}
                    value={brandSearch}
                    onChangeText={setBrandSearch}
                    autoCorrect={false}
                  />
                  {brandSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setBrandSearch("")}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {filteredBrands.map((brand, index) => {
                const isActive = pendingBrands.includes(brand.id);
                const isLast = index === filteredBrands.length - 1;
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.brandRow,
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                      },
                      isActive && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => toggleBrand(brand.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.brandRowLabel,
                        { color: isActive ? colors.primary : colors.text },
                        isActive && styles.boldText,
                      ]}
                    >
                      {brand.name}
                    </Text>
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
                          size={12}
                          color={colors.primaryForeground}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredBrands.length === 0 && (
                <Text
                  style={[styles.emptyText, { color: colors.textTertiary }]}
                >
                  {brandSearch ? "No matching brands" : "No brands available"}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Apply Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.borderLight,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.applyText, { color: colors.primaryForeground }]}
              >
                {activeCount > 0 ? `Apply Filters (${activeCount})` : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
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
  sheetInner: {
    height: SCREEN_HEIGHT * 0.65,
    flexDirection: "column",
  },
  handleWrap: {
    width: "100%",
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerSide: { width: 72 },
  headerSideRight: { alignItems: "flex-end" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center", flex: 1 },
  headerActionText: { fontSize: 14, fontWeight: "600" },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  section: { paddingHorizontal: 16, paddingVertical: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  clearLink: { fontSize: 13, fontWeight: "500" },
  divider: { height: 1, marginHorizontal: 0 },
  boldText: { fontWeight: "700" },
  // Sort
  sortRow: { flexDirection: "row", gap: 10 },
  sortCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sortCardLabel: { fontSize: 14, fontWeight: "500" },
  // Category chips (wrap)
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  selectChipText: { fontSize: 14, fontWeight: "500" },
  chipCheck: { marginLeft: 5 },
  // Brand list
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 1,
  },
  brandRowLabel: { fontSize: 15, fontWeight: "500", flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontWeight: "500", paddingVertical: 8 },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  applyButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyText: { fontSize: 16, fontWeight: "700" },
});

export default FilterPanel;
