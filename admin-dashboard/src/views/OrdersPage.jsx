"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import SlideOver from "../components/SlideOver";
import Tabs from "../components/Tabs";
import {
  fetchOrders,
  getOrdersAnalytics,
  updateOrderStatus,
  refundOrder,
  cancelOrder,
} from "../services/ordersService";
import { formatCurrency, formatDate, formatTime } from "../utils/formatters";

const tabs = ["All", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const normalizeText = (value) => String(value || "").toLowerCase();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [statusValue, setStatusValue] = useState("processing");
  const [statusNote, setStatusNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);
  const range = searchParams.get("range") || "30d";

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [analyticsData, ordersData] = await Promise.all([
        getOrdersAnalytics(range),
        fetchOrders(selectedTab === "All" ? {} : { status: selectedTab }, 1000),
      ]);

      setAnalytics(analyticsData);
      setOrders(ordersData.orders || []);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTab, range]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const needle = normalizeText(search);
    return orders.filter((order) => {
      const haystack = [
        order.orderId,
        order.customerName,
        order.phone,
        order.address,
        ...(order.items || []).map((item) => item.productName),
      ].join(" ");
      return normalizeText(haystack).includes(needle);
    });
  }, [orders, search]);

  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageRows = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const openOrder = (order) => {
    setSelectedOrder(order);
    setStatusValue(order.status || "processing");
    setStatusNote("");
    setRefundAmount("");
    setRefundReason("");
    setCancelReason("");
  };

  const saveStatus = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateOrderStatus(selectedOrder.id, statusValue, statusNote);
      await loadData();
      setSelectedOrder(null);
    } finally {
      setSaving(false);
    }
  };

  const issueRefund = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await refundOrder(selectedOrder.id, toNumber(refundAmount), refundReason || "Admin refund");
      await loadData();
      setSelectedOrder(null);
    } finally {
      setSaving(false);
    }
  };

  const cancelSelected = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await cancelOrder(selectedOrder.id, cancelReason || "Cancelled by admin");
      await loadData();
      setSelectedOrder(null);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "orderId", label: "Order ID" },
    { key: "customerName", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "totalPrice", label: "Amount", render: (row) => formatCurrency(toNumber(row.totalPrice)) },
    { key: "status", label: "Status", render: (row) => <Badge tone={row.status === "delivered" ? "success" : row.status === "cancelled" ? "danger" : "warning"}>{row.status}</Badge> },
    { key: "paymentStatus", label: "Payment", render: (row) => <Badge tone={row.paymentStatus === "paid" ? "success" : row.paymentStatus === "refunded" ? "info" : "neutral"}>{row.paymentStatus}</Badge> },
    { key: "createdAt", label: "Created", render: (row) => `${formatDate(row.createdAt)} ${formatTime(row.createdAt)}` },
    { key: "actions", label: "Actions", render: (row) => <Button size="sm" onClick={() => openOrder(row)}>View</Button> },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="fd-grid-4">
        <article className="fd-card"><div className="fd-label">Total Orders</div><div className="fd-stat-value">{analytics?.totalOrders || 0}</div></article>
        <article className="fd-card"><div className="fd-label">Revenue</div><div className="fd-stat-value">{formatCurrency(analytics?.totalRevenue || 0)}</div></article>
        <article className="fd-card"><div className="fd-label">Avg Order Value</div><div className="fd-stat-value">{formatCurrency(analytics?.avgOrderValue || 0)}</div></article>
        <article className="fd-card"><div className="fd-label">Delivered</div><div className="fd-stat-value">{analytics?.statusBreakdown?.delivered || 0}</div></article>
      </section>

      {error && <div className="fd-card" style={{ color: "var(--fd-danger)" }}>{error}</div>}

      <Tabs tabs={tabs} active={selectedTab} onChange={setSelectedTab} />

      <section className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input placeholder="Search by order, customer, phone, item" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button variant="secondary" onClick={loadData}>Refresh</Button>
        </div>
      </section>

      {loading ? <div className="fd-card">Loading orders...</div> : <DataTable columns={columns} rows={pageRows} onRowClick={openOrder} emptyText="No orders found." />}

      <Pagination
        page={page}
        pageCount={pageCount}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(pageCount, value + 1))}
      />

      <SlideOver open={Boolean(selectedOrder)} title={selectedOrder ? `Order ${selectedOrder.orderId || selectedOrder.id}` : "Order details"} onClose={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="fd-card" style={{ padding: 12, display: "grid", gap: 6 }}>
              <strong>{selectedOrder.customerName}</strong>
              <div>{selectedOrder.phone}</div>
              <div>{selectedOrder.address}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <Badge tone="neutral">{selectedOrder.status}</Badge>
                <Badge tone="info">{selectedOrder.paymentStatus}</Badge>
              </div>
            </div>

            <div className="fd-card" style={{ padding: 12, display: "grid", gap: 8 }}>
              <strong>Items</strong>
              {(selectedOrder.items || []).map((item, index) => (
                <div key={`${item.productId || item.productName}-${index}`} className="fd-card" style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>{item.productName} x {item.quantity}</div>
                  <div>{formatCurrency(toNumber(item.subtotal ?? item.unitPrice * item.quantity))}</div>
                </div>
              ))}
            </div>

            <div className="fd-card" style={{ padding: 12, display: "grid", gap: 8 }}>
              <strong>Update Status</strong>
              <select className="fd-select" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="processing">processing</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
              <Input label="Status note" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
              <Button onClick={saveStatus} disabled={saving}>Save Status</Button>
            </div>

            <div className="fd-card" style={{ padding: 12, display: "grid", gap: 8 }}>
              <strong>Refund</strong>
              <Input label="Refund amount" type="number" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} />
              <Input label="Refund reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} />
              <Button variant="secondary" onClick={issueRefund} disabled={saving || !refundAmount}>Issue Refund</Button>
            </div>

            <div className="fd-card" style={{ padding: 12, display: "grid", gap: 8 }}>
              <strong>Cancel Order</strong>
              <Input label="Cancellation reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
              <Button variant="destructive" onClick={cancelSelected} disabled={saving || !cancelReason}>Cancel Order</Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
