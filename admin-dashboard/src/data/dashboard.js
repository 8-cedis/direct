import { orders } from "./orders";
import { customers } from "./customers";
import { products } from "./products";

export const dashboardSummary = {
  todayOrders: 64,
  todayRevenue: 12450.75,
  ordersOutForDelivery: 18,
  newCustomersToday: 9,
  lowStockAlerts: 7,
  averageOrderValue: 194.54,
  yesterday: {
    todayOrders: 58,
    todayRevenue: 11875.4,
    ordersOutForDelivery: 15,
    newCustomersToday: 6,
    lowStockAlerts: 9,
    averageOrderValue: 182.2,
  },
};

export const revenueSeries = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(2026, 2, 7 + index).toISOString(),
  revenue: 7000 + index * 170 + (index % 5) * 320,
}));

export const categoryBreakdown = [
  { name: "Vegetables", value: 34, color: "#3B6D11" },
  { name: "Fruits", value: 28, color: "#854F0B" },
  { name: "Grains", value: 38, color: "#f59e0b" },
];

export const recentOrdersFeed = orders.slice(0, 10);
export const activeAlerts = [
  { type: "low stock", icon: "⚠️", description: "Oats stock is below reorder threshold.", timestamp: new Date().toISOString(), tone: "danger" },
  { type: "quality failure", icon: "🧪", description: "One paprika batch failed quality check.", timestamp: new Date().toISOString(), tone: "warning" },
  { type: "payment failure", icon: "💳", description: "Mobile Money payment declined for FD-4212.", timestamp: new Date().toISOString(), tone: "danger" },
  { type: "high refund rate", icon: "↩️", description: "Refund rate increased for Osu zone today.", timestamp: new Date().toISOString(), tone: "warning" },
  { type: "driver delay", icon: "🚚", description: "Driver Kojo Agyeman is 12 minutes behind schedule.", timestamp: new Date().toISOString(), tone: "amber" },
];

export const inventorySummary = {
  totalProducts: products.reduce((sum, product) => sum + product.stock, 0),
  belowThreshold: products.filter((product) => product.stock <= product.reorder).length,
  totalStockValue: products.reduce((sum, product) => sum + product.stock * product.price, 0),
};
