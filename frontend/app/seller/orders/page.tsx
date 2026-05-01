"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { Order } from "../../types";

const statuses: Array<Order["fulfillment_status"]> = ["Confirmed", "Packed", "In Transit", "Delivered"];

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const data = await apiRequest<Order[]>("/orders");
      setOrders(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    // Initial async fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
  }, []);

  const handleStatusChange = async (orderId: number, fulfillmentStatus: string) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ fulfillmentStatus }),
      });
      setMessage(`Order #${orderId} updated to ${fulfillmentStatus}`);
      await loadOrders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl text-[#4F633D]">Seller Incoming Orders</h1>
        <p className="text-slate-700">Manage order progression from Confirmed to Delivered.</p>
      </div>

      {message && <div className="glass rounded-xl p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.03 }}
            className="glass rounded-2xl p-5"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-600">Order</p>
                <p className="font-semibold text-slate-900">#{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Buyer</p>
                <p className="font-semibold text-slate-900">{order.customer_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Total</p>
                <p className="font-semibold text-[#4F633D]">${Number(order.total_price).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Current Status</p>
                <p className="font-semibold text-slate-900">{order.fulfillment_status || "Confirmed"}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(order.id, status || "Confirmed")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    (order.fulfillment_status || "Confirmed") === status
                      ? "bg-[#4F633D] text-white"
                      : "bg-white text-[#4F633D]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
