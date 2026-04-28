/**
 * LookbookHero — AW '25 Collection editorial section.
 *
 * Split-invert headline: dark text base (visible on light #f5f4f2 spacer),
 * white text clipped to the image column via overflow:hidden.
 * imageColWidth measured via onLayout — no hardcoded offsets.
 */

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

const IMAGES = {
  heroLarge:
    "https://plus.unsplash.com/premium_photo-1764196701475-77e80516b77f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MnwtXzFucWE3bkRJOHx8ZW58MHx8fHx8",
  heroSmall:
    "https://images.unsplash.com/photo-1618247072881-40689e1318b5?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  bottom1:
    "https://images.unsplash.com/photo-1605710988787-a2920d747d16?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  bottom2:
    "https://images.unsplash.com/photo-1561989266-9b05d090cf9b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fGIlMjZ3JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D",
};

const IMAGE_W = Math.floor((SCREEN_W * 2) / 3);
const RIGHT_W = SCREEN_W - IMAGE_W;
const ROW_H = IMAGE_W * 1.5; // 2:3 aspect ratio
const BOTTOM_PAD = 16;
const BOTTOM_GAP = 6;
const BOTTOM_IMG_SIZE = (SCREEN_W - BOTTOM_PAD * 2 - BOTTOM_GAP) / 2;

export default function LookbookHero() {
  const [imgW, setImgW] = useState(IMAGE_W);

  const headlineStyle = {
    fontSize: 56,
    fontWeight: "900" as const,
    letterSpacing: -2.5,
    lineHeight: 52,
    textTransform: "uppercase" as const,
  };

  return (
    <View style={styles.root}>
      {/* Eyebrow */}
      <Text style={styles.eyebrow}>AW '25 COLLECTION</Text>

      {/* Top row — images + headline overlay */}
      <View style={styles.topRow}>
        {/* Left: big portrait (2/3 width) */}
        <Image
          source={{ uri: IMAGES.heroLarge }}
          style={{ width: IMAGE_W, height: ROW_H }}
          resizeMode="cover"
          onLayout={(e) => setImgW(e.nativeEvent.layout.width)}
        />

        {/* Right column: portrait top half + light spacer bottom half */}
        <View style={{ width: RIGHT_W }}>
          <Image
            source={{ uri: IMAGES.heroSmall }}
            style={{ width: RIGHT_W, height: ROW_H / 2 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1, backgroundColor: "#f5f4f2" }} />
        </View>

        {/* ── Headline overlay — side-by-side split ── */}
        <View style={styles.headlineWrap} pointerEvents="none">
          <View style={{ flexDirection: "row" }}>
            {/* Left half: white text, clipped to image column */}
            <View style={{ width: imgW, overflow: "hidden" }}>
              <Text style={[headlineStyle, { color: "#fff", paddingLeft: 12 }]}>
                {"UNSTABLE\nEQUILIBRIUM"}
              </Text>
            </View>

            {/* Right half: dark text, shifted back so characters align */}
            <View style={{ flex: 1, overflow: "hidden" }}>
              <Text
                style={[
                  headlineStyle,
                  { color: "#1a1a1a", marginLeft: -(imgW - 12) },
                ]}
              >
                {"UNSTABLE\nEQUILIBRIUM"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom row: two 1:1 photos */}
      <View style={styles.bottomRow}>
        <Image
          source={{ uri: IMAGES.bottom1 }}
          style={{ flex: 1, aspectRatio: 1 }}
          resizeMode="cover"
        />
        <Image
          source={{ uri: IMAGES.bottom2 }}
          style={{ flex: 1, aspectRatio: 1 }}
          resizeMode="cover"
        />
      </View>

      {/* Caption + CTA */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          The collection explores tension between structural rigidity and fluid
          motion. Deconstructed silhouettes. Monochromatic resolve.
        </Text>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>VIEW ALL LOOKS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#f5f4f2",
    paddingTop: 32,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1a1a1a",
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  // ── top row ──
  topRow: {
    position: "relative",
    flexDirection: "row",
  },
  headlineWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "6%",
  },

  // ── bottom row ──
  bottomRow: {
    flexDirection: "row",
    gap: BOTTOM_GAP,
    paddingHorizontal: BOTTOM_PAD,
    marginTop: BOTTOM_GAP,
  },

  // ── caption ──
  caption: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  captionText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#444",
    marginBottom: 16,
  },
  ctaButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    height: 38,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#1a1a1a",
  },
});
