const express = require("express");
const {
  listProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
} = require("../controllers/productController");

const router = express.Router();

router.get("/products", listProducts);
router.get("/products/:id", getProduct);
router.post("/products", addProduct);
router.put("/products/:id", editProduct);
router.delete("/products/:id", removeProduct);

module.exports = router;
