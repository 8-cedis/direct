"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { formatGhs } from "../lib/products";

const recentOrders = [
  { id: "FD-4201", name: "Weekly Produce Box", date: "Apr 4, 2026", status: "Delivered", amount: 156 },
  { id: "FD-4172", name: "Fruit Refill", date: "Apr 2, 2026", status: "Shipped", amount: 98 },
  { id: "FD-4139", name: "Family Staples", date: "Mar 30, 2026", status: "Processing", amount: 224 },
  { id: "FD-4098", name: "Organic Bundle", date: "Mar 25, 2026", status: "Cancelled", amount: 132 },
] as const;

const statusClass: Record<(typeof recentOrders)[number]["status"], string> = {
  Delivered: "bg-[var(--color-light-green)] text-[var(--color-primary-green)]",
  Shipped: "bg-amber-100 text-amber-700",
  Processing: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="brand-title inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-green)] text-xl text-white">
              {initials}
            </div>

            <div>
              <p className="display-title text-2xl">{user.name}</p>
              <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
              <p className="text-sm text-[var(--color-muted)]">Member since {user.memberSince}</p>
            </div>
          </div>

          <button type="button" onClick={logout} className="btn-secondary px-4 py-2 text-sm font-semibold">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-dark-green)]">{user.totalOrders}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--color-muted)]">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-primary-green)]">{formatGhs(user.totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--color-muted)]">Loyalty Points</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-earth-brown)]">{user.loyaltyPoints}</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display-title text-2xl">Recent orders</h2>
          <Link href="/orders/tracking" className="text-sm font-semibold text-[var(--color-primary-green)]">
            Track order
          </Link>
        </div>

        <div className="space-y-3">
          {recentOrders.map((order) => (
            <article key={order.id} className="card p-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5 md:items-center">
                <p className="font-semibold text-[var(--color-dark-green)]">{order.name}</p>
                <p className="text-sm text-[var(--color-muted)]">{order.id}</p>
                <p className="text-sm text-[var(--color-muted)]">{order.date}</p>
                <span className={`badge-pill w-fit ${statusClass[order.status]}`}>{order.status}</span>
                <p className="text-sm font-semibold text-[var(--color-primary-green)]">{formatGhs(order.amount)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
