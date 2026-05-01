const express = require("express");
const { getCart, saveCart, clearCart } = require("../controllers/cartController");

const router = express.Router();

router.get("/cart/:userId", getCart);
router.put("/cart/:userId", saveCart);
router.delete("/cart/:userId", clearCart);

module.exports = router;
