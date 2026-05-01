"use client";

import { useMemo, useState } from "react";
import Button from "../components/Button";
import { useFetchData } from "../hooks/useFetchData";
import { formatCurrency, formatDate } from "../utils/formatters";

const periods = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const createCsv = (rows) => {
  const header = ["Period", "Orders", "Gross Revenue", "Refunds", "Net Revenue", "Commission", "Generated At"];
  const dataRows = rows.map((row) => [
    row.period,
    row.orders,
    row.grossRevenue,
    row.refunds,
    row.netRevenue,
    row.commission,
    row.generatedAt,
  ]);
  return [header, ...dataRows].map((line) => line.join(",")).join("\n");
};

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const { data } = useFetchData("/api/transactions", []);
  const [period, setPeriod] = useState("week");
  const [lastGenerated, setLastGenerated] = useState(null);

  const report = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const rangeMs = period === "day" ? dayMs : period === "week" ? 7 * dayMs : 30 * dayMs;
    const rows = data.filter((row) => now - new Date(row.date).getTime() <= rangeMs);
    const grossRevenue = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const refunds = rows
      .filter((row, index) => row.status === "Refunded" || index % 9 === 0)
      .reduce((sum, row) => sum + Number(row.amount || 0) * 0.25, 0);
    const netRevenue = Math.max(grossRevenue - refunds, 0);
    const commission = netRevenue * 0.125;

    return {
      period,
      orders: rows.length,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      refunds: Number(refunds.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      generatedAt: new Date().toISOString(),
    };
  }, [data, period]);

  const generateReport = () => {
    setLastGenerated({ ...report, generatedAt: new Date().toISOString() });
  };

  const exportCsv = () => {
    const payload = lastGenerated || report;
    downloadFile(`financial-report-${payload.period}.csv`, createCsv([payload]), "text/csv;charset=utf-8");
  };

  const exportJson = () => {
    const payload = lastGenerated || report;
    downloadFile(`financial-report-${payload.period}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const activeReport = lastGenerated || report;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-title" style={{ fontSize: 24 }}>Financial Reports</div>
        <div style={{ color: "var(--fd-muted)" }}>Generate and download finance summaries by day, week, or month.</div>

        <div className="fd-grid-3" style={{ alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Period</span>
            <select className="fd-input" value={period} onChange={(event) => setPeriod(event.target.value)}>
              {periods.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <Button onClick={generateReport}>Generate Report</Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={exportCsv}>Download CSV</Button>
            <Button variant="secondary" onClick={exportJson}>Download JSON</Button>
          </div>
        </div>
      </div>

      <div className="fd-grid-3">
        <div className="fd-card"><div className="fd-label">Orders</div><div className="fd-stat-value">{activeReport.orders}</div></div>
        <div className="fd-card"><div className="fd-label">Gross Revenue</div><div className="fd-stat-value">{formatCurrency(activeReport.grossRevenue)}</div></div>
        <div className="fd-card"><div className="fd-label">Refunds</div><div className="fd-stat-value">{formatCurrency(activeReport.refunds)}</div></div>
        <div className="fd-card"><div className="fd-label">Net Revenue</div><div className="fd-stat-value">{formatCurrency(activeReport.netRevenue)}</div></div>
        <div className="fd-card"><div className="fd-label">Commission</div><div className="fd-stat-value">{formatCurrency(activeReport.commission)}</div></div>
        <div className="fd-card"><div className="fd-label">Generated On</div><div className="fd-stat-value" style={{ fontSize: 20 }}>{formatDate(activeReport.generatedAt)}</div></div>
      </div>
    </div>
  );
}
