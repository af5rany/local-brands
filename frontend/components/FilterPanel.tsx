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
  LayoutChangeEvent,
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

const PRICE_MIN = 0;
const PRICE_MAX = 500;
const THUMB_SIZE = 22;

export interface PanelFilters {
  categories: string[];
  brands: string[]; // brand IDs as strings
  sortBy: string; // "createdAt" or "price"
  sortOrder: "ASC" | "DESC";
  priceMin: number;
  priceMax: number;
}

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  activeFilters: PanelFilters;
  categoryOptions: string[];
  brandOptions: { id: string; name: string }[];
  onApply: (filters: PanelFilters) => void;
}

type SortOptionKey = "newest" | "oldest" | "price_low" | "price_high";

const SORT_OPTIONS: {
  key: SortOptionKey;
  label: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "newest",
    label: "Newest first",
    sortBy: "createdAt",
    sortOrder: "DESC",
    icon: "arrow-down-outline",
  },
  {
    key: "oldest",
    label: "Oldest first",
    sortBy: "createdAt",
    sortOrder: "ASC",
    icon: "arrow-up-outline",
  },
  {
    key: "price_low",
    label: "Price: Low\u2013High",
    sortBy: "price",
    sortOrder: "ASC",
    icon: "trending-up-outline",
  },
  {
    key: "price_high",
    label: "Price: High\u2013Low",
    sortBy: "price",
    sortOrder: "DESC",
    icon: "trending-down-outline",
  },
];

const getSortKey = (sortBy: string, sortOrder: string): SortOptionKey => {
  if (sortBy === "price" && sortOrder === "ASC") return "price_low";
  if (sortBy === "price" && sortOrder === "DESC") return "price_high";
  if (sortBy === "createdAt" && sortOrder === "ASC") return "oldest";
  return "newest";
};

// ── Price Range Slider ──────────────────────────────
const PriceRangeSlider = ({
  min,
  max,
  onValuesChange,
  colors,
}: {
  min: number;
  max: number;
  onValuesChange: (low: number, high: number) => void;
  colors: any;
}) => {
  const [trackWidth, setTrackWidth] = React.useState(0);

  const lowValue = useSharedValue(min);
  const highValue = useSharedValue(max);
  const lowContext = useSharedValue(0);
  const highContext = useSharedValue(0);

  React.useEffect(() => {
    lowValue.value = min;
    highValue.value = max;
  }, [min, max]);

  const valueToPosition = (value: number) => {
    if (trackWidth === 0) return 0;
    return ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth;
  };

  const positionToValue = (pos: number) => {
    if (trackWidth === 0) return PRICE_MIN;
    const raw = PRICE_MIN + (pos / trackWidth) * (PRICE_MAX - PRICE_MIN);
    return Math.round(Math.max(PRICE_MIN, Math.min(PRICE_MAX, raw)));
  };

  const lowGesture = Gesture.Pan()
    .onStart(() => {
      lowContext.value = valueToPosition(lowValue.value);
    })
    .onUpdate((e) => {
      const newPos = Math.max(
        0,
        Math.min(lowContext.value + e.translationX, valueToPosition(highValue.value) - 10),
      );
      const newVal = positionToValue(newPos);
      lowValue.value = newVal;
    })
    .onEnd(() => {
      runOnJS(onValuesChange)(lowValue.value, highValue.value);
    });

  const highGesture = Gesture.Pan()
    .onStart(() => {
      highContext.value = valueToPosition(highValue.value);
    })
    .onUpdate((e) => {
      const newPos = Math.min(
        trackWidth,
        Math.max(highContext.value + e.translationX, valueToPosition(lowValue.value) + 10),
      );
      const newVal = positionToValue(newPos);
      highValue.value = newVal;
    })
    .onEnd(() => {
      runOnJS(onValuesChange)(lowValue.value, highValue.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    left: ((lowValue.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth,
    right:
      trackWidth -
      ((highValue.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth,
  }));

  const lowThumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          ((lowValue.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth -
          THUMB_SIZE / 2,
      },
    ],
  }));

  const highThumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          ((highValue.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth -
          THUMB_SIZE / 2,
      },
    ],
  }));

  const lowLabelStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelsRow}>
        <Text style={[sliderStyles.boundLabel, { color: colors.textTertiary }]}>
          ${PRICE_MIN}
        </Text>
        <Text style={[sliderStyles.boundLabel, { color: colors.textTertiary }]}>
          ${PRICE_MAX}
        </Text>
      </View>

      <View style={sliderStyles.trackContainer} onLayout={onLayout}>
        {/* Background track */}
        <View
          style={[
            sliderStyles.track,
            { backgroundColor: colors.borderLight },
          ]}
        />

        {/* Active fill */}
        <Animated.View
          style={[
            sliderStyles.fill,
            { backgroundColor: colors.primary },
            fillStyle,
          ]}
        />

        {/* Low thumb */}
        <GestureDetector gesture={lowGesture}>
          <Animated.View
            style={[
              sliderStyles.thumb,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                shadowColor: colors.primary,
              },
              lowThumbStyle,
            ]}
          />
        </GestureDetector>

        {/* High thumb */}
        <GestureDetector gesture={highGesture}>
          <Animated.View
            style={[
              sliderStyles.thumb,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                shadowColor: colors.primary,
              },
              highThumbStyle,
            ]}
          />
        </GestureDetector>
      </View>

      <Text style={[sliderStyles.rangeLabel, { color: colors.textSecondary }]}>
        ${min} – ${max}
      </Text>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  container: { paddingTop: 4 },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  boundLabel: { fontSize: 12, fontWeight: "500" },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  fill: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
});

