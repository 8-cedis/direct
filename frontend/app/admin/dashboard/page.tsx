"use client";

import { motion } from "framer-motion";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { AdminOverview, AdminReport, Order, Product, User } from "../../types";

const periods: Array<AdminReport["period"]> = ["daily", "weekly", "monthly"];

type PromotionForm = {
  productId: number;
  isFeatured: boolean;
  promotionText: string;
  discountPercent: string;
};

const defaultPromotion: PromotionForm = {
  productId: 0,
  isFeatured: false,
  promotionText: "",
  discountPercent: "0",
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [reportPeriod, setReportPeriod] = useState<AdminReport["period"]>("daily");
  const [report, setReport] = useState<AdminReport | null>(null);
  const [disputes, setDisputes] = useState<Order[]>([]);
  const [promotionForm, setPromotionForm] = useState<PromotionForm>(defaultPromotion);
  const [disputeStatus, setDisputeStatus] = useState<Order["dispute_status"]>("in_review");
  const [disputeNote, setDisputeNote] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [overviewData, usersData, pendingData, reportData, disputesData, productsData] = await Promise.all([
        apiRequest<AdminOverview>("/admin/overview"),
        apiRequest<User[]>("/admin/users"),
        apiRequest<Product[]>("/admin/products/pending"),
        apiRequest<AdminReport>(`/admin/reports?period=${reportPeriod}`),
        apiRequest<Order[]>("/admin/disputes"),
        apiRequest<Product[]>("/products"),
      ]);

      setOverview(overviewData);
      setUsers(usersData);
      setPendingProducts(pendingData);
      setReport(reportData);
      setDisputes(disputesData);
      setAllProducts(productsData);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [reportPeriod]);

  useEffect(() => {
    // Refresh dashboard data when the selected period changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, [loadAll]);

  const handleSuspendUser = async (id: number, suspended: boolean) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/users/${id}/suspend`, {
        method: "PUT",
        body: JSON.stringify({ suspended }),
      });
      setMessage(`User #${id} ${suspended ? "suspended" : "reactivated"}.`);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/users/${id}`, { method: "DELETE" });
      setMessage(`User #${id} deleted.`);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleProductApproval = async (id: number, status: "approved" | "rejected") => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/products/${id}/approval`, {
        method: "PUT",
        body: JSON.stringify({ status, note: status === "approved" ? "Approved by admin" : "Rejected by admin" }),
      });
      setMessage(`Product #${id} ${status}.`);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePromotion = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await apiRequest(`/admin/products/${promotionForm.productId}/promotion`, {
        method: "PUT",
        body: JSON.stringify({
          isFeatured: promotionForm.isFeatured,
          promotionText: promotionForm.promotionText,
          discountPercent: Number(promotionForm.discountPercent),
        }),
      });
      setMessage(`Promotion updated for product #${promotionForm.productId}.`);
      setPromotionForm(defaultPromotion);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDisputeResolution = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId) return;

    setError("");
    setMessage("");
    try {
      await apiRequest(`/orders/${selectedDisputeId}/dispute`, {
        method: "PUT",
        body: JSON.stringify({ disputeStatus, disputeNote }),
      });
      setMessage(`Dispute updated for order #${selectedDisputeId}.`);
      setSelectedDisputeId(null);
      setDisputeNote("");
      setDisputeStatus("in_review");
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass relative overflow-hidden rounded-3xl p-8"
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[rgba(139,161,148,0.22)]" />
        <div className="pointer-events-none absolute -bottom-14 right-8 h-44 w-44 rounded-full bg-[rgba(79,99,61,0.16)]" />
        <h1 className="display-title text-4xl text-[#4F633D] md:text-5xl">Admin Dashboard</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          Centralized control for users, orders, listings, finance, promotions, and dispute resolution.
        </p>
      </motion.div>

      {message && <div className="glass rounded-xl p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={overview?.totalUsers || 0} />
        <StatCard title="Total Orders" value={overview?.totalOrders || 0} />
        <StatCard title="Total Revenue" value={`$${(overview?.totalRevenue || 0).toFixed(2)}`} />
        <StatCard title="Active Listings" value={overview?.activeListings || 0} />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 xl:col-span-2"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">User Management</h2>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-center">
                  <div>
                    <p className="text-xs text-slate-600">User</p>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="font-semibold text-slate-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Status</p>
                    <p className="font-semibold text-slate-900">{user.status || "active"}</p>
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <button
                      onClick={() => handleSuspendUser(user.id, !user.suspended)}
                      className="btn-secondary px-3 py-1 text-sm"
                    >
                      {user.suspended ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Financial Reports</h2>
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value as AdminReport["period"])}
            className="mt-4 w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Orders</span>
              <span className="font-semibold text-slate-900">{report?.orders || 0}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Revenue</span>
              <span className="font-semibold text-slate-900">${(report?.revenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Avg Order Value</span>
              <span className="font-semibold text-slate-900">${(report?.averageOrderValue || 0).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Approve Listings</h2>
          <div className="mt-4 space-y-3">
            {pendingProducts.length === 0 && (
              <p className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">No pending listings.</p>
            )}
            {pendingProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-4">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-700">${Number(product.price).toFixed(2)} • Stock {product.stock || 0}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleProductApproval(product.id, "approved")}
                    className="btn-primary px-3 py-1 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleProductApproval(product.id, "rejected")}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handlePromotion}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Promotions and Featured Listings</h2>
          <div className="mt-4 space-y-3">
            <select
              value={promotionForm.productId}
              onChange={(e) => setPromotionForm((prev) => ({ ...prev, productId: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
              required
            >
              <option value={0}>Select product</option>
              {allProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  #{product.id} {product.name}
                </option>
              ))}
            </select>
            <input
              value={promotionForm.promotionText}
              onChange={(e) => setPromotionForm((prev) => ({ ...prev, promotionText: e.target.value }))}
              placeholder="Promotion text"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            />
            <input
              value={promotionForm.discountPercent}
              onChange={(e) => setPromotionForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
              type="number"
              min={0}
              max={90}
              placeholder="Discount %"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            />
            <label className="flex items-center gap-2 rounded-xl bg-white/65 p-3 text-sm font-semibold text-[#4F633D]">
              <input
                type="checkbox"
                checked={promotionForm.isFeatured}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
              />
              Mark as featured listing
            </label>
            <button type="submit" className="btn-primary w-full px-4 py-2">
              Save Promotion
            </button>
          </div>
        </motion.form>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onSubmit={handleDisputeResolution}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-[#4F633D]">Complaint and Dispute Resolution</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {disputes.length === 0 && (
              <p className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">No active disputes.</p>
            )}
            {disputes.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setSelectedDisputeId(order.id);
                  setDisputeStatus(order.dispute_status || "in_review");
                  setDisputeNote(order.dispute_note || "");
                }}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedDisputeId === order.id
                    ? "border-[rgba(79,99,61,0.5)] bg-[rgba(139,161,148,0.2)]"
                    : "border-[rgba(79,99,61,0.2)] bg-white/60"
                }`}
              >
                <p className="font-semibold text-slate-900">Order #{order.id}</p>
                <p className="text-sm text-slate-700">Dispute: {order.dispute_status}</p>
                <p className="text-sm text-slate-700">{order.dispute_note || "No note"}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#4F633D]">
              Selected Order: {selectedDisputeId ? `#${selectedDisputeId}` : "None"}
            </p>
            <select
              value={disputeStatus}
              onChange={(e) => setDisputeStatus(e.target.value as Order["dispute_status"])}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            >
              <option value="open">open</option>
              <option value="in_review">in_review</option>
              <option value="resolved">resolved</option>
              <option value="rejected">rejected</option>
              <option value="none">none</option>
            </select>
            <textarea
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
              placeholder="Resolution notes"
            />
            <button type="submit" className="btn-primary w-full px-4 py-2" disabled={!selectedDisputeId}>
              Update Dispute
            </button>
          </div>
        </div>
      </motion.form>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-2xl p-5"
    >
      <p className="text-sm text-slate-700">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#4F633D]">{value}</p>
    </motion.div>
  );
}
