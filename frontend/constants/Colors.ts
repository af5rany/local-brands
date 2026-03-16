/**
 * Local Brands — Design System Colors
 *
 * AESTHETIC: "Refined Commerce"
 * A warm, confident palette that feels premium without being cold.
 * Inspired by high-end retail apps (Farfetch, SSENSE) but with
 * warmth and approachability for local brands.
 *
 * PRIMARY: Deep Indigo (#4338CA) — trust, quality, depth
 * ACCENT: Warm Amber (#F59E0B) — energy, discovery, delight
 * SUCCESS: Emerald (#059669)
 * DANGER: Rose (#E11D48)
 *
 * The system uses semantic naming so components never reference
 * raw hex values. Every color has a purpose.
 */

export const Colors = {
  light: {
    // ── Core Brand ──────────────────────────────────────
    primary: "#4338CA", // Deep Indigo — buttons, links, active states
    primaryMuted: "#6366F1", // Lighter indigo — hover, secondary actions
    primarySoft: "#EEF2FF", // Indigo tint — subtle backgrounds, badges
    primaryForeground: "#FFFFFF", // Text on primary

    accent: "#F59E0B", // Warm Amber — highlights, badges, CTAs
    accentSoft: "#FEF3C7", // Amber tint — notification badges, tags
    accentForeground: "#78350F", // Text on accent backgrounds

    // ── Surfaces ────────────────────────────────────────
    background: "#FAFAF9", // Warm off-white — main app background
    surface: "#FFFFFF", // Cards, modals, elevated content
    surfaceRaised: "#F5F5F4", // Slightly raised — input fields, chips
    surfaceOverlay: "rgba(0, 0, 0, 0.4)", // Modal backdrops

    // ── Typography ──────────────────────────────────────
    text: "#1C1917", // Primary text — Stone 900
    textSecondary: "#57534E", // Secondary text — Stone 600
    textTertiary: "#A8A29E", // Muted text — Stone 400
    textInverse: "#FAFAF9", // Text on dark backgrounds

    // ── Borders & Dividers ──────────────────────────────
    border: "#E7E5E4", // Default border — Stone 200
    borderLight: "#F5F5F4", // Subtle dividers — Stone 100
    borderFocus: "#4338CA", // Focus rings

    // ── Feedback ────────────────────────────────────────
    success: "#059669", // Emerald 600
    successSoft: "#D1FAE5", // Emerald 100
    danger: "#E11D48", // Rose 600
    dangerSoft: "#FFE4E6", // Rose 100
    warning: "#D97706", // Amber 600
    warningSoft: "#FEF3C7", // Amber 100
    info: "#0284C7", // Sky 600
    infoSoft: "#E0F2FE", // Sky 100

    // ── Component-Specific ──────────────────────────────
    tabActive: "#4338CA",
    tabInactive: "#A8A29E",
    tabActiveBackground: "#4338CA",
    tabInactiveBackground: "#F5F5F4",

    chipBackground: "#F5F5F4",
    chipActiveBackground: "#4338CA",
    chipBorder: "#E7E5E4",
    chipText: "#57534E",
    chipActiveText: "#FFFFFF",

    cardShadow: "rgba(28, 25, 23, 0.08)",
    cardBorder: "#F5F5F4",

    wishlistHeart: "#E11D48",
    discountBadge: "#E11D48",
    priceCurrent: "#059669",
    priceOriginal: "#A8A29E",

    skeleton: "#E7E5E4",
    skeletonHighlight: "#F5F5F4",

    // ── Navigation & Status Bar ─────────────────────────
    statusBar: "dark-content",
    headerBackground: "#FAFAF9",
    bottomTabBackground: "#FFFFFF",
    bottomTabBorder: "#F5F5F4",
  },

  dark: {
    // ── Core Brand ──────────────────────────────────────
    primary: "#818CF8", // Lighter Indigo for dark mode
    primaryMuted: "#6366F1",
    primarySoft: "rgba(99, 102, 241, 0.15)",
    primaryForeground: "#FFFFFF",

    accent: "#FBBF24", // Brighter Amber for contrast
    accentSoft: "rgba(251, 191, 36, 0.15)",
    accentForeground: "#FEF3C7",

    // ── Surfaces ────────────────────────────────────────
    background: "#0C0A09", // Deep warm black — Stone 950
    surface: "#1C1917", // Cards — Stone 900
    surfaceRaised: "#292524", // Elevated — Stone 800
    surfaceOverlay: "rgba(0, 0, 0, 0.7)",

    // ── Typography ──────────────────────────────────────
    text: "#FAFAF9", // Primary text — Stone 50
    textSecondary: "#D6D3D1", // Secondary — Stone 300
    textTertiary: "#78716C", // Muted — Stone 500
    textInverse: "#1C1917",

    // ── Borders & Dividers ──────────────────────────────
    border: "#292524", // Stone 800
    borderLight: "#1C1917", // Stone 900
    borderFocus: "#818CF8",

    // ── Feedback ────────────────────────────────────────
    success: "#34D399",
    successSoft: "rgba(52, 211, 153, 0.15)",
    danger: "#FB7185",
    dangerSoft: "rgba(251, 113, 133, 0.15)",
    warning: "#FBBF24",
    warningSoft: "rgba(251, 191, 36, 0.15)",
    info: "#38BDF8",
    infoSoft: "rgba(56, 189, 248, 0.15)",

    // ── Component-Specific ──────────────────────────────
    tabActive: "#818CF8",
    tabInactive: "#78716C",
    tabActiveBackground: "rgba(99, 102, 241, 0.15)",
    tabInactiveBackground: "#1C1917",

    chipBackground: "#1C1917",
    chipActiveBackground: "#818CF8",
    chipBorder: "#292524",
    chipText: "#D6D3D1",
    chipActiveText: "#FFFFFF",

    cardShadow: "rgba(0, 0, 0, 0.3)",
    cardBorder: "#292524",

    wishlistHeart: "#FB7185",
    discountBadge: "#FB7185",
    priceCurrent: "#34D399",
    priceOriginal: "#78716C",

    skeleton: "#292524",
    skeletonHighlight: "#44403C",

    // ── Navigation & Status Bar ─────────────────────────
    statusBar: "light-content",
    headerBackground: "#0C0A09",
    bottomTabBackground: "#0C0A09",
    bottomTabBorder: "#1C1917",
  },
} as const;

// Type helper — uses string values so light/dark are interchangeable
export type ColorKey = keyof typeof Colors.light;
export type ThemeColors = Record<ColorKey, string>;
