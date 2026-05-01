const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrderFulfillmentStatus,
  updateOrderDispute,
  adminUpdateOrderStatus,
  issueOrderRefund,
  cancelOrderByAdmin,
  getOrderTimeline,
} = require("../models/orderModel");
const { getAllProducts } = require("../models/productModel");
const { addNotificationTrigger } = require("../models/crmModel");

const allowedFulfillmentStatuses = ["Confirmed", "Packed", "In Transit", "Delivered"];
const allowedDisputeStatuses = ["none", "open", "in_review", "resolved", "rejected"];
const allowedAdminStatuses = ["pending", "processing", "completed", "cancelled"];

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const classifyProductCategory = (name = "", category = "") => {
  const source = `${String(name)} ${String(category)}`.toLowerCase();
  if (/(goat|cow|cattle|sheep|chicken|hen|egg|fish|poultry|livestock|animal)/.test(source)) return "Animals";
  if (/(fertilizer|feed|seed|crate|bag|tool|material|equipment|packaging)/.test(source)) return "Materials";
  if (/(fruit|vegetable|produce|grain|crop|plantain|rice|tomato|pepper|yam|cassava|okra|oats)/.test(source)) return "Produce";
  return "Others";
};

const sellerNameFromProduct = (product) => {
  if (!product) return "";
  return product.seller_name || product.sellerName || product.farm || product.farm_name || product.farmer_name || "";
};

const parseRangeDays = (range) => {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  if (range === "all") return null;
  return 30;
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const applyOrderFilters = (orders, productsById, filters) => {
  const { status, range, from, to, category, buyer, seller } = filters;
  const dayCount = parseRangeDays(range);
  const rangeStart = dayCount ? startOfDay(new Date(Date.now() - (dayCount - 1) * 24 * 60 * 60 * 1000)) : null;
  const explicitFrom = from ? startOfDay(from) : null;
  const explicitTo = to ? new Date(`${to}T23:59:59.999Z`) : null;

  return orders.filter((order) => {
    const statusValue = String(order.fulfillment_status || order.status || "").toLowerCase();
    if (status && status !== "all" && statusValue !== String(status).toLowerCase()) {
      return false;
    }

    const createdAt = new Date(order.created_at);
    if (Number.isFinite(createdAt.getTime())) {
      if (rangeStart && createdAt < rangeStart) return false;
      if (explicitFrom && createdAt < explicitFrom) return false;
      if (explicitTo && createdAt > explicitTo) return false;
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const enrichedItems = items.map((item) => {
      const product = productsById.get(String(item.product_id || ""));
      return {
        ...item,
        category: classifyProductCategory(item.product_name, product?.category),
        seller_name: sellerNameFromProduct(product),
      };
    });

    if (category && category !== "all") {
      const hasCategory = enrichedItems.some((item) => String(item.category).toLowerCase() === String(category).toLowerCase());
      if (!hasCategory) return false;
    }

    if (seller) {
      const sellerLower = String(seller).toLowerCase();
      const hasSeller = enrichedItems.some((item) => String(item.seller_name || "").toLowerCase().includes(sellerLower));
      if (!hasSeller) return false;
    }

    if (buyer) {
      const buyerLower = String(buyer).toLowerCase();
      const haystack = `${order.customer_name || ""} ${order.phone || ""} ${order.user_id || ""}`.toLowerCase();
      if (!haystack.includes(buyerLower)) return false;
    }

    return true;
  });
};

const toOrderCsv = (orders) => {
  const header = [
    "order_id",
    "created_at",
    "buyer",
    "phone",
    "status",
    "fulfillment_status",
    "dispute_status",
    "refund_total",
    "total_price",
    "item_count",
  ];

  const rows = orders.map((order) => [
    order.id,
    order.created_at,
    order.customer_name || "",
    order.phone || "",
    order.status || "",
    order.fulfillment_status || "",
    order.dispute_status || "",
    toNumber(order.refund_total).toFixed(2),
    toNumber(order.total_price).toFixed(2),
    Array.isArray(order.items) ? order.items.length : 0,
  ]);

  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
};

const addOrder = async (req, res) => {
  try {
    const { userId, customerName, phone, address, totalPrice, items } = req.body;
    if (!customerName || !phone || !address || !items?.length) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const order = await createOrder({ userId, customerName, phone, address, totalPrice, items });
    return res.status(201).json({ message: "Order created", orderId: order.id });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
    const productsById = new Map(products.map((product) => [String(product.id), product]));

    const filtered = applyOrderFilters(orders, productsById, {
      status: req.query.status,
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
      buyer: req.query.buyer,
      seller: req.query.seller,
    });

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

const listOrdersByUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const orders = await getOrdersByUserId(userId);
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user orders", error: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

const updateSellerOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { fulfillmentStatus } = req.body;

    if (!allowedFulfillmentStatuses.includes(fulfillmentStatus)) {
      return res.status(400).json({
        message: "Invalid fulfillmentStatus",
        allowed: allowedFulfillmentStatuses,
      });
    }

    const updated = await updateOrderFulfillmentStatus(orderId, fulfillmentStatus);
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Order fulfillment status updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

const updateAdminDispute = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { disputeStatus, disputeNote = "", forceResolution = false } = req.body;
    const normalizedStatus = forceResolution ? "resolved" : disputeStatus;

    if (!allowedDisputeStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid disputeStatus",
        allowed: allowedDisputeStatuses,
      });
    }

    const updated = await updateOrderDispute(orderId, normalizedStatus, disputeNote || (forceResolution ? "Force resolved by admin" : ""));
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: forceResolution ? "Order dispute force resolved" : "Order dispute updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to manage dispute", error: error.message });
  }
};

const updateAdminOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, fulfillmentStatus, note = "" } = req.body;

    if (status && !allowedAdminStatuses.includes(String(status).toLowerCase())) {
      return res.status(400).json({ message: "Invalid status", allowed: allowedAdminStatuses });
    }

    if (fulfillmentStatus && !allowedFulfillmentStatuses.includes(fulfillmentStatus) && fulfillmentStatus !== "Cancelled") {
      return res.status(400).json({ message: "Invalid fulfillmentStatus", allowed: [...allowedFulfillmentStatuses, "Cancelled"] });
    }

    const updated = await adminUpdateOrderStatus(orderId, {
      status: status ? String(status).toLowerCase() : undefined,
      fulfillmentStatus,
      note,
      actor: "admin",
    });

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Order status updated", order: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

const refundOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { amount, reason = "" } = req.body;
    const refundAmount = Number(amount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ message: "A valid refund amount is required" });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const remaining = Math.max(toNumber(order.total_price) - toNumber(order.refund_total), 0);
    if (refundAmount > remaining) {
      return res.status(400).json({ message: "Refund amount exceeds remaining refundable balance", remaining });
    }

    const updated = await issueOrderRefund(orderId, {
      amount: refundAmount,
      reason: reason || "Refund issued by admin",
      actor: "admin",
    });

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      message: refundAmount >= remaining ? "Full refund issued" : "Partial refund issued",
      order: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to issue refund", error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    const updated = await cancelOrderByAdmin(orderId, { reason, actor: "admin" });
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Promise.all([
      addNotificationTrigger({
        triggerType: "order_update",
        channel: "email",
        targetUserId: updated.user_id || null,
        payload: {
          audience: "buyer",
          orderId: updated.id,
          reason,
          message: `Order #${updated.id} was cancelled by admin`,
        },
      }),
      addNotificationTrigger({
        triggerType: "order_update",
        channel: "email",
        targetUserId: null,
        payload: {
          audience: "seller",
          orderId: updated.id,
          reason,
          message: `Order #${updated.id} was cancelled by admin`,
        },
      }),
    ]);

    return res.json({ message: "Order cancelled and notifications queued", order: updated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel order", error: error.message });
  }
};

const getOrderTimelineDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const timeline = await getOrderTimeline(orderId);
    if (!timeline) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ orderId, timeline });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch order timeline", error: error.message });
  }
};

const exportOrdersCsv = async (req, res) => {
  try {
    const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);
    const productsById = new Map(products.map((product) => [String(product.id), product]));
    const filtered = applyOrderFilters(orders, productsById, {
      status: req.query.status,
      range: req.query.range,
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
      buyer: req.query.buyer,
      seller: req.query.seller,
    });

    const csv = toOrderCsv(filtered);
    const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: "Failed to export orders", error: error.message });
  }
};

module.exports = {
  addOrder,
  listOrders,
  listOrdersByUser,
  getOrderDetails,
  updateSellerOrderStatus,
  updateAdminDispute,
  updateAdminOrderStatus,
  refundOrder,
  cancelOrder,
  getOrderTimelineDetails,
  exportOrdersCsv,
};
