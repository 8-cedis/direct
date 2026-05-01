"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { FarmProduct, ProductCategory } from "../lib/products";
import { fetchStorefrontProducts } from "../lib/storefrontProducts";

type Filter = "all" | ProductCategory | "organic";
type SortOption = "newest" | "low-high" | "high-low";

const filterOptions: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "grains", label: "Grains" },
  { key: "organic", label: "Organic" },
];

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextProducts = await fetchStorefrontProducts();
      setProducts(nextProducts);
    } catch {
      setProducts([]);
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const category = searchParams.get("category")?.toLowerCase();
    if (category === "vegetables" || category === "fruits" || category === "grains") {
      // URL param drives initial filter state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveFilter(category);
      return;
    }
    setActiveFilter("all");
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = products.filter((product) => {
      const bySearch = product.name.toLowerCase().includes(search.toLowerCase());

      if (activeFilter === "all") {
        return bySearch;
      }
      if (activeFilter === "organic") {
        return bySearch && product.isOrganic;
      }
      return bySearch && product.category === activeFilter;
    });

    if (sortBy === "low-high") {
      list = [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "high-low") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === "newest") {
      list = [...list];
    }

    return list;
  }, [products, search, activeFilter, sortBy]);

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl text-[var(--color-dark-green)]">Fresh produce catalog</h1>
        <p className="text-sm text-[var(--color-muted)]">Find farm products by category, organic quality, and price.</p>
      </div>

      <div className="card p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">🔎</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="control w-full py-3 pl-9 pr-3"
            placeholder="Search products, farms, or categories"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                type="button"
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`badge-pill px-4 py-1.5 text-sm ${
                  activeFilter === option.key
                    ? "bg-[var(--color-primary-green)] text-white"
                    : "bg-white text-[var(--color-dark-green)] hover:bg-[var(--color-light-green)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            className="control px-3 py-2 text-sm"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="newest">Newest</option>
            <option value="low-high">Price Low to High</option>
            <option value="high-low">Price High to Low</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <p className="display-title text-2xl">Loading products...</p>
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <p className="display-title text-2xl">Unable to load products</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{error}</p>
          <button type="button" onClick={() => void loadProducts()} className="btn-secondary mt-4 px-4 py-2 text-sm font-semibold">
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="display-title text-2xl">No products yet</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Products added from the admin dashboard will appear here automatically.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="display-title text-2xl">No products match your search</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Try a different search term or clear filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
              setSortBy("newest");
            }}
            className="btn-secondary mt-4 px-4 py-2 text-sm font-semibold"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id}>
              <Link href={`/products/${product.id}`} className="mb-2 block text-sm font-semibold text-[var(--color-primary-green)] hover:text-[var(--color-mid-green)]">
                View details
              </Link>
              <ProductCard product={product} onAddToCart={(item) => addToCart(item, 1)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<section className="card p-6 text-sm text-[var(--color-muted)]">Loading products...</section>}>
      <ProductsPageContent />
    </Suspense>
  );
}
