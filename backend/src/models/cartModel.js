const { findById, upsertById } = require("../database/localStore");

const getUserCart = async (userId) => {
  const cart = findById("carts", userId);
  if (!cart) {
    return { userId: Number(userId), items: [], updated_at: null };
  }
  return cart;
};

const upsertUserCart = async (userId, items) => {
  const cart = {
    userId: Number(userId),
    items,
    updated_at: new Date().toISOString(),
  };
  upsertById("carts", cart);
  return cart;
};

const clearUserCart = async (userId) => {
  upsertById("carts", {
    userId: Number(userId),
    items: [],
    updated_at: new Date().toISOString(),
  });
};

module.exports = {
  getUserCart,
  upsertUserCart,
  clearUserCart,
};
