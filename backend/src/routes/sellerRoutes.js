const express = require("express");
const {
  listIncomingOrders,
  getInventoryAlerts,
  getSalesSummary,
} = require("../controllers/sellerController");

const router = express.Router();

router.get("/seller/incoming-orders", listIncomingOrders);
router.get("/seller/inventory-alerts", getInventoryAlerts);
router.get("/seller/sales-summary", getSalesSummary);

module.exports = router;
