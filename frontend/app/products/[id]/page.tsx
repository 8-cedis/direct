"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProductCard from "../../components/ProductCard";
import QuantitySelector from "../../components/QuantitySelector";
import { useCart } from "../../context/CartContext";
import { FarmProduct, formatGhs } from "../../lib/products";
import { fetchStorefrontProducts } from "../../lib/storefrontProducts";

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextProducts = await fetchStorefrontProducts();
      setProducts(nextProducts);
    } catch {
      setProducts([]);
      setError("Failed to load this product right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const productId = params?.id;
  const product = useMemo(() => products.find((item) => String(item.id) === String(productId)) ?? null, [products, productId]);

  if (isLoading) {
    return (
      <div className="card p-12 text-center">
        <p className="display-title text-2xl">Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center">
        <p className="display-title text-2xl">Unable to load product</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{error}</p>
        <button type="button" onClick={() => void loadProducts()} className="btn-secondary mt-4 px-4 py-2 text-sm font-semibold">
          Try again
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card p-12 text-center">
        <p className="display-title text-2xl">Product not found</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">This product may not be listed yet in the admin dashboard.</p>
        <Link href="/products" className="btn-primary mt-4 inline-block px-4 py-2 text-sm font-semibold">
          Back to catalog
        </Link>
      </div>
    );
  }

  const totalPrice = product.price * quantity;
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <div className="text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:text-[var(--color-primary-green)]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-[var(--color-primary-green)]">Catalog</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card flex min-h-[320px] items-center justify-center overflow-hidden bg-[var(--color-light-green)] p-8">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full rounded-[var(--radius-card)] object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[var(--radius-card)] bg-white/60 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              No image available
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {product.isOrganic && <span className="badge-pill bg-[var(--color-light-green)] text-[var(--color-primary-green)]">Organic</span>}
            <span className="badge-pill bg-[var(--color-light-green)] text-[var(--color-primary-green)]">Farm Fresh</span>
            <span className="badge-pill bg-[var(--color-earth-light)] text-[var(--color-earth-brown)]">Locally Sourced</span>
          </div>

          <h1 className="display-title text-4xl text-[var(--color-dark-green)]">{product.name}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {product.farmName} • {product.farmRegion}
          </p>

          <p className="mt-4 text-3xl font-bold text-[var(--color-primary-green)]">{formatGhs(product.price)}</p>
          <p className="text-sm text-[var(--color-muted)]">per {product.unit}</p>

          <div className="mt-5 flex items-center justify-between gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} max={product.stockQuantity} />
            <p className="text-sm text-[var(--color-muted)]">
              Total: <span className="font-semibold text-[var(--color-dark-green)]">{formatGhs(totalPrice)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, quantity)}
            className="btn-primary mt-5 w-full px-4 py-3 text-sm font-semibold"
          >
            Add to cart
          </button>

          <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">{product.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="card p-3 text-center">
              <p className="text-xs text-[var(--color-muted)]">Calories</p>
              <p className="font-semibold text-[var(--color-dark-green)]">{product.nutrition.calories} kcal</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-[var(--color-muted)]">Protein</p>
              <p className="font-semibold text-[var(--color-dark-green)]">{product.nutrition.protein} g</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-[var(--color-muted)]">Fat</p>
              <p className="font-semibold text-[var(--color-dark-green)]">{product.nutrition.fat} g</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xs text-[var(--color-muted)]">Carbs</p>
              <p className="font-semibold text-[var(--color-dark-green)]">{product.nutrition.carbohydrates} g</p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="display-title text-2xl">Related products</h2>
        {related.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--color-muted)]">More products from this category will appear here.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} onAddToCart={(picked) => addToCart(picked, 1)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
