import { products } from "./products";

export const settings = {
  delivery: {
    fee: 15,
    minimumOrder: 50,
    zones: ["North Accra", "East Legon", "Osu", "Tema", "Airport"],
  },
  slots: [
    { slot: "8 to 10 AM", maxOrders: 20, open: true },
    { slot: "10 AM to 12 PM", maxOrders: 28, open: true },
    { slot: "12 to 2 PM", maxOrders: 26, open: true },
    { slot: "2 to 4 PM", maxOrders: 24, open: false },
    { slot: "4 to 6 PM", maxOrders: 18, open: true },
    { slot: "6 to 8 PM", maxOrders: 14, open: false },
  ],
  loyalty: {
    pointsPerGhc: 1,
    silver: 250,
    gold: 500,
    platinum: 900,
  },
  finance: {
    vat: 15,
    payoutDay: "Friday",
    platformCommissionRate: 12.5,
  },
  notifications: {
    orderConfirmedSms: true,
    outForDeliverySms: true,
    deliveredSms: true,
    postDeliverySurvey: true,
    reengagementCampaign: true,
    lowStockAlert: true,
  },
  reorderThresholds: products.map((product) => ({ id: product.id, name: product.name, threshold: product.reorder })),
};
