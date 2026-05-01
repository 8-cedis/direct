const fs = require("fs");
const path = require("path");
const { setNextSequence, upsertById } = require("./localStore");

const now = new Date();
const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const loadImageMap = () => {
  try {
    const mapPath = path.join(__dirname, "..", "..", "uploads", "import-mapping.json");
    const raw = fs.readFileSync(mapPath, "utf8");
    const entries = JSON.parse(raw);
    return entries.reduce((acc, entry) => {
      acc[entry.original] = entry.url;
      return acc;
    }, {});
  } catch (_error) {
    return {};
  }
};

const imageMap = loadImageMap();

const seedUsers = [
  { id: 1, name: "Ama Mensah", email: "ama@example.com", role: "buyer", status: "active", suspended: false, created_at: daysAgo(18) },
  { id: 2, name: "Kojo Owusu", email: "kojo@example.com", role: "buyer", status: "active", suspended: false, created_at: daysAgo(15) },
  { id: 3, name: "Naana Dery", email: "naana@example.com", role: "buyer", status: "active", suspended: false, created_at: daysAgo(12) },
  { id: 4, name: "Yaw Boateng", email: "yaw@example.com", role: "buyer", status: "active", suspended: false, created_at: daysAgo(9) },
  { id: 5, name: "Abena Asante", email: "abena@example.com", role: "buyer", status: "active", suspended: false, created_at: daysAgo(6) },
];

const seedProducts = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    description: "Locally grown tomatoes for sauces, soups, and salads.",
    image: imageMap["tomatoes.webp"] || "",
    price: 15,
    stock: 120,
    approval_status: "approved",
    approval_note: "Ready for storefront",
    is_featured: true,
    promotion_text: "Best seller",
    discount_percent: 0,
    created_at: daysAgo(10),
  },
  {
    id: 2,
    name: "Carrots",
    description: "Crunchy carrots for everyday cooking.",
    image: imageMap["carrot.webp"] || "",
    price: 9,
    stock: 80,
    approval_status: "pending",
    approval_note: "Awaiting admin review",
    is_featured: false,
    promotion_text: "",
    discount_percent: 0,
    created_at: daysAgo(8),
  },
  {
    id: 3,
    name: "Bell Peppers",
    description: "Sweet mixed peppers for stir-fries and grilling.",
    image: imageMap["pepper.webp"] || "",
    price: 12,
    stock: 64,
    approval_status: "approved",
    approval_note: "",
    is_featured: false,
    promotion_text: "",
    discount_percent: 0,
    created_at: daysAgo(7),
  },
  {
    id: 4,
    name: "Pineapple",
    description: "Sweet ripe pineapple for fruit bowls and juice.",
    image: imageMap["pineapple.webp"] || "",
    price: 22,
    stock: 45,
    approval_status: "approved",
    approval_note: "",
    is_featured: true,
    promotion_text: "Weekend special",
    discount_percent: 10,
    created_at: daysAgo(6),
  },
  {
    id: 5,
    name: "Oranges",
    description: "Fresh oranges with juicy citrus flavor.",
    image: imageMap["orange.jpg"] || "",
    price: 18,
    stock: 58,
    approval_status: "pending",
    approval_note: "Awaiting approval",
    is_featured: false,
    promotion_text: "",
    discount_percent: 0,
    created_at: daysAgo(4),
  },
];

