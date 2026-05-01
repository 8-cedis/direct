const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../models/productModel");

const listProducts = async (_req, res) => {
  try {
    const products = await getAllProducts();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch product", error: error.message });
  }
};

const addProduct = async (req, res) => {
  try {
    const { name, description = "", image = "", price, stock = 0 } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required" });
    }
    const product = await createProduct({ name, description, image, price, stock });
    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product", error: error.message });
  }
};

const editProduct = async (req, res) => {
  try {
    const { name, description = "", image = "", price, stock = 0 } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "name and price are required" });
    }
    const updated = await updateProduct(req.params.id, { name, description, image, price, stock });
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: "Product updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    const removed = await deleteProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

module.exports = {
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
};
