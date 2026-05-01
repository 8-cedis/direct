"use client";

import Link from "next/link";
import QuantitySelector from "../components/QuantitySelector";
import { useCart } from "../context/CartContext";
import { formatGhs } from "../lib/products";

export default function CartPage() {
  const { items, totalPrice, removeFromCart, updateQuantity } = useCart();
  const deliveryFee = 12;
  const discount = 5;
  const finalTotal = Math.max(0, totalPrice + deliveryFee - discount);

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl">Your cart</h1>
        <p className="text-sm text-[var(--color-muted)]">Review items from your favorite farms before checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="display-title text-2xl">Your cart is empty</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Add some fresh produce to get started.</p>
          <Link href="/products" className="btn-primary mt-5 inline-block px-5 py-3 text-sm font-semibold">
            Go to catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <article key={item.product.id} className="card p-4">
                <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[70px,1fr,auto,auto]">
                  <div className="h-16 w-16 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-light-green)]">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-[var(--color-dark-green)]">{item.product.name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{item.product.farmName}</p>
                  </div>

                  <QuantitySelector
                    value={item.quantity}
                    onChange={(value) => updateQuantity(item.product.id, value)}
                    max={item.product.stockQuantity}
                  />

                  <div className="text-right">
                    <p className="font-semibold text-[var(--color-primary-green)]">
                      {formatGhs(item.product.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="mt-1 text-sm text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="card h-fit p-5 lg:sticky lg:top-24">
            <h2 className="display-title text-2xl">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span>{formatGhs(totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Delivery fee</span>
                <span>{formatGhs(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Discount</span>
                <span>-{formatGhs(discount)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--color-light-green)] p-3 text-sm text-[var(--color-primary-green)]">
              Estimated delivery: 2 to 3 hours from order confirmation.
            </div>

            <div className="mt-4 flex items-center justify-between border-t-[0.5px] border-black/15 pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-[var(--color-primary-green)]">{formatGhs(finalTotal)}</span>
            </div>

            <Link href="/checkout" className="btn-primary mt-4 block px-4 py-3 text-center text-sm font-semibold">
              Checkout
            </Link>

            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Your payment is encrypted and your order details are secure.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
