export type ProductCategory = "vegetables" | "fruits" | "grains";

export type NutritionInfo = {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
};

export type FarmProduct = {
  id: number | string;
  name: string;
  category: ProductCategory;
  emoji: string;
  image?: string;
  price: number;
  unit: string;
  farmName: string;
  farmRegion: string;
  isOrganic: boolean;
  stockQuantity: number;
  description: string;
  nutrition: NutritionInfo;
};

export const products: FarmProduct[] = [
  {
    id: 1,
    name: "Fresh Broccoli",
    category: "vegetables",
    emoji: "🥦",
    price: 12,
    unit: "kg",
    farmName: "Mensah Family Farms",
    farmRegion: "Volta Region",
    isOrganic: true,
    stockQuantity: 80,
    description: "Crisp, green broccoli florets harvested this morning for soups and stir-fries.",
    nutrition: { calories: 34, protein: 2.8, fat: 0.4, carbohydrates: 6.6 },
  },
  {
    id: 2,
    name: "Sweet Corn",
    category: "vegetables",
    emoji: "🌽",
    price: 8,
    unit: "cob",
    farmName: "Boateng Farms",
    farmRegion: "Ashanti Region",
    isOrganic: false,
    stockQuantity: 140,
    description: "Juicy sweet corn with full kernels, ideal for grilling and boiling.",
    nutrition: { calories: 86, protein: 3.2, fat: 1.2, carbohydrates: 19 },
  },
  {
    id: 3,
    name: "Organic Carrots",
    category: "vegetables",
    emoji: "🥕",
    price: 9,
    unit: "kg",
    farmName: "Akosua Organics",
    farmRegion: "Eastern Region",
    isOrganic: true,
    stockQuantity: 95,
    description: "Naturally sweet organic carrots packed with crunch for salads and stews.",
    nutrition: { calories: 41, protein: 0.9, fat: 0.2, carbohydrates: 9.6 },
  },
  {
    id: 4,
    name: "Tomatoes",
    category: "vegetables",
    emoji: "🍅",
    price: 15,
    unit: "kg",
    farmName: "Northern Fresh Co",
    farmRegion: "Northern Region",
    isOrganic: false,
    stockQuantity: 120,
    description: "Ripe red tomatoes with balanced acidity for sauces, soups, and salads.",
    nutrition: { calories: 18, protein: 0.9, fat: 0.2, carbohydrates: 3.9 },
  },
  {
    id: 5,
    name: "Garden Eggs",
    category: "vegetables",
    emoji: "🍆",
    price: 10,
    unit: "kg",
    farmName: "Volta Greens",
    farmRegion: "Volta Region",
    isOrganic: false,
    stockQuantity: 70,
    description: "Fresh garden eggs with a mild flavor perfect for sauces and local dishes.",
    nutrition: { calories: 25, protein: 1, fat: 0.2, carbohydrates: 5.9 },
  },
  {
    id: 6,
    name: "Mandarin Oranges",
    category: "fruits",
    emoji: "🍊",
    price: 18.5,
    unit: "dozen",
    farmName: "Brong Citrus Farm",
    farmRegion: "Bono Region",
    isOrganic: false,
    stockQuantity: 60,
    description: "Sweet mandarin oranges with bright citrus notes and easy-peel skin.",
    nutrition: { calories: 53, protein: 0.8, fat: 0.3, carbohydrates: 13.3 },
  },
  {
    id: 7,
    name: "Ripe Plantain",
    category: "fruits",
    emoji: "🍌",
    price: 6,
    unit: "piece",
    farmName: "Akosua Farms",
    farmRegion: "Central Region",
    isOrganic: false,
    stockQuantity: 200,
    description: "Golden ripe plantains, perfect for frying, roasting, or boiling.",
    nutrition: { calories: 122, protein: 1.3, fat: 0.4, carbohydrates: 31.9 },
  },
  {
    id: 8,
    name: "Pineapple",
    category: "fruits",
    emoji: "🍍",
    price: 22,
    unit: "each",
    farmName: "Coastal Fresh",
    farmRegion: "Western Region",
    isOrganic: false,
    stockQuantity: 45,
    description: "Tropical pineapple with fragrant sweetness and juicy flesh.",
    nutrition: { calories: 50, protein: 0.5, fat: 0.1, carbohydrates: 13.1 },
  },
  {
    id: 9,
    name: "Papaya",
    category: "fruits",
    emoji: "🥭",
    price: 18,
    unit: "each",
    farmName: "Mensah Family Farms",
    farmRegion: "Volta Region",
    isOrganic: true,
    stockQuantity: 52,
    description: "Soft, naturally sweet papaya rich in color and ideal for smoothies.",
    nutrition: { calories: 43, protein: 0.5, fat: 0.3, carbohydrates: 10.8 },
  },
  {
    id: 10,
    name: "Brown Rice",
    category: "grains",
    emoji: "🍚",
    price: 35,
    unit: "5kg bag",
    farmName: "Northern Grains Co",
    farmRegion: "Upper East Region",
    isOrganic: false,
    stockQuantity: 88,
    description: "Whole grain brown rice with a nutty aroma and hearty texture.",
    nutrition: { calories: 111, protein: 2.6, fat: 0.9, carbohydrates: 23 },
  },
  {
    id: 11,
    name: "Millet",
    category: "grains",
    emoji: "🌾",
    price: 28,
    unit: "5kg bag",
    farmName: "Savannah Mills",
    farmRegion: "Northern Region",
    isOrganic: false,
    stockQuantity: 77,
    description: "Cleaned millet grains suitable for porridge, couscous, and flour blends.",
    nutrition: { calories: 119, protein: 3.5, fat: 1, carbohydrates: 23.7 },
  },
  {
    id: 12,
    name: "Oats",
    category: "grains",
    emoji: "🥣",
    price: 30,
    unit: "kg",
    farmName: "Highlands Grain",
    farmRegion: "Ashanti Region",
    isOrganic: true,
    stockQuantity: 64,
    description: "Organic rolled oats for breakfast bowls, baking, and healthy snacks.",
    nutrition: { calories: 389, protein: 16.9, fat: 6.9, carbohydrates: 66.3 },
  },
  {
    id: 13,
    name: "Corn Flour",
    category: "grains",
    emoji: "🌽",
    price: 20,
    unit: "kg",
    farmName: "Northern Grains Co",
    farmRegion: "Upper East Region",
    isOrganic: false,
    stockQuantity: 110,
    description: "Fine corn flour milled for banku, porridge, and baked recipes.",
    nutrition: { calories: 361, protein: 6.9, fat: 3.9, carbohydrates: 76.9 },
  },
];

export const formatGhs = (value: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
