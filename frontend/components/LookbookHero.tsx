// make this black and white and make the header have the split-invert effect where the text is white on the photo and black on the background. also add a "view all looks" button at the bottom that is a black border with white background and black text. also add some placeholder text above the button describing the collection. make sure to use the same fonts and spacing as the original design. also make sure to use the same images as the original design, but you can use placeholder images if you don't have access to them. also make sure to use the same layout as the original design, but you can adjust it if necessary to fit the new content. also make sure to use the same colors as the original design, but you can adjust them if necessary to fit the new content. also make sure to use the same typography as the original design, but you can adjust it if necessary to fit the new content.

/**
 * LookbookHero.jsx
 *
 * Drop-in React Native section component.
 * The headline "UNSTABLE EQUILIBRIUM" uses a split-invert trick:
 *  - Black text rendered over the white (off-background) region
 *  - White text clipped to sit only over the photo area via MaskedView
 *
 * Dependencies:
 *   npm install @react-native-masked-view/masked-view
 *   (expo: npx expo install @react-native-masked-view/masked-view)
 *
 * Usage:
 *   import LookbookHero from './LookbookHero';
 *   <LookbookHero />
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

const { width: SCREEN_W } = Dimensions.get("window");
const GAP = 8;

// ─── image sources ────────────────────────────────────────────────────────────
// Replace these URIs with your own local require() or remote URLs
const IMAGES = {
  heroLarge:
    "https://plus.unsplash.com/premium_photo-1764196701475-77e80516b77f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MnwtXzFucWE3bkRJOHx8ZW58MHx8fHx8",
  heroSmall:
    "https://images.unsplash.com/photo-1618247072881-40689e1318b5?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  mid1: "https://images.unsplash.com/photo-1605710988787-a2920d747d16?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  mid2: "https://images.unsplash.com/photo-1561989266-9b05d090cf9b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fGIlMjZ3JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D",
  wide: "https://plus.unsplash.com/premium_photo-1745928774656-f42b54c76b70?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  footerSmall:
    "https://images.unsplash.com/photo-1756655148941-8cb96b6da087?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YiUyNnclMjBmYXNoaW9uJTIwZ2lybHxlbnwwfHwwfHx8MA%3D%3D",
  footerLarge:
    "https://images.unsplash.com/photo-1746477847401-2466595fab19?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

// ─── dimensions ──────────────────────────────────────────────────────────────
const LARGE_COL = Math.floor((SCREEN_W * 8) / 12);
const SMALL_COL = SCREEN_W - LARGE_COL - GAP;
const HERO_H = 420;
const SMALL_H = (HERO_H - GAP) / 2;

// ─── SplitInvertTitle ────────────────────────────────────────────────────────
/**
 * Renders the headline twice:
 *  Layer 1 (base)  – black text on the off-white background
 *  Layer 2 (mask)  – white text, masked so only the pixels that sit over
 *                    the photo column are visible
 *
 * The photo column is LARGE_COL wide and starts at x=0.
 * We clip the white layer to a rect that covers [0 .. LARGE_COL].
 */

function SplitInvertTitle({
  style,
  wrapperStyle,
}: {
  style?: any;
  wrapperStyle?: any;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const titleStyle = [styles.headline, style];

  const maskElement = (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: LARGE_COL - 34,
          backgroundColor: "black",
        }}
      />
    </View>
  );

  return (
    <View style={[styles.titleWrapper, wrapperStyle]} pointerEvents="none">
      <View style={{ position: "absolute", left: 20, right: 0, bottom: "6%" }}>
        {Platform.OS === "web" ? (
          // Web: mixBlendMode 'difference' — white text appears white over dark
          // image and inverts to black over the light background area.
          <Text
            style={[
              titleStyle,
              { color: "#fff", mixBlendMode: "difference" } as any,
            ]}
          >
            {"UNSTABLE\nEQUILIBRIUM"}
          </Text>
        ) : (
          // Native: MaskedView — render black text as base, then overlay white
          // text clipped to the photo column only (left LARGE_COL - padding px).
          <>
            <Text style={[titleStyle, { color: colors.text }]}>
              {"UNSTABLE\nEQUILIBRIUM"}
            </Text>
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={maskElement}
            >
              <Text style={[titleStyle, { color: colors.textInverse }]}>
                {"UNSTABLE\nEQUILIBRIUM"}
              </Text>
            </MaskedView>
          </>
        )}
      </View>
    </View>
  );
}

