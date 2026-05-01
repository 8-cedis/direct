const express = require("express");
const {
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
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", addOrder);
router.get("/orders", listOrders);
router.get("/orders/export/csv", exportOrdersCsv);
router.get("/orders/user", listOrdersByUser);
router.get("/orders/:id", getOrderDetails);
router.get("/orders/:id/timeline", getOrderTimelineDetails);
router.put("/orders/:id/status", updateSellerOrderStatus);
router.put("/orders/:id/dispute", updateAdminDispute);
router.put("/orders/:id/admin-status", updateAdminOrderStatus);
router.post("/orders/:id/refund", refundOrder);
router.post("/orders/:id/cancel", cancelOrder);

module.exports = router;
