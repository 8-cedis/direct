"use client";

import { FarmProduct, formatGhs } from "../lib/products";

type Props = {
  product: FarmProduct;
  onAddToCart: (product: FarmProduct) => void;
};

const categoryStyles: Record<FarmProduct["category"], string> = {
  vegetables: "bg-[var(--color-light-green)]",
  fruits: "bg-[var(--color-earth-light)]",
  grains: "bg-[#e8f0ff]",
};

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <article className="card p-4">
      <div className={`mb-3 flex h-24 items-center justify-center overflow-hidden rounded-[var(--radius-card)] relative ${categoryStyles[product.category]}`}>
        {/* Large Emoji as primary visual */}
        <div className="flex h-full w-full items-center justify-center text-6xl select-none z-10">
          {product.emoji}
        </div>
        
        {/* Subtle image overlay if available */}
        {product.image && (
          <img 
            src={product.image} 
            alt="" 
            className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale mix-blend-multiply" 
          />
        )}
      </div>

      <div className="mb-2">
        <span className="badge-pill bg-[var(--color-light-green)] text-[var(--color-primary-green)] capitalize">
          {product.category}
        </span>
      </div>

      <h3 className="display-title text-xl text-[var(--color-dark-green)]">{product.name}</h3>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-[var(--color-primary-green)]">{formatGhs(product.price)}</p>
          <p className="text-sm text-[var(--color-muted)]">per {product.unit}</p>
        </div>

        <button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => onAddToCart(product)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[0.5px] border-black/15 bg-[var(--color-primary-green)] text-lg font-bold text-white hover:bg-[var(--color-mid-green)]"
        >
          +
        </button>
      </div>
    </article>
  );
}
