import React, { useRef, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Slide {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: "welcome",
    icon: "cube-outline",
    eyebrow: "WELCOME TO",
    title: "MONOLITH",
    body: "A curated marketplace for independent fashion brands. Small-batch, traceable, built to last.",
  },
  {
    key: "browse",
    icon: "grid-outline",
    eyebrow: "DISCOVER",
    title: "BROWSE\nTHE ARCHIVE",
    body: "Explore pieces from studios worldwide. Filter by brand, category, or mood. Every item has a story.",
  },
  {
    key: "brands",
    icon: "heart-outline",
    eyebrow: "CONNECT",
    title: "FOLLOW\nYOUR BRANDS",
    body: "Follow the studios you love. Get notified on drops, restocks, and behind-the-scenes content.",
  },
  {
    key: "shop",
    icon: "bag-outline",
    eyebrow: "COLLECT",
    title: "SHOP WITH\nINTENTION",
    body: "Secure checkout, global shipping, and AI-powered try-on. Every purchase supports independent makers.",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingWalkthrough({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { paddingTop: insets.top + 60 }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={40} color={colors.text} />
      </View>
      <Text style={styles.eyebrow}>{item.eyebrow}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  );

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
        {/* Skip */}
        <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? "GET STARTED" : "NEXT"}
          </Text>
          {!isLast && (
            <Ionicons name="arrow-forward" size={14} color={colors.primaryForeground} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    slide: {
      width: SCREEN_W,
      paddingHorizontal: 32,
      justifyContent: "center",
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 3,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    title: {
      fontSize: 36,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -1,
      lineHeight: 38,
      textTransform: "uppercase",
      marginBottom: 20,
    },
    body: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      maxWidth: 300,
    },

    // Controls
    controls: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      gap: 20,
      alignItems: "center",
    },
    dots: {
      flexDirection: "row",
      gap: 10,
    },
    dot: {
      width: 8,
      height: 8,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    skipBtn: {
      position: "absolute",
      left: 24,
      bottom: 28,
    },
    skipText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    nextBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    nextText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primaryForeground,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
  });
