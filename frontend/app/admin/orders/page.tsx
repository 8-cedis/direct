"use client";

import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { Order } from "../../types";

const disputeOptions: Array<Order["dispute_status"]> = ["none", "open", "in_review", "resolved", "rejected"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [disputeStatus, setDisputeStatus] = useState<Order["dispute_status"]>("none");
  const [disputeNote, setDisputeNote] = useState("");
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

  const onManageDispute = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError("Select an order first.");
      return;
    }

    setError("");
    setMessage("");
    try {
      await apiRequest(`/orders/${selectedOrderId}/dispute`, {
        method: "PUT",
        body: JSON.stringify({ disputeStatus, disputeNote }),
      });
      setMessage(`Dispute for order #${selectedOrderId} updated.`);
      await loadOrders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl text-[#4F633D]">Admin Order Management</h1>
        <p className="text-slate-700">View all orders and resolve disputes efficiently.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {orders.map((order, index) => (
            <motion.button
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              onClick={() => {
                setSelectedOrderId(order.id);
                setDisputeStatus(order.dispute_status || "none");
                setDisputeNote(order.dispute_note || "");
              }}
              className={`glass w-full rounded-2xl p-4 text-left ${
                selectedOrderId === order.id ? "ring-2 ring-[#4F633D]" : ""
              }`}
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <div>
                  <p className="text-xs text-slate-600">Order ID</p>
                  <p className="font-semibold text-slate-900">#{order.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Buyer</p>
                  <p className="font-semibold text-slate-900">{order.customer_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Fulfillment</p>
                  <p className="font-semibold text-slate-900">{order.fulfillment_status || "Confirmed"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Dispute</p>
                  <p className="font-semibold text-slate-900">{order.dispute_status || "none"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Amount</p>
                  <p className="font-semibold text-[#4F633D]">${Number(order.total_price).toFixed(2)}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <form onSubmit={onManageDispute} className="glass h-fit rounded-2xl p-5 space-y-4 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-[#4F633D]">Manage Dispute</h2>
          <p className="text-sm text-slate-700">
            Selected Order: {selectedOrderId ? `#${selectedOrderId}` : "None"}
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Dispute Status</label>
            <select
              value={disputeStatus}
              onChange={(e) => setDisputeStatus(e.target.value as Order["dispute_status"])}
              className="w-full rounded-lg border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            >
              {disputeOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Note</label>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
              placeholder="Describe dispute context or resolution notes"
            />
          </div>

          {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

          <button type="submit" className="btn-primary w-full px-4 py-2">
            Save Dispute Update
          </button>
        </form>
      </div>
    </section>
  );
}
