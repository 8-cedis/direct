export const transactions = Array.from({ length: 40 }, (_, index) => ({
  id: `TXN-${7000 + index}`,
  orderNumber: `FD-${4200 + index}`,
  customerName: ["Ama Mensah", "Kojo Boateng", "Efua Agyeman", "Yaw Osei"][index % 4],
  amount: 80 + index * 12,
  paymentMethod: ["Mobile Money MTN", "Mobile Money Vodafone", "Bank Card", "Cash on Delivery"][index % 4],
  status: ["Success", "Success", "Pending", "Failed"][index % 4],
  date: new Date(2026, 3, 1 + (index % 6), 9 + (index % 8), (index * 7) % 60).toISOString(),
  gatewayResponse: { code: index % 4 === 3 ? "DECLINED" : "APPROVED", message: "Processed" },
  retries: index % 4 === 3 ? 2 : 0,
}));