// ─── LookbookHero ────────────────────────────────────────────────────────────
export default function LookbookHero() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── Collection label ── */}
      <Text style={styles.collectionLabel}>AW '25 COLLECTION</Text>

      {/* ── Row 1: large portrait + small square — headline overlaid inside ── */}
      <View style={styles.row}>
        <Image
          source={{ uri: IMAGES.heroLarge }}
          style={[styles.heroLarge]}
          resizeMode="cover"
        />
        <View style={{ gap: GAP }}>
          <Image
            source={{ uri: IMAGES.heroSmall }}
            style={styles.heroSmall}
            resizeMode="cover"
          />
          {/* empty space below small image matches bottom half */}
          <View style={{ width: SMALL_COL, height: SMALL_H }} />
        </View>
        {/* Headline is a child of the image row so mixBlendMode blends
                    against the image pixels in the same stacking context */}
                    <SplitInvertTitle wrapperStyle={styles.titleOverlay} />
      </View>

      {/* ── Row 2: offset — left empty 1/3, right 2 images ── */}
      <View style={[styles.row, { marginTop: 16 }]}>
        <View style={{ width: SMALL_COL }} />
        <View style={[styles.row, { flex: 1, gap: GAP }]}>
          <Image
            source={{ uri: IMAGES.mid1 }}
            style={styles.midImage}
            resizeMode="cover"
          />
          <Image
            source={{ uri: IMAGES.mid2 }}
            style={styles.midImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* ── Row 3: cinematic full-width ── */}
      <Image
        source={{ uri: IMAGES.wide }}
        style={styles.wideImage}
        resizeMode="cover"
      />

      {/* ── Row 4: small left + large right (mirror of Row 1) ── */}
      <View style={[styles.row, { marginTop: GAP }]}>
        <View style={{ gap: GAP }}>
          <Image
            source={{ uri: IMAGES.footerSmall }}
            style={styles.heroSmall}
            resizeMode="cover"
          />
          <View style={{ width: SMALL_COL, height: SMALL_H }} />
        </View>
        <Image
          source={{ uri: IMAGES.footerLarge }}
          style={styles.heroLarge}
          resizeMode="cover"
        />
      </View>

      {/* ── Footer text ── */}
      <View style={styles.footer}>
        <Text style={styles.footerBody}>
          The AW '25 collection explores the tension between structural rigidity
          and fluid motion. Deconstructed silhouettes. Monochromatic resolve.
        </Text>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>VIEW ALL LOOKS</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    collectionLabel: {
      fontFamily: "System",
      fontSize: 10,
      letterSpacing: 2,
      fontWeight: "500",
      color: colors.text,
      textTransform: "uppercase",
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
    },

    // ── rows ──
    row: {
      flexDirection: "row",
      gap: GAP,
      paddingHorizontal: 0,
      // Required on web: CSS default is position:static, so absolute children
      // won't anchor here without explicitly setting relative. RN defaults to
      // relative already, so this is a no-op on native.
      position: "relative",
      // The flex gap between image columns is transparent; the row's
      // backgroundColor fills it. Using colors.text (black ↔ white) makes the
      // gap the inverse of the page background, extending the split-invert look.
    //   backgroundColor: colors.text,
    },

    // ── images ──
    heroLarge: {
      width: LARGE_COL,
      height: HERO_H,
    },
    heroSmall: {
      width: SMALL_COL,
      height: SMALL_H,
    },
    midImage: {
      flex: 1,
      aspectRatio: 3 / 4,
    },
    wideImage: {
      width: SCREEN_W,
      height: SCREEN_W * (9 / 16),
      marginTop: GAP,
    },

    titleWrapper: {
      // No overflow:hidden — that creates a new CSS stacking context on web
      // which breaks mixBlendMode (text would blend against wrapper's own
      // transparent bg instead of the images behind it).
      width: SCREEN_W,
      paddingHorizontal: 14,
      height: 110,
    },
    titleOverlay: {
      // Position the headline as an absolute overlay inside the image row
      // so it sits over the photos in the same stacking context.
      position: "absolute",
      left: 20,
      right: 0,
      bottom: 0,
      height: 110,
      paddingHorizontal: 14,
    },
    headline: {
      fontSize: 56,
      fontWeight: "900",
      letterSpacing: -2.5,
      lineHeight: 52, // 56 * 0.92 — RN uses absolute px, not a multiplier
      textTransform: "uppercase",
      fontFamily: "System",
      paddingHorizontal: 12,
    },
    // maskShape: {
    //   // covers only the large-photo column width
    //   position: "absolute",
    //   left: 0,
    //   top: 0,
    //   bottom: 0,
    //   width: LARGE_COL - 14, // subtract left padding
    //   backgroundColor: "black", // opaque = shows through mask
    // },

    // ── footer ──
    footer: {
      marginHorizontal: 16,
      marginTop: 32,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginBottom: 40,
      gap: 20,
    },
    footerBody: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: "System",
    },
    ctaButton: {
      alignSelf: "flex-end",
      borderWidth: 1,
      borderColor: colors.text,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    ctaText: {
      fontSize: 11,
      letterSpacing: 2,
      fontWeight: "600",
      textTransform: "uppercase",
      color: colors.text,
    },
  });
