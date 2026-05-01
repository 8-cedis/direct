const {
  getAllUsers,
  updateUserSuspension,
  deleteUserById,
} = require("../models/userModel");
const {
  getAllProducts,
  getProductsByApprovalStatus,
  updateProductApproval,
  updateProductPromotion,
} = require("../models/productModel");
const { getAllOrders, getOrdersWithDisputes } = require("../models/orderModel");
const { listComplaints } = require("../models/crmModel");
const { buildAnalyticsDashboard } = require("../services/adminAnalyticsService");

const listUsers = async (_req, res) => {
  try {
    const users = await getAllUsers();
    const sanitized = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "buyer",
      status: user.status || "active",
      suspended: Boolean(user.suspended),
      created_at: user.created_at,
    }));
    return res.json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { suspended } = req.body;
    const updated = await updateUserSuspension(userId, Boolean(suspended));
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: suspended ? "User suspended" : "User reactivated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

const removeUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deleted = await deleteUserById(userId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

const getOverviewStats = async (_req, res) => {
  try {
    const [users, orders, products] = await Promise.all([getAllUsers(), getAllOrders(), getAllProducts()]);
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const activeListings = products.filter((p) => (p.approval_status || "approved") !== "rejected").length;

    return res.json({
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      activeListings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch overview stats", error: error.message });
  }
};

const listPendingProducts = async (_req, res) => {
  try {
    const pendingProducts = await getProductsByApprovalStatus("pending");
    return res.json(pendingProducts);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending products", error: error.message });
  }
};

const decideProductApproval = async (req, res) => {
  try {
    const productId = req.params.id;
    const { status, note = "" } = req.body;
    const allowed = ["approved", "rejected", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status", allowed });
    }

    const updated = await updateProductApproval(productId, {
      approvalStatus: status,
      approvalNote: note,
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: `Product ${status}` });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product approval", error: error.message });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isFeatured = false, promotionText = "", discountPercent = 0 } = req.body;
    const updated = await updateProductPromotion(productId, {
      isFeatured,
      promotionText,
      discountPercent,
    });
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: "Promotion updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update promotion", error: error.message });
  }
};

const getFinancialReports = async (req, res) => {
  try {
    const period = req.query.period || "daily";
    const valid = ["daily", "weekly", "monthly"];
    if (!valid.includes(period)) {
      return res.status(400).json({ message: "Invalid period", valid });
    }

    const orders = await getAllOrders();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const span = period === "daily" ? dayMs : period === "weekly" ? 7 * dayMs : 30 * dayMs;

    const filtered = orders.filter((order) => {
      const timestamp = new Date(order.created_at).getTime();
      return now - timestamp <= span;
    });

    const revenue = filtered.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const averageOrderValue = filtered.length ? revenue / filtered.length : 0;

    return res.json({
      period,
      orders: filtered.length,
      revenue: Number(revenue.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch financial report", error: error.message });
  }
};

const getDisputePanel = async (_req, res) => {
  try {
    const disputes = await getOrdersWithDisputes();
    return res.json(disputes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch disputes", error: error.message });
  }
};

const getAnalyticsDashboard = async (_req, res) => {
  try {
    const range = _req.query.range || "30d";
    const allowedRanges = ["7d", "30d", "90d", "all"];
    const selectedRange = allowedRanges.includes(range) ? range : "30d";
    const analytics = await buildAnalyticsDashboard(selectedRange);
    return res.json(analytics);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics dashboard", error: error.message });
  }
};

const getPlatformHealth = async (_req, res) => {
  try {
    const [users, orders, complaints] = await Promise.all([
      getAllUsers(),
      getAllOrders(),
      listComplaints(),
    ]);

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter((order) => {
      const timestamp = new Date(order.created_at).getTime();
      return Number.isFinite(timestamp) && timestamp >= oneDayAgo;
    });

    const activeSessions = new Set(
      recentOrders
        .map((order) => Number(order.user_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    ).size;

    const unresolvedDisputes = orders.filter((order) => {
      const status = String(order.dispute_status || "none").toLowerCase();
      return status !== "none" && status !== "resolved";
    }).length;

    const unresolvedComplaints = complaints.filter((complaint) => {
      const status = String(complaint.status || "open").toLowerCase();
      return status === "open" || status === "in_review";
    }).length;

    const denominator = Math.max(orders.length + complaints.length, 1);
    const errorRate = Number((((unresolvedDisputes + unresolvedComplaints) / denominator) * 100).toFixed(2));

    return res.json({
      uptimeSeconds: Math.floor(process.uptime()),
      activeSessions,
      errorRate,
      activeUsers: users.filter((user) => (user.status || "active") === "active" && !user.suspended).length,
      unresolvedDisputes,
      unresolvedComplaints,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch platform health", error: error.message });
  }
};

module.exports = {
  listUsers,
  suspendUser,
  removeUser,
  getOverviewStats,
  listPendingProducts,
  decideProductApproval,
  updatePromotion,
  getFinancialReports,
  getDisputePanel,
  getAnalyticsDashboard,
  getPlatformHealth,
};
