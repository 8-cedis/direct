const { getAllProducts } = require("../models/productModel");
const { getAllOrders } = require("../models/orderModel");

const listIncomingOrders = async (_req, res) => {
  try {
    const orders = await getAllOrders();
    const incoming = orders.filter((order) => (order.fulfillment_status || "Confirmed") !== "Delivered");
    return res.json(incoming);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch incoming orders", error: error.message });
  }
};

const getInventoryAlerts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 5);
    const products = await getAllProducts();
    const lowStock = products.filter((product) => Number(product.stock || 0) <= threshold);

    return res.json({
      threshold,
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      items: lowStock,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch inventory alerts", error: error.message });
  }
};

const getSalesSummary = async (_req, res) => {
  try {
    const orders = await getAllOrders();
    const paidOrders = orders.filter((order) => (order.status || "").toLowerCase() === "paid");
    const fulfilledOrders = orders.filter(
      (order) => (order.fulfillment_status || "Confirmed") === "Delivered"
    );

    const settledRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const grossRevenue = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders ? grossRevenue / totalOrders : 0;

    // Example payout model: 90% of paid revenue is available to seller.
    const availablePayout = settledRevenue * 0.9;
    const processingPayout = Math.max(grossRevenue - settledRevenue, 0) * 0.9;

    return res.json({
      revenue: Number(grossRevenue.toFixed(2)),
      settledRevenue: Number(settledRevenue.toFixed(2)),
      totalOrders,
      fulfilledOrders: fulfilledOrders.length,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      payout: {
        available: Number(availablePayout.toFixed(2)),
        processing: Number(processingPayout.toFixed(2)),
        nextPayoutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch sales summary", error: error.message });
  }
};

module.exports = {
  listIncomingOrders,
  getInventoryAlerts,
  getSalesSummary,
};
