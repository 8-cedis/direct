const express = require("express");
const { initializePayment, verifyPayment, paystackWebhook } = require("../controllers/paymentController");

const router = express.Router();

router.post("/payments/initialize", initializePayment);
router.get("/payments/verify/:reference", verifyPayment);
router.post("/payments/webhook", paystackWebhook);

module.exports = router;
