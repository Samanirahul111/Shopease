export type SizePresetType = "apparel" | "footwear" | "none";

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FOOTWEAR_SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function detectSizePreset(categoryName?: string, categorySlug?: string): SizePresetType {
  const source = `${normalize(categoryName || "")} ${normalize(categorySlug || "")}`;

  if (/(shoe|sneaker|footwear|slipper|sandals|heels|boot)/.test(source)) {
    return "footwear";
  }

  if (/(fashion|cloth|apparel|kurti|shirt|t-shirt|tshirt|jeans|dress|top|hoodie|jacket|pant|trouser)/.test(source)) {
    return "apparel";
  }

  return "none";
}

export function getSizesForPreset(preset: SizePresetType): string[] {
  if (preset === "apparel") return APPAREL_SIZES;
  if (preset === "footwear") return FOOTWEAR_SIZES;
  return [];
}

export function getPresetLabel(preset: SizePresetType): string {
  if (preset === "apparel") return "Clothing Sizes";
  if (preset === "footwear") return "Shoe Sizes";
  return "";
}
