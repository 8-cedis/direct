const WISHLIST_KEY = "farm_store_wishlist";

export const getWishlistIds = (): number[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(WISHLIST_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const toggleWishlistId = (productId: number): number[] => {
  const current = getWishlistIds();
  const exists = current.includes(productId);
  const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return next;
};
