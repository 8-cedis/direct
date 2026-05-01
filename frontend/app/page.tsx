"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./components/ProductCard";
import { useCart } from "./context/CartContext";
import { FarmProduct } from "./lib/products";
import { fetchStorefrontProducts } from "./lib/storefrontProducts";

const categoryCards = [
  { name: "Vegetables", key: "vegetables", href: "/products?category=vegetables", icon: "🥦" },
  { name: "Fruits", key: "fruits", href: "/products?category=fruits", icon: "🍊" },
  { name: "Grains", key: "grains", href: "/products?category=grains", icon: "🌾" },
] as const;

export default function Home() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadProducts = async () => {
      try {
        const nextProducts = await fetchStorefrontProducts();
        if (!isActive) {
          return;
        }
        setProducts(nextProducts);
      } catch {
        if (isActive) {
          setProducts([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, []);

  const featured = useMemo(() => products.slice(0, 4), [products]);
  const categoryCounts = useMemo(() => {
    return products.reduce(
      (counts, product) => {
        counts[product.category] += 1;
        return counts;
      },
      { vegetables: 0, fruits: 0, grains: 0 } as Record<FarmProduct["category"], number>
    );
  }, [products]);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-[var(--color-primary-green)] to-[var(--color-mid-green)] px-5 py-12 text-white md:px-10 md:py-16">
        <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <span className="absolute right-14 top-8 h-16 w-16 rounded-full bg-white/30" />

        <div className="relative z-10 max-w-3xl">
          <span className="badge-pill inline-flex bg-white/15 text-white">Farm fresh • Same day delivery</span>
          <h1 className="display-title mt-4 text-4xl leading-tight md:text-6xl">From the farm, to your door</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
            We deliver trusted produce from Ghanaian farms to urban homes across Accra, quickly and reliably.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary px-5 py-3 text-sm font-semibold">
              Shop now
            </Link>
            <a href="#how-it-works" className="btn-secondary border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="display-title text-2xl md:text-3xl">Browse Categories</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {categoryCards.map((cat) => (
            <Link key={cat.name} href={cat.href} className="card block p-5">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{cat.icon}</span>
                <span className="badge-pill bg-[var(--color-light-green)] text-[var(--color-primary-green)]">{categoryCounts[cat.key]} items</span>
              </div>
              <p className="mt-4 text-lg font-semibold text-[var(--color-dark-green)]">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-earth-brown)]">Featured products</p>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="display-title text-2xl md:text-3xl">Picked for your kitchen this week</h2>
          <Link href="/products" className="text-sm font-semibold text-[var(--color-primary-green)] hover:text-[var(--color-mid-green)]">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="card p-6 text-sm text-[var(--color-muted)]">Loading latest products...</div>
        ) : featured.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="display-title text-2xl">No products yet</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Products added from the admin dashboard will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={(item) => addToCart(item, 1)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

