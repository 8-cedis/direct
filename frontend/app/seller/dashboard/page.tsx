"use client";

import { motion } from "framer-motion";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/api";
import { Order, Product } from "../../types";

type SalesSummary = {
  revenue: number;
  settledRevenue: number;
  totalOrders: number;
  fulfilledOrders: number;
  averageOrderValue: number;
  payout: {
    available: number;
    processing: number;
    nextPayoutDate: string;
  };
};

type InventoryAlertResponse = {
  threshold: number;
  totalProducts: number;
  lowStockCount: number;
  items: Product[];
};

const workflow: Array<Order["fulfillment_status"]> = ["Confirmed", "Packed", "In Transit", "Delivered"];

const defaultForm = {
  id: 0,
  name: "",
  description: "",
  image: "",
  price: "",
  stock: "",
};

const cardAnim = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.35 },
};

export default function SellerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlertResponse | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const lowStockThreshold = 5;

  const loadAll = async () => {
    try {
      const [productData, orderData, summaryData, alertData] = await Promise.all([
        apiRequest<Product[]>("/products"),
        apiRequest<Order[]>("/seller/incoming-orders"),
        apiRequest<SalesSummary>("/seller/sales-summary"),
        apiRequest<InventoryAlertResponse>(`/seller/inventory-alerts?threshold=${lowStockThreshold}`),
      ]);
      setProducts(productData);
      setIncomingOrders(orderData);
      setSummary(summaryData);
      setAlerts(alertData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    // Initial async fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
  }, []);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= lowStockThreshold),
    [products]
  );

  const onImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      name: form.name,
      description: form.description,
      image: form.image,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      if (form.id) {
        await apiRequest(`/products/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Listing updated successfully.");
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Listing published successfully.");
      }

      setForm(defaultForm);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onDeleteProduct = async (id: number) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE" });
      setMessage(`Listing #${id} deleted.`);
      if (form.id === id) {
        setForm(defaultForm);
      }
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onUpdateOrderStatus = async (orderId: number, fulfillmentStatus: string) => {
    setError("");
    setMessage("");
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ fulfillmentStatus }),
      });
      setMessage(`Order #${orderId} moved to ${fulfillmentStatus}.`);
      await loadAll();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass relative overflow-hidden rounded-3xl p-8"
      >
        <div className="pointer-events-none absolute -left-8 -top-10 h-36 w-36 rounded-full bg-[rgba(139,161,148,0.25)]" />
        <div className="pointer-events-none absolute -bottom-14 right-6 h-44 w-44 rounded-full bg-[rgba(79,99,61,0.14)]" />
        <h1 className="display-title text-4xl text-[#4F633D] md:text-5xl">Seller Dashboard</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          Control listings, monitor inventory, process incoming orders, and track financial performance from one premium workspace.
        </p>
      </motion.div>

      {message && <div className="glass rounded-xl p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div {...cardAnim} className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-700">Revenue</p>
          <p className="mt-2 text-3xl font-extrabold text-[#4F633D]">${(summary?.revenue || 0).toFixed(2)}</p>
        </motion.div>
        <motion.div {...cardAnim} className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-700">Total Orders</p>
          <p className="mt-2 text-3xl font-extrabold text-[#4F633D]">{summary?.totalOrders || 0}</p>
        </motion.div>
        <motion.div {...cardAnim} className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-700">Avg Order Value</p>
          <p className="mt-2 text-3xl font-extrabold text-[#4F633D]">${(summary?.averageOrderValue || 0).toFixed(2)}</p>
        </motion.div>
        <motion.div {...cardAnim} className="glass rounded-2xl p-5">
          <p className="text-sm text-slate-700">Low Stock Alerts</p>
          <p className="mt-2 text-3xl font-extrabold text-[#4F633D]">{alerts?.lowStockCount || 0}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <motion.form
          {...cardAnim}
          onSubmit={onSubmitProduct}
          className="glass h-fit rounded-2xl p-6 xl:sticky xl:top-24"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">{form.id ? "Edit Listing" : "New Listing"}</h2>
          <div className="mt-4 space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Product name"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/70 px-4 py-2"
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your listing"
              rows={4}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/70 px-4 py-2"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/70 px-4 py-2"
                required
              />
              <input
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                type="number"
                min="0"
                placeholder="Stock"
                className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/70 px-4 py-2"
                required
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/70 px-3 py-2 text-sm"
            />
            {form.image && (
              <img src={form.image} alt="Uploaded preview" className="h-40 w-full rounded-xl object-cover" />
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1 px-4 py-2">
                {form.id ? "Update" : "Publish"}
              </button>
              {form.id > 0 && (
                <button
                  type="button"
                  onClick={() => setForm(defaultForm)}
                  className="btn-secondary flex-1 px-4 py-2"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </motion.form>

        <motion.div {...cardAnim} className="space-y-6 xl:col-span-2">
          <div className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#4F633D]">Inventory Tracker</h2>
              <p className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#4F633D]">
                {products.length} listings
              </p>
            </div>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:items-center">
                    <div className="md:col-span-2">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-700">${Number(product.price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Stock</p>
                      <p className="font-semibold text-slate-900">{product.stock || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Alert</p>
                      <p
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          Number(product.stock || 0) <= lowStockThreshold
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {Number(product.stock || 0) <= lowStockThreshold ? "Low" : "Healthy"}
                      </p>
                    </div>
                    <div className="flex gap-2 md:col-span-2 md:justify-end">
                      <button
                        onClick={() =>
                          setForm({
                            id: product.id,
                            name: product.name,
                            description: product.description || "",
                            image: product.image || "",
                            price: String(product.price),
                            stock: String(product.stock || 0),
                          })
                        }
                        className="btn-secondary px-3 py-1 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lowStockProducts.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-700">Low-stock alert</p>
                <p className="mt-1 text-sm text-red-700">
                  {lowStockProducts.map((item) => `${item.name} (${item.stock || 0})`).join(", ")}
                </p>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-2xl font-bold text-[#4F633D]">Incoming Orders</h2>
            <div className="space-y-3">
              {incomingOrders.length === 0 && (
                <p className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">No incoming orders.</p>
              )}
              {incomingOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-center">
                    <div>
                      <p className="text-xs text-slate-600">Order ID</p>
                      <p className="font-semibold text-slate-900">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Buyer</p>
                      <p className="font-semibold text-slate-900">{order.customer_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Amount</p>
                      <p className="font-semibold text-[#4F633D]">${Number(order.total_price).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Status</p>
                      <p className="font-semibold text-slate-900">{order.fulfillment_status || "Confirmed"}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {workflow.map((step) => (
                      <button
                        key={step}
                        onClick={() => onUpdateOrderStatus(order.id, step || "Confirmed")}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          (order.fulfillment_status || "Confirmed") === step
                            ? "bg-[#4F633D] text-white"
                            : "bg-white text-[#4F633D]"
                        }`}
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div {...cardAnim} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-[#4F633D]">Sales Report</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Gross Revenue</span>
              <span className="font-semibold text-slate-900">${(summary?.revenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Settled Revenue</span>
              <span className="font-semibold text-slate-900">${(summary?.settledRevenue || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Total Orders</span>
              <span className="font-semibold text-slate-900">{summary?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Delivered Orders</span>
              <span className="font-semibold text-slate-900">{summary?.fulfilledOrders || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-[#4F633D]">Payout Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Available Payout</span>
              <span className="font-semibold text-emerald-700">${(summary?.payout.available || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Processing Payout</span>
              <span className="font-semibold text-slate-900">${(summary?.payout.processing || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Next Payout Date</span>
              <span className="font-semibold text-slate-900">
                {summary?.payout.nextPayoutDate
                  ? new Date(summary.payout.nextPayoutDate).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
