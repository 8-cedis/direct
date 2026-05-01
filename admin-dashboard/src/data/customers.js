const tiers = ["Regular", "Silver", "Gold", "Platinum"];
const statuses = ["Active", "Inactive"];
const firstNames = ["Ama", "Kojo", "Efua", "Yaw", "Akosua", "Kofi", "Adwoa", "Nana", "Mawusi", "Kwaku", "Yaa", "Abena"];

export const customers = Array.from({ length: 30 }, (_, index) => ({
  id: `CUST-${300 + index}`,
  name: `${firstNames[index % firstNames.length]} ${index % 2 === 0 ? "Mensah" : "Agyeman"}`,
  email: `customer${index + 1}@farmdirect.com`,
  phone: `+233 24 4${String(100000 + index).slice(-6)}`,
  memberSince: new Date(2024, index % 12, 1 + (index % 27)).toISOString(),
  totalOrders: 1 + (index % 12),
  totalSpent: 120 + index * 85,
  loyaltyTier: tiers[index % tiers.length],
  loyaltyPoints: 50 + index * 32,
  status: statuses[index % statuses.length],
  address: `${index + 5} Independence Avenue, Accra`,
  notes: [`Prefers evening delivery.`, `Likes call before arrival.`],
  orders: [],
  tickets: [],
  pointsLog: [
    { type: "Earned", points: 25 + index, date: new Date(2026, 3, 1 + index).toISOString(), reason: "Order completed" },
    { type: "Spent", points: 10, date: new Date(2026, 3, 2 + index).toISOString(), reason: "Discount redemption" },
  ],
}));
