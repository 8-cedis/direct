/**
 * Products Service - database operations for inventory and products
 */
import {
  productsRepository,
} from "../lib/supabaseData";
import { uploadProductImage } from "../lib/storage";

const normalizeServiceError = (error, fallbackMessage) => {
  if (error instanceof Error) return error;

  const message = error?.message || error?.details || error?.hint || fallbackMessage;
  const normalized = new Error(message);
  if (error?.code) normalized.code = error.code;
  return normalized;
};

export async function fetchProducts(filters = {}) {
  try {
    return await productsRepository.getList(filters);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to fetch products");
  }
}

export async function getProductById(productId) {
  try {
    return await productsRepository.getById(productId);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to fetch product");
  }
}

export async function updateProductStock(productId, newStock) {
  try {
    await productsRepository.updateStock(productId, newStock);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to update product stock");
  }
}

export async function updateProduct(productId, updates) {
  try {
    let nextUpdates = { ...updates };

    if (updates.imageFile) {
      nextUpdates.image = await uploadProductImage(updates.imageFile, updates.name || productId);
    }
    delete nextUpdates.imageFile;

    await productsRepository.update(productId, nextUpdates);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to update product");
  }
}

export async function createProduct(productData) {
  try {
    const { imageFile, ...productFields } = productData;
    let image = productData.image || "";
    if (imageFile) {
      image = await uploadProductImage(imageFile, productData.name);
    }

    const product = {
      ...productFields,
      image,
      status: productData.status || "active",
      stock: Number(productData.stock || 0),
      price: Number(productData.price || 0),
    };

    return await productsRepository.create(product);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to create product");
  }
}

export async function uploadProductCoverImage(file, productName) {
  try {
    return await uploadProductImage(file, productName);
  } catch (err) {
    throw normalizeServiceError(err, "Failed to upload product image");
  }
}

export async function getInventorySummary(products) {
  try {
    const activeProducts = products.filter((p) => p.status === "active").length;
    const lowStockCount = products.filter((p) => p.stock <= (p.reorderPoint || 10)).length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.price * p.stock),
      0
    );
    const outOfStockCount = products.filter((p) => Number(p.stock || 0) === 0).length;

    return {
      totalProducts: products.length,
      activeProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
    };
  } catch (err) {
    throw normalizeServiceError(err, "Failed to get inventory summary");
  }
}

export async function applyBulkPriceUpdate(products, action, value) {
  try {
    const updates = products.map((p) => {
      let newPrice = p.price;

      if (action === "increase_percentage") {
        newPrice = p.price * (1 + value / 100);
      } else if (action === "decrease_percentage") {
        newPrice = p.price * (1 - value / 100);
      } else if (action === "set_fixed") {
        newPrice = value;
      }

      return {
        id: p.id,
        price: Math.round(newPrice * 100) / 100,
        updatedAt: new Date().toISOString(),
      };
    });

    // Batch update all products
    for (const update of updates) {
      await productsRepository.update(update.id, update);
    }

    return updates;
  } catch (err) {
    throw normalizeServiceError(err, "Failed to apply bulk price update");
  }
}
