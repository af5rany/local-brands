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

import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    ScrollView,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_W } = Dimensions.get('window');
const GAP = 8;

// ─── image sources ────────────────────────────────────────────────────────────
// Replace these URIs with your own local require() or remote URLs
const IMAGES = {
    heroLarge:
        'https://plus.unsplash.com/premium_photo-1764196701475-77e80516b77f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MnwtXzFucWE3bkRJOHx8ZW58MHx8fHx8',
    heroSmall:
        'https://images.unsplash.com/photo-1618247072881-40689e1318b5?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    mid1: 'https://images.unsplash.com/photo-1605710988787-a2920d747d16?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    mid2: 'https://images.unsplash.com/photo-1561989266-9b05d090cf9b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fGIlMjZ3JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    wide: 'https://plus.unsplash.com/premium_photo-1745928774656-f42b54c76b70?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    footerSmall:
        'https://images.unsplash.com/photo-1756655148941-8cb96b6da087?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YiUyNnclMjBmYXNoaW9uJTIwZ2lybHxlbnwwfHwwfHx8MA%3D%3D',
    footerLarge:
        'https://images.unsplash.com/photo-1746477847401-2466595fab19?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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

function SplitInvertTitle({ style, wrapperStyle }: { style?: any; wrapperStyle?: any }) {
    const titleStyle = [styles.headline, style];

    const maskElement = (
        <View style={StyleSheet.absoluteFill}>
            <View
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: LARGE_COL - 14,
                    backgroundColor: "black",
                }}
            />
        </View>
    );

    return (
        // ✅ wrapperStyle goes here — so marginTop: -90 actually pulls it up
        <View style={[styles.titleWrapper, wrapperStyle]} pointerEvents="none">

            <Text style={[titleStyle, { color: "#1a1a1a" }]}>
                {"UNSTABLE\nEQUILIBRIUM"}
            </Text>

            <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={maskElement}
            >
                <Text style={[titleStyle, { color: "#ffffff" }]}>
                    {"UNSTABLE\nEQUILIBRIUM"}
                </Text>
            </MaskedView>

        </View>
    );
}

// ─── LookbookHero ────────────────────────────────────────────────────────────
export default function LookbookHero() {
    return (
        <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
            {/* ── Collection label ── */}
            <Text style={styles.collectionLabel}>AW '25 COLLECTION</Text>

            {/* ── Row 1: large portrait + small square ── */}
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
            </View>

            {/* ── Overlapping inverted headline ── */}
            <SplitInvertTitle wrapperStyle={{ marginTop: -90 }} />

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
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F4F2',
    },
    collectionLabel: {
        fontFamily: 'System',
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: '500',
        color: '#1a1a1a',
        textTransform: 'uppercase',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
    },

    // ── rows ──
    row: {
        flexDirection: 'row',
        gap: GAP,
        paddingHorizontal: 0,
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
        width: SCREEN_W,
        paddingHorizontal: 14,
        overflow: "hidden",
        height: 110,
    },
    headline: {
        fontSize: 52,
        fontWeight: '900',
        letterSpacing: -2,
        lineHeight: 52,
        textTransform: 'uppercase',
        fontFamily: 'System',
    },
    maskShape: {
        // covers only the large-photo column width
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: LARGE_COL - 14, // subtract left padding
        backgroundColor: 'black', // opaque = shows through mask
    },

    // ── footer ──
    footer: {
        marginHorizontal: 16,
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginBottom: 40,
        gap: 20,
    },
    footerBody: {
        fontSize: 13,
        lineHeight: 20,
        color: '#636262',
        fontFamily: 'System',
    },
    ctaButton: {
        alignSelf: 'flex-end',
        borderWidth: 1,
        borderColor: '#1a1a1a',
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    ctaText: {
        fontSize: 11,
        letterSpacing: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#1a1a1a',
    },
});