const seedOrders = [
  {
    id: 101,
    user_id: 1,
    customer_name: "Ama Mensah",
    phone: "+233 20 111 2222",
    address: "East Legon, Accra",
    total_price: 78.5,
    status: "completed",
    fulfillment_status: "Delivered",
    dispute_status: "none",
    dispute_note: "",
    created_at: hoursAgo(4),
    updated_at: hoursAgo(3),
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    items: [
      { product_id: 1, product_name: "Fresh Tomatoes", quantity: 3, price: 15 },
      { product_id: 4, product_name: "Pineapple", quantity: 1, price: 22 },
    ],
    order_timeline: [
      { at: hoursAgo(4), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
      { at: hoursAgo(3), type: "fulfillment_status_updated", status: "completed", fulfillment_status: "Delivered", actor: "seller", note: "Delivered to customer" },
    ],
  },
  {
    id: 102,
    user_id: 2,
    customer_name: "Kojo Owusu",
    phone: "+233 24 333 4444",
    address: "Adum, Kumasi",
    total_price: 64.0,
    status: "pending",
    fulfillment_status: "Packed",
    dispute_status: "open",
    dispute_note: "Customer reported missing item.",
    created_at: hoursAgo(16),
    updated_at: hoursAgo(12),
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    items: [
      { product_id: 2, product_name: "Carrots", quantity: 4, price: 9 },
      { product_id: 3, product_name: "Bell Peppers", quantity: 2, price: 12 },
    ],
    order_timeline: [
      { at: hoursAgo(16), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
      { at: hoursAgo(12), type: "dispute_updated", status: "pending", fulfillment_status: "Packed", actor: "admin", note: "Waiting for review", dispute_status: "open" },
    ],
  },
  {
    id: 103,
    user_id: 3,
    customer_name: "Naana Dery",
    phone: "+233 26 555 6666",
    address: "Sunyani, Bono Region",
    total_price: 42.25,
    status: "completed",
    fulfillment_status: "In Transit",
    dispute_status: "in_review",
    dispute_note: "Delay in delivery; customer requested update.",
    created_at: hoursAgo(18),
    updated_at: hoursAgo(8),
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    items: [
      { product_id: 5, product_name: "Oranges", quantity: 2, price: 18 },
      { product_id: 1, product_name: "Fresh Tomatoes", quantity: 1, price: 15 },
    ],
    order_timeline: [
      { at: hoursAgo(18), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
      { at: hoursAgo(8), type: "dispute_updated", status: "completed", fulfillment_status: "In Transit", actor: "admin", note: "Escalated to support", dispute_status: "in_review" },
    ],
  },
  {
    id: 104,
    user_id: 4,
    customer_name: "Yaw Boateng",
    phone: "+233 27 777 8888",
    address: "Madina, Accra",
    total_price: 95.0,
    status: "completed",
    fulfillment_status: "Delivered",
    dispute_status: "resolved",
    dispute_note: "Refund issued for damaged produce.",
    created_at: daysAgo(3),
    updated_at: daysAgo(1),
    payment_status: "Partially Refunded",
    refund_total: 15,
    refunds: [{ amount: 15, reason: "Damaged item", at: daysAgo(1), actor: "admin", type: "partial" }],
    items: [
      { product_id: 4, product_name: "Pineapple", quantity: 3, price: 22 },
      { product_id: 3, product_name: "Bell Peppers", quantity: 2, price: 12 },
    ],
    order_timeline: [
      { at: daysAgo(3), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
      { at: daysAgo(1), type: "refund_issued", status: "completed", fulfillment_status: "Delivered", actor: "admin", note: "Partial refund issued", refund_amount: 15 },
    ],
  },
  {
    id: 105,
    user_id: 5,
    customer_name: "Abena Asante",
    phone: "+233 28 999 0000",
    address: "Tema, Greater Accra",
    total_price: 56.75,
    status: "pending",
    fulfillment_status: "Confirmed",
    dispute_status: "none",
    dispute_note: "",
    created_at: daysAgo(8),
    updated_at: daysAgo(8),
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    items: [
      { product_id: 1, product_name: "Fresh Tomatoes", quantity: 2, price: 15 },
      { product_id: 5, product_name: "Oranges", quantity: 2, price: 18 },
    ],
    order_timeline: [
      { at: daysAgo(8), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
    ],
  },
  {
    id: 106,
    user_id: 1,
    customer_name: "Ama Mensah",
    phone: "+233 20 111 2222",
    address: "East Legon, Accra",
    total_price: 31.5,
    status: "completed",
    fulfillment_status: "Delivered",
    dispute_status: "none",
    dispute_note: "",
    created_at: daysAgo(6),
    updated_at: daysAgo(5),
    payment_status: "Paid",
    refund_total: 0,
    refunds: [],
    items: [{ product_id: 2, product_name: "Carrots", quantity: 3, price: 9 }],
    order_timeline: [
      { at: daysAgo(6), type: "order_created", status: "pending", fulfillment_status: "Confirmed", actor: "system", note: "Order created" },
      { at: daysAgo(5), type: "fulfillment_status_updated", status: "completed", fulfillment_status: "Delivered", actor: "seller", note: "Delivered" },
    ],
  },
];

const seedComplaints = [
  {
    id: 1,
    user_id: 2,
    subject: "Missing item in order",
    complaint_text: "One item was not included in the delivery.",
    status: "open",
    admin_response: "",
    created_at: hoursAgo(14),
    updated_at: hoursAgo(14),
  },
  {
    id: 2,
    user_id: 4,
    subject: "Delivery delay",
    complaint_text: "The order arrived later than expected.",
    status: "in_review",
    admin_response: "Support is reviewing the delivery timeline.",
    created_at: daysAgo(2),
    updated_at: hoursAgo(10),
  },
];

const seedInteractions = [
  { id: 1, user_id: 1, interaction_type: "email", notes: "Welcomed returning customer.", interaction_date: hoursAgo(20), created_at: hoursAgo(20) },
  { id: 2, user_id: 2, interaction_type: "call", notes: "Followed up on delivery issue.", interaction_date: hoursAgo(13), created_at: hoursAgo(13) },
  { id: 3, user_id: 3, interaction_type: "sms", notes: "Sent order status update.", interaction_date: hoursAgo(9), created_at: hoursAgo(9) },
];

const seedNotifications = [
  { id: 1, trigger_type: "order_update", channel: "email", target_user_id: 1, payload: { message: "Your order has shipped." }, status: "queued", created_at: hoursAgo(3) },
  { id: 2, trigger_type: "abandoned_cart", channel: "sms", target_user_id: 5, payload: { message: "You left items in your cart." }, status: "queued", created_at: hoursAgo(2) },
];

const seedCollection = (name, records) => {
  records.forEach((record) => upsertById(name, record));
  const maxId = records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0);
  if (maxId > 0) {
    setNextSequence(name, maxId);
  }
};

const seedLocalData = () => {
  seedCollection("users", seedUsers);
  seedCollection("products", seedProducts);
  seedCollection("orders", seedOrders);
  seedCollection("complaints", seedComplaints);
  seedCollection("customer_interactions", seedInteractions);
  seedCollection("notification_triggers", seedNotifications);
};

module.exports = { seedLocalData };
