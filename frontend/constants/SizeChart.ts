import { ProductType } from "@/types/enums";

// Size options per product type
export const SIZE_CHART: Record<string, string[]> = {
  [ProductType.SHOES]: [
    "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
  ],
  [ProductType.SHIRTS]: ["XS", "S", "M", "L", "XL", "XXL"],
  [ProductType.HOODIES]: ["XS", "S", "M", "L", "XL", "XXL"],
  [ProductType.JACKETS]: ["XS", "S", "M", "L", "XL", "XXL"],
  [ProductType.PANTS]: ["28", "30", "32", "34", "36", "38", "40"],
  [ProductType.HATS]: ["S", "M", "L"],
  [ProductType.BAGS]: [],
  [ProductType.ACCESSORIES]: [],
  [ProductType.TSHIRTS]: ["XS", "S", "M", "L", "XL", "XXL"],
};

// Color palette for variant color picker
export const COLOR_PALETTE = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#E53935" },
  { name: "Blue", hex: "#1E88E5" },
  { name: "Navy", hex: "#1A237E" },
  { name: "Green", hex: "#43A047" },
  { name: "Grey", hex: "#9E9E9E" },
  { name: "Brown", hex: "#6D4C41" },
  { name: "Beige", hex: "#D7CCC8" },
  { name: "Pink", hex: "#EC407A" },
  { name: "Yellow", hex: "#FDD835" },
  { name: "Orange", hex: "#FB8C00" },
  { name: "Purple", hex: "#8E24AA" },
  { name: "Olive", hex: "#827717" },
  { name: "Burgundy", hex: "#880E4F" },
  { name: "Tan", hex: "#D2B48C" },
];

export function getSizesForProductType(productType?: string): string[] {
  if (!productType) return [];
  return SIZE_CHART[productType] || [];
}
