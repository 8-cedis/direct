import { CartItem, Product } from "../types";

const CART_KEY = "farm_store_cart";

export const getCart = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const saved = localStorage.getItem(CART_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveCart = (items: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
};

export const hydrateCartForSignedUser = async (): Promise<CartItem[]> => {
  return getCart();
};

export const addToCart = (product: Product, quantity = 1) => {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      quantity,
      image: product.image,
    });
  }

  saveCart(cart);
  return cart;
};

export const removeFromCart = (productId: number) => {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
  return cart;
};

export const updateCartQty = (productId: number, quantity: number) => {
  const cart = getCart().map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );
  saveCart(cart);
  return cart;
};

export const clearCart = () => {
  saveCart([]);
};

export const getCartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);
