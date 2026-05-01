const express = require("express");
const {
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
} = require("../controllers/adminController");

const router = express.Router();

router.get("/admin/overview", getOverviewStats);

router.get("/admin/users", listUsers);
router.put("/admin/users/:id/suspend", suspendUser);
router.delete("/admin/users/:id", removeUser);

router.get("/admin/products/pending", listPendingProducts);
router.put("/admin/products/:id/approval", decideProductApproval);
router.put("/admin/products/:id/promotion", updatePromotion);

router.get("/admin/reports", getFinancialReports);
router.get("/admin/disputes", getDisputePanel);
router.get("/admin/analytics", getAnalyticsDashboard);
router.get("/admin/platform-health", getPlatformHealth);

module.exports = router;
