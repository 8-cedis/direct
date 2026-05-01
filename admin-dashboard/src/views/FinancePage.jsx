"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../components/ChartCard";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Input from "../components/Input";
import { useFetchData } from "../hooks/useFetchData";
import { formatCurrency, formatDate } from "../utils/formatters";
import { api } from "../services/api";

export default function FinancePage() {
  const { data } = useFetchData("/api/transactions", []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [commissionRate, setCommissionRate] = useState(() => {
    if (typeof window === "undefined") return 12.5;
    const saved = Number(window.localStorage.getItem("fd_commission_rate"));
    return Number.isFinite(saved) ? saved : 12.5;
  });
  const [commissionDraft, setCommissionDraft] = useState(() => {
    if (typeof window === "undefined") return "12.5";
    const saved = Number(window.localStorage.getItem("fd_commission_rate"));
    return Number.isFinite(saved) ? String(saved) : "12.5";
  });
  const [commissionMessage, setCommissionMessage] = useState("");
  const [selectedPayoutIds, setSelectedPayoutIds] = useState([]);
  const [payoutFilter, setPayoutFilter] = useState("All");
  const [payoutStatusOverrides, setPayoutStatusOverrides] = useState({});

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!data.length) {
      return;
    }

    setTransactions((current) => {
      if (current.length) {
        return current;
      }

      return data.map((row, index) => ({
        ...row,
        status: row.status === "Success" ? "Paid" : row.status,
        sellerName: ["Green Harvest Co-op", "Aba Farms", "Savanna Livestock", "FreshRoots Ltd"][index % 4],
        sellerId: `SLR-${130 + (index % 12)}`,
        isManualPayment: false,
      }));
    });
  }, [data]);

  const normalizedTransactions = useMemo(
    () =>
      transactions.map((tx) => ({
        ...tx,
        status: tx.status === "Success" ? "Paid" : tx.status,
      })),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const windowMs = dateFilter === "day" ? dayMs : dateFilter === "week" ? 7 * dayMs : dateFilter === "month" ? 30 * dayMs : Infinity;
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedTransactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      const inWindow = !Number.isFinite(txTime) || now - txTime <= windowMs;
      const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
      const matchesMethod = methodFilter === "All" || tx.paymentMethod === methodFilter;
      const matchesQuery =
        !normalizedQuery ||
        tx.id.toLowerCase().includes(normalizedQuery) ||
        tx.orderNumber.toLowerCase().includes(normalizedQuery) ||
        tx.customerName.toLowerCase().includes(normalizedQuery) ||
        tx.sellerName.toLowerCase().includes(normalizedQuery);
      return inWindow && matchesStatus && matchesMethod && matchesQuery;
    });
  }, [normalizedTransactions, query, statusFilter, methodFilter, dateFilter]);

  const paymentStatuses = useMemo(() => {
    const result = { Paid: 0, Pending: 0, Failed: 0, Refunded: 0 };
    normalizedTransactions.forEach((tx) => {
      if (Object.prototype.hasOwnProperty.call(result, tx.status)) {
        result[tx.status] += 1;
      }
    });
    return result;
  }, [normalizedTransactions]);

  const payoutRows = useMemo(
    () =>
      normalizedTransactions
        .filter((tx) => tx.status === "Paid")
        .map((tx) => {
          const commission = Number(((tx.amount * commissionRate) / 100).toFixed(2));
          const payoutAmount = Number((tx.amount - commission).toFixed(2));
          const seed = Number(String(tx.id).replace(/\D/g, "")) || 0;
          const defaultStatus = seed % 7 === 0 ? "Failed" : seed % 3 === 0 ? "Processed" : "Pending";
          const id = `PAYOUT-${tx.id}`;

          return {
            id,
            orderNumber: tx.orderNumber,
            sellerName: tx.sellerName,
            sellerId: tx.sellerId,
            grossAmount: tx.amount,
            commission,
            payoutAmount,
            status: payoutStatusOverrides[id] || defaultStatus,
            createdAt: tx.date,
          };
        }),
    [normalizedTransactions, commissionRate, payoutStatusOverrides]
  );

  const filteredPayouts = useMemo(
    () => payoutRows.filter((row) => payoutFilter === "All" || row.status === payoutFilter),
    [payoutRows, payoutFilter]
  );

  const payoutTotals = useMemo(() => {
    const totals = { Pending: 0, Processed: 0, Failed: 0 };
    payoutRows.forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(totals, row.status)) {
        totals[row.status] += row.payoutAmount;
      }
    });
    return totals;
  }, [payoutRows]);

  const markCashPaymentReceived = (transactionId) => {
    setTransactions((current) =>
      current.map((tx) => {
        if (tx.id !== transactionId || tx.paymentMethod !== "Cash on Delivery") {
          return tx;
        }

        return {
          ...tx,
          status: "Paid",
          isManualPayment: true,
          date: new Date().toISOString(),
        };
      })
    );
  };

  const togglePayoutSelection = (payoutId) => {
    setSelectedPayoutIds((current) =>
      current.includes(payoutId) ? current.filter((id) => id !== payoutId) : [...current, payoutId]
    );
  };

  const initiateSinglePayout = async (payoutId) => {
    try {
      await api.post("/finance/payouts/initiate", { payoutId });
      setPayoutStatusOverrides((current) => ({
        ...current,
        [payoutId]: "Processed",
      }));
    } catch (_err) {
      setPayoutStatusOverrides((current) => ({
        ...current,
        [payoutId]: "Failed",
      }));
    }
  };

  const initiateBulkPayout = async () => {
    if (!selectedPayoutIds.length) {
      return;
    }

    try {
      await api.post("/finance/payouts/bulk-initiate", { payoutIds: selectedPayoutIds });
      setPayoutStatusOverrides((current) => {
        const next = { ...current };
        selectedPayoutIds.forEach((id) => {
          next[id] = "Processed";
        });
        return next;
      });
    } catch (_err) {
      setPayoutStatusOverrides((current) => {
        const next = { ...current };
        selectedPayoutIds.forEach((id) => {
          next[id] = "Failed";
        });
        return next;
      });
    }

    setSelectedPayoutIds([]);
    setPayoutFilter("Processed");
  };

  const saveCommissionRate = async () => {
    const parsed = Number(commissionDraft);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setCommissionMessage("Commission must be a number between 0 and 100.");
      return;
    }

    try {
      await api.put("/settings/finance", { platformCommissionRate: parsed });
    } catch (_err) {
      // Persist locally as fallback.
    }

    setCommissionRate(parsed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fd_commission_rate", String(parsed));
    }
    setCommissionMessage(`Platform commission updated to ${parsed.toFixed(2)}%.`);
  };

  const revenue = Array.from({ length: 30 }, (_, index) => ({ day: `Day ${index + 1}`, revenue: 7000 + index * 180 }));
  const paymentSplitData = [
    { name: "Paid", value: paymentStatuses.Paid },
    { name: "Pending", value: paymentStatuses.Pending },
    { name: "Failed", value: paymentStatuses.Failed },
    { name: "Refunded", value: paymentStatuses.Refunded },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="fd-grid-3">
        <div className="fd-card"><div className="fd-label">Today's Revenue</div><div className="fd-stat-value">{formatCurrency(filteredTransactions.reduce((sum, item) => sum + item.amount, 0))}</div></div>
        <div className="fd-card"><div className="fd-label">Paid Orders</div><div className="fd-stat-value">{paymentStatuses.Paid}</div></div>
        <div className="fd-card"><div className="fd-label">Pending Payments</div><div className="fd-stat-value">{paymentStatuses.Pending}</div></div>
        <div className="fd-card"><div className="fd-label">Failed Payments</div><div className="fd-stat-value">{paymentStatuses.Failed}</div></div>
        <div className="fd-card"><div className="fd-label">Refunded Orders</div><div className="fd-stat-value">{paymentStatuses.Refunded}</div></div>
        <div className="fd-card"><div className="fd-label">Commission Rate</div><div className="fd-stat-value">{commissionRate.toFixed(2)}%</div></div>
      </div>

      <div className="fd-grid-2">
        <ChartCard title="Daily Revenue" subtitle="Past 30 days"><ResponsiveContainer width="100%" height={300}><BarChart data={revenue}><XAxis dataKey="day" hide /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="revenue" fill="#3B6D11" /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Payment Status Mix" subtitle="Paid, Pending, Failed, Refunded"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={paymentSplitData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105}>{paymentSplitData.map((item, index) => <Cell key={item.name} fill={["#3B6D11", "#854F0B", "#dc2626", "#2563eb"][index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
      </div>

      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-title" style={{ fontSize: 24 }}>Transaction History</div>
        <div className="fd-grid-4">
          <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Transaction, order, customer, seller" />
          <label style={{ display: "grid", gap: 6 }}><span className="fd-label" style={{ textTransform: "none" }}>Payment Status</span><select className="fd-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option></select></label>
          <label style={{ display: "grid", gap: 6 }}><span className="fd-label" style={{ textTransform: "none" }}>Payment Method</span><select className="fd-input" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}><option>All</option>{Array.from(new Set(normalizedTransactions.map((item) => item.paymentMethod))).map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label style={{ display: "grid", gap: 6 }}><span className="fd-label" style={{ textTransform: "none" }}>Date Window</span><select className="fd-input" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">All time</option><option value="day">Last 24 hours</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></label>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="fd-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.orderNumber}</td>
                  <td>{row.customerName}</td>
                  <td>{row.sellerName}</td>
                  <td>{formatCurrency(row.amount)}</td>
                  <td>{row.paymentMethod}</td>
                  <td>
                    <Badge tone={row.status === "Paid" ? "success" : row.status === "Pending" ? "warning" : row.status === "Refunded" ? "info" : "danger"}>
                      {row.status}
                    </Badge>
                  </td>
                  <td>{formatDate(row.date)}</td>
                  <td>
                    {row.paymentMethod === "Cash on Delivery" && row.status !== "Paid" ? (
                      <Button size="sm" onClick={() => markCashPaymentReceived(row.id)}>Mark Received</Button>
                    ) : row.isManualPayment ? (
                      <Badge tone="success">Manually Confirmed</Badge>
                    ) : (
                      <span style={{ color: "var(--fd-muted)", fontSize: 13 }}>No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-title" style={{ fontSize: 24 }}>Seller Payouts</div>
        <div className="fd-grid-4">
          <div className="fd-card"><div className="fd-label">Pending Payouts</div><div className="fd-stat-value">{formatCurrency(payoutTotals.Pending)}</div></div>
          <div className="fd-card"><div className="fd-label">Processed Payouts</div><div className="fd-stat-value">{formatCurrency(payoutTotals.Processed)}</div></div>
          <div className="fd-card"><div className="fd-label">Failed Payouts</div><div className="fd-stat-value">{formatCurrency(payoutTotals.Failed)}</div></div>
          <label style={{ display: "grid", gap: 6 }}><span className="fd-label" style={{ textTransform: "none" }}>View Status</span><select className="fd-input" value={payoutFilter} onChange={(event) => setPayoutFilter(event.target.value)}><option>All</option><option>Pending</option><option>Processed</option><option>Failed</option></select></label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ color: "var(--fd-muted)" }}>{selectedPayoutIds.length} payout(s) selected for bulk action</div>
          <Button onClick={initiateBulkPayout} disabled={!selectedPayoutIds.length}>Initiate Selected Payouts</Button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="fd-table">
            <thead>
              <tr>
                <th></th>
                <th>Payout ID</th>
                <th>Order</th>
                <th>Seller</th>
                <th>Gross</th>
                <th>Commission</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((row) => (
                <tr key={row.id}>
                  <td><input type="checkbox" checked={selectedPayoutIds.includes(row.id)} onChange={() => togglePayoutSelection(row.id)} /></td>
                  <td>{row.id}</td>
                  <td>{row.orderNumber}</td>
                  <td>{row.sellerName}</td>
                  <td>{formatCurrency(row.grossAmount)}</td>
                  <td>{formatCurrency(row.commission)}</td>
                  <td>{formatCurrency(row.payoutAmount)}</td>
                  <td><Badge tone={row.status === "Processed" ? "success" : row.status === "Pending" ? "warning" : "danger"}>{row.status}</Badge></td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => initiateSinglePayout(row.id)} disabled={row.status === "Processed"}>
                      {row.status === "Processed" ? "Processed" : "Initiate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-title" style={{ fontSize: 24 }}>Platform Commission</div>
        <div className="fd-grid-3" style={{ alignItems: "end" }}>
          <Input label="Commission Rate (%)" type="number" min="0" max="100" step="0.1" value={commissionDraft} onChange={(event) => setCommissionDraft(event.target.value)} />
          <div style={{ color: "var(--fd-muted)" }}>Current rate: <strong>{commissionRate.toFixed(2)}%</strong></div>
          <Button onClick={saveCommissionRate}>Update Commission</Button>
        </div>
        {commissionMessage && <div style={{ color: commissionMessage.includes("updated") ? "var(--fd-success)" : "var(--fd-danger)" }}>{commissionMessage}</div>}
      </div>

      {/* ── Ghanaian Tax Obligations ── */}
      <GhanaTaxPanel revenue={filteredTransactions.reduce((s, t) => s + t.amount, 0)} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Ghana Tax Panel – separate component so it
   doesn't bloat the main function's state.
───────────────────────────────────────────── */
const GH_TAXES = [
  {
    code: "VAT",
    name: "Value Added Tax",
    rate: 0.15,
    basis: "taxable_revenue",
    authority: "GRA",
    filingCycle: "Monthly",
    filingDeadline: "Last day of the following month",
    description: "Standard rate of 15% on taxable supplies of goods and services in Ghana.",
    color: "#1d4ed8",
  },
  {
    code: "NHIL",
    name: "National Health Insurance Levy",
    rate: 0.025,
    basis: "taxable_revenue",
    authority: "GRA / NHIA",
    filingCycle: "Monthly",
    filingDeadline: "Last day of the following month",
    description: "2.5% levy charged on taxable supplies; remitted alongside VAT to GRA.",
    color: "#0f766e",
  },
  {
    code: "GETFund",
    name: "Ghana Education Trust Fund Levy",
    rate: 0.025,
    basis: "taxable_revenue",
    authority: "GRA",
    filingCycle: "Monthly",
    filingDeadline: "Last day of the following month",
    description: "2.5% levy on taxable supplies used to fund education.",
    color: "#7c3aed",
  },
  {
    code: "COVID-19",
    name: "COVID-19 Health Recovery Levy",
    rate: 0.01,
    basis: "taxable_revenue",
    authority: "GRA",
    filingCycle: "Monthly",
    filingDeadline: "Last day of the following month",
    description: "1% levy introduced in 2021 on taxable goods and services to fund COVID-19 recovery.",
    color: "#b45309",
  },
  {
    code: "CIT",
    name: "Corporate Income Tax",
    rate: 0.25,
    basis: "profit",
    authority: "GRA",
    filingCycle: "Quarterly installments; annual return",
    filingDeadline: "4 months after financial year-end",
    description: "25% tax on assessable profit. Estimated quarterly installments (quarterly). Agribusiness may qualify for 1% rate.",
    color: "#be123c",
  },
  {
    code: "WHT",
    name: "Withholding Tax (Suppliers)",
    rate: 0.05,
    basis: "payouts",
    authority: "GRA",
    filingCycle: "Monthly",
    filingDeadline: "15th of the following month",
    description: "5% withheld from payments to resident suppliers/farmers and remitted to GRA.",
    color: "#0369a1",
  },
];

function GhanaTaxPanel({ revenue }) {
  const profit = revenue * 0.22; // ~22 % assumed net margin for CIT basis display
  const payouts = revenue * 0.78; // approx seller payout pool for WHT basis

  const basisMap = { taxable_revenue: revenue, profit, payouts };

  const totalIndirect = GH_TAXES
    .filter((t) => ["VAT", "NHIL", "GETFund", "COVID-19"].includes(t.code))
    .reduce((s, t) => s + revenue * t.rate, 0);

  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fd-card" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="fd-label">Ghana Revenue Authority (GRA)</div>
          <div className="fd-title" style={{ fontSize: 24 }}>Tax Obligations</div>
          <div style={{ fontSize: 13, color: "var(--fd-muted)", marginTop: 2 }}>
            Computed on current filtered revenue. Consult your tax advisor for final filings.
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div className="fd-label">Est. Indirect Taxes Due</div>
          <div className="fd-stat-value" style={{ color: "#1d4ed8" }}>
            {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(totalIndirect)}
          </div>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="fd-grid-4">
        {[
          { label: "VAT (15%)", value: revenue * 0.15, color: "#1d4ed8" },
          { label: "NHIL (2.5%)", value: revenue * 0.025, color: "#0f766e" },
          { label: "GETFund (2.5%)", value: revenue * 0.025, color: "#7c3aed" },
          { label: "COVID-19 Levy (1%)", value: revenue * 0.01, color: "#b45309" },
        ].map(({ label, value, color }) => (
          <div key={label} className="fd-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="fd-label">{label}</div>
            <div className="fd-stat-value" style={{ color }}>
              {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div style={{ overflowX: "auto" }}>
        <table className="fd-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Tax / Levy</th>
              <th>Rate</th>
              <th>Basis</th>
              <th>Est. Amount (GHS)</th>
              <th>Authority</th>
              <th>Filing Cycle</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {GH_TAXES.map((tax) => {
              const base = basisMap[tax.basis] ?? 0;
              const amount = base * tax.rate;
              const isOpen = expanded === tax.code;
              return (
                <>
                  <tr
                    key={tax.code}
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(isOpen ? null : tax.code)}
                  >
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: tax.color + "22",
                          color: tax.color,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {tax.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{tax.name}</td>
                    <td>{(tax.rate * 100).toFixed(1)}%</td>
                    <td style={{ textTransform: "capitalize", color: "var(--fd-muted)", fontSize: 12 }}>
                      {tax.basis.replace("_", " ")}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount)}
                    </td>
                    <td style={{ fontSize: 12 }}>{tax.authority}</td>
                    <td style={{ fontSize: 12 }}>{tax.filingCycle}</td>
                    <td style={{ fontSize: 12, color: "var(--fd-muted)" }}>{tax.filingDeadline}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          background: tax.code === "CIT" ? "#fef3c7" : "#dcfce7",
                          color: tax.code === "CIT" ? "#92400e" : "#166534",
                          fontWeight: 600,
                        }}
                      >
                        {tax.code === "CIT" ? "Quarterly" : "Monthly"}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${tax.code}-desc`}>
                      <td colSpan={9} style={{ background: tax.color + "0d", padding: "10px 16px", fontSize: 13, color: "var(--fd-muted)" }}>
                        ℹ️ {tax.description}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: "var(--fd-muted)", padding: "4px 0" }}>
        * VAT, NHIL, GETFund and COVID-19 Levy are charged on taxable revenue (standard-rated supplies).
        CIT is estimated on a 22% net margin assumption. WHT is deducted from seller payouts before remittance.
        All figures are estimates — actual filings may differ.
      </div>
    </div>
  );
}
