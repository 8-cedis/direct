"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatGhs } from "../lib/products";
import { supabase } from "../lib/supabase";

const timeSlots = [
  "8 to 10 AM",
  "10 AM to 12 PM",
  "12 to 2 PM",
  "2 to 4 PM",
  "4 to 6 PM",
  "6 to 8 PM",
];

const paymentMethods = ["Mobile Money", "Bank Card", "Cash on Delivery"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [landmark, setLandmark] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Mobile Money");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const deliveryFee = 12;
  const discount = 5;
  const finalTotal = Math.max(0, totalPrice + deliveryFee - discount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!street || !city || !landmark) {
      setError("Please complete your delivery address details.");
      return;
    }

    if (!selectedSlot) {
      setError("Please choose a delivery time slot.");
      return;
    }

    if (!paymentMethod) {
      setError("Please choose a payment method.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured. Please add the storefront Supabase environment variables.");
      return;
    }

    setSaving(true);
    try {
      const address = `${street}, ${city} (${landmark})`;
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          customer_name: user?.name || "Guest Customer",
          customer_phone: user?.phone || "",
          address,
          delivery_slot: selectedSlot,
          total_price: finalTotal,
          status: "pending",
          fulfillment_status: "Confirmed",
          payment_status: paymentMethod === "Cash on Delivery" ? "pending" : "paid",
          payment_method: paymentMethod,
        })
        .select("id")
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: Number(item.product.id) || null,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) {
        throw new Error(itemsError.message);
      }

      if (user?.customerId) {
        await supabase
          .from("customers")
          .update({
            total_orders: Number(user.totalOrders || 0) + 1,
            total_spent: Number(user.totalSpent || 0) + finalTotal,
          })
          .eq("id", user.customerId);
      }

      clearCart();
      router.push("/checkout/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl">Checkout</h1>
        <p className="text-sm text-[var(--color-muted)]">Complete delivery details, pick a time slot, and place your order.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-green)] text-sm font-bold text-white">1</span>
              <h2 className="display-title text-2xl">Delivery address</h2>
            </div>

            <div className="space-y-3">
              <input value={street} onChange={(event) => setStreet(event.target.value)} placeholder="Street" className="control w-full px-3 py-2" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="control w-full px-3 py-2" />
                <input value={landmark} onChange={(event) => setLandmark(event.target.value)} placeholder="Landmark" className="control w-full px-3 py-2" />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-green)] text-sm font-bold text-white">2</span>
              <h2 className="display-title text-2xl">Delivery time</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`badge-pill px-4 py-2 text-sm ${
                    selectedSlot === slot
                      ? "bg-[var(--color-primary-green)] text-white"
                      : "bg-white text-[var(--color-dark-green)] hover:bg-[var(--color-light-green)]"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-green)] text-sm font-bold text-white">3</span>
              <h2 className="display-title text-2xl">Payment method</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {paymentMethods.map((method) => (
                <label
                  key={method}
                  className={`card flex items-center gap-2 p-3 ${
                    paymentMethod === method ? "bg-[var(--color-light-green)]" : "bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  <span className="text-sm font-semibold">{method}</span>
                </label>
              ))}
            </div>
          </section>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60">
            {saving ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="display-title text-2xl">Order summary</h2>

          <div className="mt-4 space-y-2 border-b-[0.5px] border-black/15 pb-3 text-sm">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between gap-3">
                <span className="text-[var(--color-muted)]">
                  {item.product.name} x {item.quantity}
                </span>
                <span>{formatGhs(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Subtotal</span>
              <span>{formatGhs(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Delivery</span>
              <span>{formatGhs(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Discount</span>
              <span>-{formatGhs(discount)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t-[0.5px] border-black/15 pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-[var(--color-primary-green)]">{formatGhs(finalTotal)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
