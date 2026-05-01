"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { FarmProduct } from "../lib/products";

type CartItem = {
  product: FarmProduct;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM"; payload: { product: FarmProduct; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string | number } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string | number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

const CART_STORAGE_KEY = "farmdirect_cart";

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "LOAD_CART":
      return { items: action.payload };
    case "ADD_ITEM": {
      const { product, quantity } = action.payload;
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + Math.max(1, quantity) }
              : item
          ),
        };
      }
      return { items: [...state.items, { product, quantity: Math.max(1, quantity) }] };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((item) => String(item.product.id) !== String(action.payload.productId)),
      };
    case "UPDATE_QUANTITY":
      return {
        items: state.items
          .map((item) =>
            String(item.product.id) === String(action.payload.productId)
              ? { ...item, quantity: Math.max(1, action.payload.quantity) }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: FarmProduct, quantity?: number) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      dispatch({ type: "LOAD_CART", payload: parsed });
    } catch {
      dispatch({ type: "LOAD_CART", payload: [] });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      items: state.items,
      totalItems,
      totalPrice,
      addToCart: (product, quantity = 1) =>
        dispatch({ type: "ADD_ITEM", payload: { product, quantity } }),
      removeFromCart: (productId) => dispatch({ type: "REMOVE_ITEM", payload: { productId } }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
