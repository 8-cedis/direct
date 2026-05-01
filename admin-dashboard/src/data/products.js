const baseProducts = [
  { emoji: "🥦", name: "Fresh Broccoli", category: "Vegetables", price: 12, unit: "kg", stock: 42, reorder: 15, farm: "Mensah Family Farms", region: "Volta Region", organic: true },
  { emoji: "🌽", name: "Sweet Corn", category: "Vegetables", price: 8, unit: "cob", stock: 118, reorder: 30, farm: "Boateng Farms", region: "Ashanti Region", organic: false },
  { emoji: "🥕", name: "Organic Carrots", category: "Vegetables", price: 9, unit: "kg", stock: 58, reorder: 20, farm: "Akosua Organics", region: "Eastern Region", organic: true },
  { emoji: "🍅", name: "Tomatoes", category: "Vegetables", price: 15, unit: "kg", stock: 28, reorder: 25, farm: "Northern Fresh Co", region: "Northern Region", organic: false },
  { emoji: "🍆", name: "Garden Eggs", category: "Vegetables", price: 10, unit: "kg", stock: 34, reorder: 18, farm: "Volta Greens", region: "Volta Region", organic: false },
  { emoji: "🍊", name: "Mandarin Oranges", category: "Fruits", price: 18.5, unit: "dozen", stock: 60, reorder: 20, farm: "Brong Citrus Farm", region: "Bono Region", organic: false },
  { emoji: "🍌", name: "Ripe Plantain", category: "Fruits", price: 6, unit: "piece", stock: 210, reorder: 60, farm: "Akosua Farms", region: "Central Region", organic: false },
  { emoji: "🍍", name: "Pineapple", category: "Fruits", price: 22, unit: "each", stock: 36, reorder: 15, farm: "Coastal Fresh", region: "Western Region", organic: false },
  { emoji: "🥭", name: "Papaya", category: "Fruits", price: 18, unit: "each", stock: 18, reorder: 12, farm: "Mensah Family Farms", region: "Volta Region", organic: true },
  { emoji: "🍚", name: "Brown Rice", category: "Grains", price: 35, unit: "5kg bag", stock: 90, reorder: 25, farm: "Northern Grains Co", region: "Upper East Region", organic: false },
  { emoji: "🌾", name: "Millet", category: "Grains", price: 28, unit: "5kg bag", stock: 64, reorder: 20, farm: "Savannah Mills", region: "Northern Region", organic: false },
  { emoji: "🥣", name: "Oats", category: "Grains", price: 30, unit: "kg", stock: 14, reorder: 18, farm: "Highlands Grain", region: "Ashanti Region", organic: true },
  { emoji: "🌽", name: "Corn Flour", category: "Grains", price: 20, unit: "kg", stock: 120, reorder: 30, farm: "Northern Grains Co", region: "Upper East Region", organic: false },
];

export const products = baseProducts.map((product, index) => ({
  id: index + 1,
  status: product.stock > 0 ? "Active" : "Inactive",
  description: `${product.name} sourced from ${product.farm} in ${product.region}.`,
  calories: 100 + index * 7,
  protein: 2 + (index % 4),
  fat: 1 + (index % 3),
  carbs: 12 + index * 2,
  ...product,
}));
