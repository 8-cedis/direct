const { clearUserCart, getUserCart, upsertUserCart } = require("../models/cartModel");

const getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const cart = await getUserCart(userId);
    return res.json(cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get cart", error: error.message });
  }
};

const saveCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { items } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items must be an array" });
    }

    const cart = await upsertUserCart(userId, items);
    return res.status(200).json({ message: "Cart saved", cart });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save cart", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    await clearUserCart(userId);
    return res.json({ message: "Cart cleared" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};

module.exports = {
  getCart,
  saveCart,
  clearCart,
};
