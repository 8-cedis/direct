import { Product } from "../types";
import { FarmProduct, ProductCategory } from "./products";
import { supabase } from "./supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzttxlhuecvyeldhmcqc.supabase.co";
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET || "alfred";
const BUCKET_URL = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_NAME}`;

const categoryMatchers: Array<{ category: ProductCategory; regex: RegExp }> = [
  {
    category: "vegetables",
    regex: /(tomato|carrot|broccoli|lettuce|onion|pepper|cabbage|spinach|okra|corn|garden.egg|plantain)/,
  },
  {
    category: "fruits",
    regex: /(apple|orange|banana|pineapple|mango|papaya|grape|berry|watermelon|avocado)/,
  },
  {
    category: "grains",
    regex: /(rice|grain|maize|millet|wheat|oats|flour|barley|sorghum|kenkey|cassava)/,
  },
];

const categoryEmoji: Record<ProductCategory, string> = {
  vegetables: "🥬",
  fruits: "🍊",
  grains: "🌾",
};

const productEmojis: Record<string, string> = {
  mango: "🥭",
  orange: "🍊",
  tomato: "🍅",
  carrot: "🥕",
  broccoli: "🥦",
  onion: "🧅",
  pepper: "🌶️",
  corn: "🌽",
  apple: "🍎",
  banana: "🍌",
  pineapple: "🍍",
  grape: "🍇",
  watermelon: "🍉",
  avocado: "🥑",
  potato: "🥔",
  garlic: "🧄",
  mushroom: "🍄",
  lemon: "🍋",
  strawberry: "🍓",
};

const resolveEmoji = (productName: string, category: ProductCategory): string => {
  const name = productName.toLowerCase();
  for (const [key, emoji] of Object.entries(productEmojis)) {
    if (name.includes(key)) {
      return emoji;
    }
  }
  return categoryEmoji[category];
};

const resolveCategory = (product: Product): ProductCategory => {
  const explicitCategory = String((product as Product & { category?: string }).category || "").toLowerCase();
  if (explicitCategory === "vegetables" || explicitCategory === "fruits" || explicitCategory === "grains") {
    return explicitCategory;
  }

  const source = `${product.name || ""} ${product.description || ""}`.toLowerCase();
  const matched = categoryMatchers.find(({ regex }) => regex.test(source));
  return matched?.category || "vegetables";
};

/** Resolve image URL — handles both full https:// URLs and bare storage paths */
const resolveImageUrl = (image: string | null | undefined): string | undefined => {
  if (!image) return undefined;

  // Clean up the image string (remove accidental quotes or whitespace)
  const cleanImage = image.trim().replace(/^["']|["']$/g, "");

  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    return cleanImage;
  }

  // Bare storage path e.g. "tomatoes/tomatoes-123.jpg" → build full URL
  return `${BUCKET_URL}/${cleanImage.replace(/^\//, "")}`;
};

export const toStorefrontProduct = (product: Product): FarmProduct => {
  const category = resolveCategory(product);
  const parsedPrice = Number(product.price || 0);
  const parsedStock = Number(product.stock || 0);
  const raw = product as Product & {
    category?: string;
    organic?: boolean;
    farm_name?: string;
    region?: string;
    unit?: string;
  };

  return {
    id: product.id,
    name: product.name,
    category,
    emoji: resolveEmoji(product.name, category),
    image: resolveImageUrl(product.image),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    unit: raw.unit || "unit",
    farmName: raw.farm_name || "FarmDirect Partner Farm",
    farmRegion: raw.region || "Ghana",
    isOrganic: Boolean(raw.organic),
    stockQuantity: Number.isFinite(parsedStock) ? Math.max(0, parsedStock) : 0,
    description: product.description || "Fresh farm produce from trusted local partners.",
    nutrition: {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
    },
  };
};

export const toStorefrontProducts = (products: Product[]): FarmProduct[] => products.map(toStorefrontProduct);

export const fetchStorefrontProducts = async (): Promise<FarmProduct[]> => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, image, price, stock, category, organic, farm_name, region, unit, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return toStorefrontProducts((data || []) as Product[]);
};

