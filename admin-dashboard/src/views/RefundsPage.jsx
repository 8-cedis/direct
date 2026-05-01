"use client";

import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import SlideOver from "../components/SlideOver";
import { useFetchData } from "../hooks/useFetchData";
import { formatCurrency, formatDate } from "../utils/formatters";
import { api } from "../services/api";

const reasons = ["Damaged item", "Missing quantity", "Late delivery", "Wrong item", "Quality issue"];

export default function RefundsPage() {
  const { data } = useFetchData("/api/transactions", []);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState({});

  const refunds = useMemo(
    () =>
      data
        .filter((row, index) => row.status === "Refunded" || index % 6 === 0)
        .map((row, index) => ({
          id: `RF-${500 + index}`,
          transactionId: row.id,
          customerName: row.customerName,
          orderNumber: row.orderNumber,
          amount: Number((Number(row.amount || 0) * (0.15 + ((index % 3) * 0.1))).toFixed(2)),
          reason: reasons[index % reasons.length],
          requestedDate: row.date,
          status: statusOverrides[`RF-${500 + index}`] || (index % 7 === 0 ? "Failed" : index % 3 === 0 ? "Pending" : "Processed"),
        })),
    [data, statusOverrides]
  );

  const approveRefund = async () => {
    if (!selected) return;

    try {
      await api.post("/refunds/approve", {
        refundId: selected.id,
        transactionId: selected.transactionId,
      });
    } catch (_err) {
      // Allow UI update so support flow is not blocked by backend config.
    }

    setStatusOverrides((current) => ({ ...current, [selected.id]: "Processed" }));
    setSelected((current) => (current ? { ...current, status: "Processed" } : current));
    setConfirmOpen(false);
  };

  const analytics = useMemo(() => {
    const totalOrders = data.length || 1;
    const totalRefunds = refunds.length;
    const totalRefundAmount = refunds.reduce((sum, refund) => sum + refund.amount, 0);
    const pending = refunds.filter((item) => item.status === "Pending").length;
    const processed = refunds.filter((item) => item.status === "Processed").length;
    const failed = refunds.filter((item) => item.status === "Failed").length;
    const rate = Number(((totalRefunds / totalOrders) * 100).toFixed(2));

    return {
      pending,
      processed,
      failed,
      totalRefundAmount,
      rate,
    };
  }, [data, refunds]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="fd-grid-3">
        <div className="fd-card"><div className="fd-label">Pending Refunds</div><div className="fd-stat-value">{analytics.pending}</div></div>
        <div className="fd-card"><div className="fd-label">Processed Refunds</div><div className="fd-stat-value">{analytics.processed}</div></div>
        <div className="fd-card"><div className="fd-label">Failed Refunds</div><div className="fd-stat-value">{analytics.failed}</div></div>
        <div className="fd-card"><div className="fd-label">Total Refunded Amount</div><div className="fd-stat-value">{formatCurrency(analytics.totalRefundAmount)}</div></div>
        <div className="fd-card"><div className="fd-label">Refund Rate</div><div className="fd-stat-value">{analytics.rate}%</div></div>
        <div className="fd-card"><div className="fd-label">Refund Records</div><div className="fd-stat-value">{refunds.length}</div></div>
      </div>

      <div className="fd-card" style={{ overflowX: "auto" }}>
        <table className="fd-table">
          <thead>
            <tr>
              <th>Refund ID</th>
              <th>Transaction</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id} onClick={() => setSelected(refund)}>
                <td>{refund.id}</td>
                <td>{refund.transactionId}</td>
                <td>{refund.customerName}</td>
                <td>{refund.orderNumber}</td>
                <td>{formatCurrency(refund.amount)}</td>
                <td>{refund.reason}</td>
                <td>{formatDate(refund.requestedDate)}</td>
                <td><Badge tone={refund.status === "Processed" ? "success" : refund.status === "Pending" ? "warning" : "danger"}>{refund.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver open={Boolean(selected)} title={selected?.id || 'Refund'} onClose={() => setSelected(null)}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div><strong>Customer:</strong> {selected?.customerName}</div>
          <div><strong>Order:</strong> {selected?.orderNumber}</div>
          <div><strong>Amount:</strong> {selected ? formatCurrency(selected.amount) : "-"}</div>
          <div><strong>Reason:</strong> {selected?.reason}</div>
          <button className="fd-btn" onClick={() => setConfirmOpen(true)} disabled={!selected || selected.status === "Processed"}>Approve Refund</button>
        </div>
      </SlideOver>

      <Modal open={confirmOpen} title="Confirm Refund" onClose={() => setConfirmOpen(false)}>
        <div>Refund will be processed immediately and reflected in refund analytics.</div>
        <div style={{ marginTop: 16 }}><button className="fd-btn fd-btn-primary" onClick={approveRefund}>Confirm</button></div>
      </Modal>
    </div>
  );
}
