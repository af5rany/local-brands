/**
 * Local Brands — Design System Colors
 *
 * AESTHETIC: "Minimalist Fashion"
 * A stark black-and-white palette inspired by Zara, SSENSE, and
 * high-fashion editorial design. Clean, bold, zero noise.
 *
 * PRIMARY: Black (#000000) — authority, fashion, clarity
 * ACCENT: Black (#000000) — monochrome by design
 * Functional color is used sparingly — only where UX demands it
 * (sale prices, error states, stock indicators).
 *
 * The system uses semantic naming so components never reference
 * raw hex values. Every color has a purpose.
 */

export const Colors = {
  light: {
    // ── Core Brand ──────────────────────────────────────
    primary: "#000000", // Black — buttons, links, active states
    primaryMuted: "#333333", // Softer black — hover, secondary actions
    primarySoft: "#F5F5F5", // Light grey — subtle backgrounds, badges
    primaryForeground: "#FFFFFF", // Text on primary

    accent: "#000000", // Same as primary — monochrome system
    accentSoft: "#F5F5F5", // Light grey — tags, badges
    accentForeground: "#000000", // Text on accent backgrounds

    // ── Surfaces ────────────────────────────────────────
    background: "#FFFFFF", // Pure white — main app background
    surface: "#FFFFFF", // Cards, modals, elevated content
    surfaceRaised: "#F7F7F7", // Barely-there grey — input fields, chips
    surfaceOverlay: "rgba(0, 0, 0, 0.5)", // Modal backdrops

    // ── Typography ──────────────────────────────────────
    text: "#000000", // Primary text — pure black
    textSecondary: "#666666", // Secondary text
    textTertiary: "#999999", // Muted text
    textInverse: "#FFFFFF", // Text on dark backgrounds

    // ── Borders & Dividers ──────────────────────────────
    border: "#E5E5E5", // Default border
    borderLight: "#F0F0F0", // Subtle dividers
    borderFocus: "#000000", // Focus rings

    // ── Feedback ────────────────────────────────────────
    success: "#1A1A1A", // Near-black — keeps the monochrome feel
    successSoft: "#F5F5F5",
    danger: "#C41E3A", // Deep red — only for errors and sale prices
    dangerSoft: "#FFF0F2",
    warning: "#8B6914", // Muted gold
    warningSoft: "#FFF9E6",
    info: "#1A1A1A",
    infoSoft: "#F5F5F5",

    // ── Component-Specific ──────────────────────────────
    tabActive: "#000000",
    tabInactive: "#BBBBBB",
    tabActiveBackground: "#000000",
    tabInactiveBackground: "#F7F7F7",

    chipBackground: "#F7F7F7",
    chipActiveBackground: "#000000",
    chipBorder: "#E5E5E5",
    chipText: "#666666",
    chipActiveText: "#FFFFFF",

    cardShadow: "rgba(0, 0, 0, 0.06)",
    cardBorder: "#F0F0F0",

    wishlistHeart: "#000000",
    discountBadge: "#C41E3A",
    priceCurrent: "#000000",
    priceOriginal: "#999999",

    skeleton: "#F0F0F0",
    skeletonHighlight: "#F7F7F7",

    // ── Navigation & Status Bar ─────────────────────────
    statusBar: "dark-content",
    headerBackground: "#FFFFFF",
    bottomTabBackground: "#FFFFFF",
    bottomTabBorder: "#F0F0F0",

    // ── Misc ─────────────────────────────────────────────
    icon: "#000000",
    tint: "#000000",
    link: "#3152d3", // Links / size guide

    // ── Toast Notifications ────────────────────────────
    toastSuccess: "#10b981",
    toastError: "#ef4444",
    toastInfo: "#3b82f6",
    toastDefault: "#1e293b",
    toastText: "#FFFFFF",

    // ── Monolith Design System Surfaces ──────────────────
    surfaceContainer: "#eeeeee",
    surfaceContainerLow: "#f3f3f4",
    surfaceContainerHighest: "#e2e2e2",
    outlineVariant: "#c6c6c6",
    tertiary: "#7d001d",
    tertiaryFixed: "#ba1434",
    accentRed: "#C41E3A",
    onSurfaceVariant: "#474747",
  },

  dark: {
    // ── Core Brand ──────────────────────────────────────
    primary: "#FFFFFF", // White on dark — inverted
    primaryMuted: "#CCCCCC",
    primarySoft: "rgba(255, 255, 255, 0.08)",
    primaryForeground: "#000000", // Text on primary

    accent: "#FFFFFF",
    accentSoft: "rgba(255, 255, 255, 0.08)",
    accentForeground: "#FFFFFF",

    // ── Surfaces ────────────────────────────────────────
    background: "#000000", // Pure black
    surface: "#111111", // Cards — near black
    surfaceRaised: "#1A1A1A", // Elevated
    surfaceOverlay: "rgba(0, 0, 0, 0.7)",

    // ── Typography ──────────────────────────────────────
    text: "#FFFFFF", // Primary text — pure white
    textSecondary: "#AAAAAA", // Secondary
    textTertiary: "#666666", // Muted
    textInverse: "#000000",

    // ── Borders & Dividers ──────────────────────────────
    border: "#222222",
    borderLight: "#111111",
    borderFocus: "#FFFFFF",

    // ── Feedback ────────────────────────────────────────
    success: "#FFFFFF",
    successSoft: "rgba(255, 255, 255, 0.08)",
    danger: "#FF4D6A",
    dangerSoft: "rgba(255, 77, 106, 0.12)",
    warning: "#D4A926",
    warningSoft: "rgba(212, 169, 38, 0.12)",
    info: "#FFFFFF",
    infoSoft: "rgba(255, 255, 255, 0.08)",

    // ── Component-Specific ──────────────────────────────
    tabActive: "#FFFFFF",
    tabInactive: "#555555",
    tabActiveBackground: "rgba(255, 255, 255, 0.1)",
    tabInactiveBackground: "#111111",

    chipBackground: "#1A1A1A",
    chipActiveBackground: "#FFFFFF",
    chipBorder: "#222222",
    chipText: "#AAAAAA",
    chipActiveText: "#000000",

    cardShadow: "rgba(0, 0, 0, 0.4)",
    cardBorder: "#222222",

    wishlistHeart: "#FFFFFF",
    discountBadge: "#FF4D6A",
    priceCurrent: "#FFFFFF",
    priceOriginal: "#666666",

    skeleton: "#1A1A1A",
    skeletonHighlight: "#222222",

    // ── Navigation & Status Bar ─────────────────────────
    statusBar: "light-content",
    headerBackground: "#000000",
    bottomTabBackground: "#000000",
    bottomTabBorder: "#111111",

    // ── Misc ─────────────────────────────────────────────
    icon: "#FFFFFF",
    tint: "#FFFFFF",
    link: "#6B8AFF", // Links / size guide

    // ── Toast Notifications ────────────────────────────
    toastSuccess: "#10b981",
    toastError: "#ef4444",
    toastInfo: "#3b82f6",
    toastDefault: "#334155",
    toastText: "#FFFFFF",

    // ── Monolith Design System Surfaces ──────────────────
    surfaceContainer: "#1a1a1a",
    surfaceContainerLow: "#111111",
    surfaceContainerHighest: "#222222",
    outlineVariant: "#333333",
    tertiary: "#ff4d6a",
    tertiaryFixed: "#ff6b82",
    accentRed: "#ff4d6a",
    onSurfaceVariant: "#aaaaaa",
  },
} as const;

// Type helper — uses string values so light/dark are interchangeable
export type ColorKey = keyof typeof Colors.light;
export type ThemeColors = Record<ColorKey, string>;
