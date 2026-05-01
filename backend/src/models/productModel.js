const { deleteById, filterCollection, findById, getNextSequence, listCollection, upsertById, updateById } = require("../database/localStore");

const getAllProducts = async () => {
  return listCollection("products");
};

const getProductById = async (id) => {
  return findById("products", id);
};

const createProduct = async ({ name, description, image, price, stock }) => {
  const id = await getNextSequence("products");
  const product = {
    id,
    name,
    description,
    image,
    price: Number(price),
    stock: Number(stock),
    approval_status: "pending",
    approval_note: "",
    is_featured: false,
    promotion_text: "",
    discount_percent: 0,
    created_at: new Date().toISOString(),
  };
  upsertById("products", product);
  return product;
};

const updateProduct = async (id, { name, description, image, price, stock }) => {
  const existing = updateById("products", id, {
    name,
    description,
    image,
    price: Number(price),
    stock: Number(stock),
    updated_at: new Date().toISOString(),
  });

  if (!existing) {
    return false;
  }
  return true;
};

const getProductsByApprovalStatus = async (approvalStatus) => {
  return filterCollection(
    "products",
    (product) => product.approval_status === approvalStatus,
    (left, right) => (Number(right.id) || 0) - (Number(left.id) || 0)
  );
};

const updateProductApproval = async (id, { approvalStatus, approvalNote }) => {
  const existing = updateById("products", id, {
    approval_status: approvalStatus,
    approval_note: approvalNote || "",
    updated_at: new Date().toISOString(),
  });

  if (!existing) {
    return false;
  }
  return true;
};

const updateProductPromotion = async (id, { isFeatured, promotionText, discountPercent }) => {
  const existing = updateById("products", id, {
    is_featured: Boolean(isFeatured),
    promotion_text: promotionText || "",
    discount_percent: Number(discountPercent || 0),
    updated_at: new Date().toISOString(),
  });

  if (!existing) {
    return false;
  }
  return true;
};

const deleteProduct = async (id) => {
  return deleteById("products", id);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  getProductsByApprovalStatus,
  updateProductApproval,
  updateProductPromotion,
  deleteProduct,
};
