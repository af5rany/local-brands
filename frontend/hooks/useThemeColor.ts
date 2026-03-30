/**
 * useThemeColor — Semantic color access for the entire app.
 *
 * Usage:
 *   const colors = useThemeColors();
 *   <View style={{ backgroundColor: colors.surface }} />
 *
 * Or for a single color with override:
 *   const bg = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
 */

import { Colors, type ThemeColors, type ColorKey } from "@/constants/Colors";
import { useThemePreference } from "@/context/ThemeContext";

/**
 * Returns the full themed color object for the current scheme.
 * This is the primary hook most components should use.
 */
export function useThemeColors(): ThemeColors {
  const { scheme } = useThemePreference();
  return Colors[scheme];
}

/**
 * Returns a single themed color, with optional per-scheme overrides.
 * Useful when a component needs to deviate from the global palette.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey,
): string {
  const { scheme } = useThemePreference();
  const colorFromProps = props[scheme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[scheme][colorName];
}
