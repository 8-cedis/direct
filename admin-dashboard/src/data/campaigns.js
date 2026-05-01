export const campaigns = Array.from({ length: 5 }, (_, index) => ({
  id: `CMP-${100 + index}`,
  name: ["Weekend Veg Promo", "Fruit Basket Push", "Bulk Rice Offer", "Loyalty Reengagement", "Top Customer Winback"][index],
  targetSegment: ["Vegetable Buyers", "Fruit Buyers", "Grain Buyers", "Lapsed Customers", "High Spenders"][index],
  channel: ["SMS", "Email", "WhatsApp", "SMS", "WhatsApp"][index],
  scheduledDate: new Date(2026, 3, 5 + index).toISOString(),
  status: ["Draft", "Scheduled", "Sent", "Sent", "Draft"][index],
  messagesSent: 300 + index * 50,
  ordersGenerated: 28 + index * 8,
  openRate: 18 + index * 3,
  revenueAttributed: 800 + index * 220,
}));
