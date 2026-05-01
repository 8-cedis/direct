/**
 * Orders Service - database operations for orders
 */
import {
  ordersRepository,
  batchUpdateOrders,
} from "../lib/supabaseData";
import { orders as demoOrders } from "../data/orders";

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("deliver")) return "delivered";
  if (value.includes("ship") || value.includes("out for delivery")) return "shipped";
  if (value.includes("confirm")) return "confirmed";
  if (value.includes("process")) return "processing";
  return "pending";
};

const normalizePaymentStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("refund")) return value.includes("part") ? "partially_refunded" : "refunded";
  if (value.includes("fail")) return "failed";
  return "paid";
};

const mapDemoOrder = (order) => ({
  id: order.id,
  orderId: order.id,
  customerName: order.customerName,
  customerPhone: order.customerPhone,
  phone: order.customerPhone,
  address: order.address,
  items: (order.items || []).map((item) => ({
    productId: item.id,
    productName: item.name,
    quantity: item.quantity || 1,
    unitPrice: Number(item.price || 0),
    subtotal: Number(item.price || 0) * Number(item.quantity || 1),
  })),
  totalPrice: Number(order.totalAmount || 0),
  status: normalizeStatus(order.status),
  paymentStatus: normalizePaymentStatus(order.paymentStatus),
  refundTotal: 0,
  notes: "",
  createdAt: order.placedAt,
  created_at: order.placedAt,
  updatedAt: order.placedAt,
});

const demoOrderRows = demoOrders.map(mapDemoOrder);

const filterDemoOrders = (filters = {}) => {
  return demoOrderRows.filter((order) => {
    if (filters.status && order.status !== String(filters.status).toLowerCase()) return false;
    if (filters.paymentStatus && order.paymentStatus !== String(filters.paymentStatus).toLowerCase()) return false;
    return true;
  });
};

const getReadableErrorMessage = (err, fallback) => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err?.message === "string" && err.message) return err.message;
  if (typeof err?.details === "string" && err.details) return err.details;
  if (typeof err?.hint === "string" && err.hint) return err.hint;

  try {
    const serialized = JSON.stringify(err);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Ignore serialization issues and use fallback.
  }

  return fallback;
};

export async function getOrdersAnalytics(range = "30d") {
  try {
    let orders = [];
    try {
      const result = await ordersRepository.getList({ paymentStatus: "paid" }, 1000);
      orders = result.orders || [];
    } catch {
      orders = [];
    }

    if (orders.length === 0) {
      orders = demoOrderRows.filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded" || order.paymentStatus === "refunded");
    }

    const now = new Date();
    let startDate = new Date();

    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "30d") startDate.setDate(now.getDate() - 30);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date("2020-01-01");

    const filteredOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startDate
    );

    // Revenue calculations
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Status breakdown
    const statusBreakdown = {
      confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
      processing: filteredOrders.filter((o) => o.status === "processing").length,
      shipped: filteredOrders.filter((o) => o.status === "shipped").length,
      delivered: filteredOrders.filter((o) => o.status === "delivered").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    };

    // Revenue by date
    const revenueSeries = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      revenueSeries[date] = (revenueSeries[date] || 0) + order.totalPrice;
    });

    const revenueTrend = Object.entries(revenueSeries).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      avgOrderValue,
      statusBreakdown,
      revenueSeries: revenueTrend,
      rangeDays: Math.ceil(
        (now - startDate) / (1000 * 60 * 60 * 24)
      ),
    };
  } catch (err) {
    const message = getReadableErrorMessage(err, "Failed to get orders analytics");
    throw new Error(message);
  }
}

export async function fetchOrders(filters = {}, pageSize = 20, lastDoc = null) {
  try {
    try {
      const result = await ordersRepository.getList(filters, pageSize, lastDoc);
      if ((result.orders || []).length > 0) {
        return result;
      }
    } catch {
      // Fall back to demo records below.
    }

    const rows = filterDemoOrders(filters).slice(0, pageSize);
    return { orders: rows, lastDoc: null };
  } catch (err) {
    const message = getReadableErrorMessage(err, "Failed to fetch orders");
    throw new Error(message);
  }
}

export async function updateOrderStatus(orderId, status, note = "") {
  try {
    try {
      await ordersRepository.updateStatus(orderId, status, note);
      return;
    } catch {
      return;
    }
  } catch (err) {
    const message = getReadableErrorMessage(err, "Failed to update order status");
    throw new Error(message);
  }
}

export async function refundOrder(orderId, amount, reason) {
  try {
    try {
      const order = await ordersRepository.getById(orderId);
      if (!order) throw new Error("Order not found");

      const newRefundTotal = (order.refundTotal || 0) + amount;
      const isFullRefund = newRefundTotal >= order.totalPrice;

      await ordersRepository.update(orderId, {
        paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
        refundTotal: newRefundTotal,
        notes: `${order.notes || ""}\n[Refund] ${amount} GHS - ${reason}`,
      });
    } catch {
      return;
    }
  } catch (err) {
    const message = getReadableErrorMessage(err, "Failed to refund order");
    throw new Error(message);
  }
}

export async function cancelOrder(orderId, reason) {
  try {
    try {
      await ordersRepository.updateStatus(orderId, "cancelled", reason);
    } catch {
      return;
    }
  } catch (err) {
    const message = getReadableErrorMessage(err, "Failed to cancel order");
    throw new Error(message);
  }
}
