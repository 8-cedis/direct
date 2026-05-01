import { products } from "./products";

const names = ["Ama", "Kojo", "Efua", "Yaw", "Akosua", "Kofi", "Adwoa", "Nana", "Mawusi", "Kwaku"];
const statuses = ["Placed", "Confirmed", "Out for Delivery", "Delivered", "Cancelled", "Shipped"];
const zones = ["North Accra", "East Legon", "Osu", "Tema", "Airport"];
const drivers = ["Yaw Osei", "Kojo Agyeman", "Abena Mensah"];
const slots = ["8 to 10 AM", "10 AM to 12 PM", "12 to 2 PM", "2 to 4 PM", "4 to 6 PM", "6 to 8 PM"];

const sampleOrders = Array.from({ length: 50 }, (_, index) => {
  const itemCount = 1 + (index % 4);
  const selectedProducts = Array.from({ length: itemCount }, (_, itemIndex) => products[(index + itemIndex) % products.length]);
  const amount = selectedProducts.reduce((sum, product) => sum + product.price * (1 + (index % 3)), 0);
  const status = statuses[index % statuses.length];
  return {
    id: `FD-${4200 + index}`,
    customerName: `${names[index % names.length]} ${index % 2 === 0 ? "Mensah" : "Boateng"}`,
    customerPhone: `+233 24 10${String(100 + index).slice(-3)}`,
    address: `${10 + index} Ridge Avenue, ${zones[index % zones.length]}, Accra`,
    items: selectedProducts.map((product) => ({
      ...product,
      quantity: 1 + (index % 3),
    })),
    itemsSummary: `${itemCount} items`,
    totalAmount: Number(amount.toFixed(2)),
    deliverySlot: slots[index % slots.length],
    zone: zones[index % zones.length],
    driverName: drivers[index % drivers.length],
    status,
    paymentStatus: index % 5 === 0 ? "Failed" : "Paid",
    paymentMethod: ["Mobile Money MTN", "Mobile Money Vodafone", "Bank Card", "Cash on Delivery"][index % 4],
    placedAt: new Date(2026, 3, 5 - Math.floor(index / 2), 8 + (index % 10), (index * 7) % 60).toISOString(),
    timeline: [
      { status: "Placed", at: new Date(2026, 3, 5 - Math.floor(index / 2), 8, 10).toISOString(), by: "System" },
      { status: "Confirmed", at: new Date(2026, 3, 5 - Math.floor(index / 2), 8, 35).toISOString(), by: "Ama Mensah" },
    ],
  };
});

export const orders = sampleOrders;
