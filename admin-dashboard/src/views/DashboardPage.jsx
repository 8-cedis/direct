"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import { getDashboardAnalytics } from "../services/analyticsService";
import { formatCurrency, formatDate, formatTime } from "../utils/formatters";

const topProductsColumns = [
  { key: "rank", label: "Rank", width: 80 },
  { key: "name", label: "Product" },
  { key: "unitsSold", label: "Units Sold" },
  { key: "orderCount", label: "Orders" },
  { key: "revenue", label: "Revenue", render: (row) => formatCurrency(row.revenue) },
];

const RANGE_OPTIONS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const formatUptime = (uptimeSeconds = 0) => {
  const seconds = Math.max(0, Math.floor(Number(uptimeSeconds) || 0));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");

  const loadDashboard = useCallback(async (selectedRange = range) => {
    setLoading(true);
    setError("");

    try {
      const payload = await getDashboardAnalytics(selectedRange);
      setAnalytics(payload);
    } catch (err) {
      setError(err.message || "Failed to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadDashboard(range);
  }, [loadDashboard]);

  const openOrders = (query = "") => {
    router.push(`/admin/orders${query}`);
  };

  const openCrm = (query = "") => {
    router.push(`/admin/crm${query}`);
  };

  const platformHealth = analytics?.platformHealth || {};

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div className="fd-grid-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="fd-card" style={{ minHeight: 120 }} />
          ))}
        </div>
        <div className="fd-grid-2">
          <div className="fd-card" style={{ minHeight: 320 }} />
          <div className="fd-card" style={{ minHeight: 320 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="fd-label">Overview and analytics</div>
          <h2 className="fd-title" style={{ margin: 0, fontSize: 28 }}>Operations Intelligence</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="fd-select"
            value={range}
            onChange={(event) => {
              const nextRange = event.target.value;
              setRange(nextRange);
              loadDashboard(nextRange);
            }}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="fd-btn" onClick={() => loadDashboard(range)}>Refresh Data</button>
        </div>
      </div>

      {error && (
        <div className="fd-card" style={{ borderColor: "#fda29b", color: "#b42318" }}>
          Failed to load full analytics. {error}
        </div>
      )}

      <div className="fd-grid-4">
        {(analytics?.statCards || []).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="fd-grid-2">
        <ChartCard
          title="Daily Revenue"
          subtitle={`Past ${analytics?.rangeDays || 30} days`}
          actions={<button className="fd-btn" onClick={() => openOrders(`?range=${range}`)}>Open orders</button>}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analytics?.revenueSeries || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
              <YAxis tickFormatter={(value) => `GHS ${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(value) => formatDate(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#3B6D11" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Sales Breakdown"
          subtitle="Animals, Produce, Materials, Others"
          actions={<button className="fd-btn" onClick={() => openOrders(`?range=${range}&category=Produce`)}>Open orders</button>}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={analytics?.salesBreakdown || []} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110}>
                {(analytics?.salesBreakdown || []).map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    cursor="pointer"
                    onClick={() => openOrders(`?range=${range}&category=${encodeURIComponent(entry.name)}`)}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="fd-grid-2">
        <ChartCard
          title="Revenue Comparison"
          subtitle="Current vs previous period"
          actions={<button className="fd-btn" onClick={() => openOrders(`?range=${range}`)}>Drill into orders</button>}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.revenueComparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `GHS ${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="current" name="Current" fill="#3B6D11" radius={[8, 8, 0, 0]} onClick={() => openOrders(`?range=${range}`)} />
              <Bar dataKey="previous" name="Previous" fill="#98a2b3" radius={[8, 8, 0, 0]} onClick={() => openOrders(`?range=${range}`)} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform Health" subtitle="Live operational indicators">
          <div className="fd-grid-2" style={{ gap: 12 }}>
            <div className="fd-card">
              <div className="fd-label">Uptime</div>
              <div className="fd-stat-value">{formatUptime(platformHealth.uptimeSeconds)}</div>
            </div>
            <div className="fd-card">
              <div className="fd-label">Active sessions</div>
              <div className="fd-stat-value">{platformHealth.activeSessions || 0}</div>
            </div>
            <div className="fd-card">
              <div className="fd-label">Error rate</div>
              <div className="fd-stat-value">{Number(platformHealth.errorRate || 0).toFixed(2)}%</div>
            </div>
            <div className="fd-card">
              <div className="fd-label">Open incidents</div>
              <div className="fd-stat-value">{(platformHealth.unresolvedDisputes || 0) + (platformHealth.unresolvedComplaints || 0)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, color: "var(--fd-muted)", fontSize: 12 }}>
            Last checked {formatDate(platformHealth.checkedAt || new Date().toISOString())} at {formatTime(platformHealth.checkedAt || new Date().toISOString())}
          </div>
        </ChartCard>
      </div>

      <div className="fd-grid-2">
        <ChartCard title="Top 10 Best Selling Products" subtitle="By units sold" actions={<button className="fd-btn" onClick={() => openOrders(`?range=${range}`)}>See all orders</button>}>
          <DataTable
            columns={topProductsColumns}
            rows={analytics?.topProducts || []}
            emptyText="No sales data yet."
            onRowClick={(row) => openOrders(`?range=${range}&product=${encodeURIComponent(row.name)}`)}
          />
        </ChartCard>

        <ChartCard title="Top 10 Highest Earning Sellers" subtitle="By attributed product revenue" actions={<button className="fd-btn" onClick={() => openOrders(`?range=${range}`)}>Open orders</button>}>
          <div style={{ display: "grid", gap: 10 }}>
            {(analytics?.topSellers || []).length === 0 && <div className="fd-card">No seller earnings available yet.</div>}
            {(analytics?.topSellers || []).map((seller) => (
              <button
                key={seller.id}
                type="button"
                className="fd-card"
                onClick={() => openOrders(`?range=${range}&seller=${encodeURIComponent(seller.sellerName)}`)}
                style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", textAlign: "left" }}
              >
                <div>
                  <div className="fd-label">#{seller.rank}</div>
                  <div style={{ fontWeight: 700 }}>{seller.sellerName}</div>
                  <div style={{ color: "var(--fd-muted)", fontSize: 13 }}>{seller.unitsSold} units sold | {seller.listedProducts} products</div>
                </div>
                <Badge tone="success">{formatCurrency(seller.revenue)}</Badge>
              </button>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Activity Feed" subtitle="Last 10 system actions with timestamps">
        <div style={{ display: "grid", gap: 10 }}>
          {(analytics?.activityFeed || []).length === 0 && <div className="fd-card">No recent activity yet.</div>}
          {(analytics?.activityFeed || []).map((item) => (
            <button
              key={item.id}
              type="button"
              className="fd-card"
              onClick={() => {
                if (item.kind === "complaint") {
                  openCrm(item.entityId ? `?complaintId=${encodeURIComponent(String(item.entityId))}` : "");
                  return;
                }

                if (item.kind === "order") {
                  openOrders(`?range=${range}`);
                }
              }}
              style={{ display: "grid", gap: 8, textAlign: "left" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <strong>{item.action}</strong>
                <Badge tone={item.tone}>{formatDate(item.timestamp)} {formatTime(item.timestamp)}</Badge>
              </div>
              <div style={{ color: "var(--fd-muted)" }}>{item.detail}</div>
            </button>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