// ── Main FilterPanel ──────────────────────────────────
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
  const [pendingSortKey, setPendingSortKey] =
    React.useState<SortOptionKey>("newest");
  const [pendingPriceMin, setPendingPriceMin] = React.useState(PRICE_MIN);
  const [pendingPriceMax, setPendingPriceMax] = React.useState(PRICE_MAX);
  const [brandSearch, setBrandSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const timingConfig = { duration: 300, easing: Easing.out(Easing.cubic) };

  const scrollTo = React.useCallback((destination: number) => {
    "worklet";
    translateY.value = withTiming(destination, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  React.useEffect(() => {
    if (visible) {
      setPendingCategories([...activeFilters.categories]);
      setPendingBrands([...activeFilters.brands]);
      setPendingSortKey(
        getSortKey(activeFilters.sortBy, activeFilters.sortOrder),
      );
      setPendingPriceMin(activeFilters.priceMin);
      setPendingPriceMax(activeFilters.priceMax);
      setBrandSearch("");
      setShowModal(true);
      scrollTo(SNAP_HALF);
    } else {
      translateY.value = withTiming(0, timingConfig, (finished) => {
        if (finished) runOnJS(setShowModal)(false);
      });
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
        translateY.value = withTiming(
          0,
          { duration: 300, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
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
    (pendingSortKey !== "newest" ? 1 : 0) +
    (pendingPriceMin > PRICE_MIN || pendingPriceMax < PRICE_MAX ? 1 : 0);

  const filteredBrands = brandOptions.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const handleApply = () => {
    const sortOpt = SORT_OPTIONS.find((o) => o.key === pendingSortKey)!;
    onApply({
      categories: pendingCategories,
      brands: pendingBrands,
      sortBy: sortOpt.sortBy,
      sortOrder: sortOpt.sortOrder,
      priceMin: pendingPriceMin,
      priceMax: pendingPriceMax,
    });
    onClose();
  };

  const handleClearAll = () => {
    setPendingCategories([]);
    setPendingBrands([]);
    setPendingSortKey("newest");
    setPendingPriceMin(PRICE_MIN);
    setPendingPriceMax(PRICE_MAX);
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
                        Clear all
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
              {/* ── Sort by ── */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  Sort by
                </Text>
                <View style={styles.sortGrid}>
                  {SORT_OPTIONS.slice(0, 2).map((opt) => {
                    const isActive = pendingSortKey === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
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
                        onPress={() => setPendingSortKey(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={16}
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
                <View style={[styles.sortGrid, { marginTop: 8 }]}>
                  {SORT_OPTIONS.slice(2).map((opt) => {
                    const isActive = pendingSortKey === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
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
                        onPress={() => setPendingSortKey(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={16}
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
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderLight },
                ]}
              />

              {/* ── Price range ── */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  Price range
                </Text>
                <PriceRangeSlider
                  min={pendingPriceMin}
                  max={pendingPriceMax}
                  onValuesChange={(low, high) => {
                    setPendingPriceMin(low);
                    setPendingPriceMax(high);
                  }}
                  colors={colors}
                />
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderLight },
                ]}
              />

              {/* ── Category ── */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  Category
                </Text>

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
                      </TouchableOpacity>
                    );
                  })}
                  {categoryOptions.length === 0 && (
                    <Text
                      style={[
                        styles.emptyText,
                        { color: colors.textTertiary },
                      ]}
                    >
                      No categories available
                    </Text>
                  )}
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.borderLight },
                ]}
              />

              {/* ── Brand ── */}
              <View style={styles.section}>
                <Text
                  style={[styles.sectionLabel, { color: colors.textSecondary }]}
                >
                  Brand
                </Text>

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
                    placeholder="Search brands\u2026"
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
                          {
                            color: isActive ? colors.primary : colors.text,
                          },
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
                    {brandSearch
                      ? "No matching brands"
                      : "No brands available"}
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
                style={[
                  styles.applyButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.applyText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  {activeCount > 0
                    ? `Apply filters (${activeCount} active)`
                    : "Apply filters"}
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
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
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  divider: { height: 0.5, marginHorizontal: 16 },
  boldText: { fontWeight: "700" },
  // Sort — 2x2 grid
  sortGrid: { flexDirection: "row", gap: 10 },
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
  sortCardLabel: { fontSize: 13, fontWeight: "500" },
  // Category chips (wrap)
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  selectChipText: { fontSize: 14, fontWeight: "500" },
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
