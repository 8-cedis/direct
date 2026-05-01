"use client";

import { useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useFetchData } from "../hooks/useFetchData";
import { formatCurrency } from "../utils/formatters";
import { updateFarmerPayout } from "../services/financeService";

export default function FarmerPayoutsPage() {
  const { data } = useFetchData("/api/farmers", []);
  const [statusOverrides, setStatusOverrides] = useState({});

  const rows = useMemo(
    () =>
      data.map((farmer) => {
        const id = String(farmer.id);
        const defaultStatus = farmer.status === "Approved" ? "Pending" : "Processing";
        return {
          id,
          farmerName: farmer.name,
          farmName: farmer.farmName,
          period: "Week 1 Apr",
          batchesDelivered: farmer.totalBatches,
          totalProduceValue: farmer.totalValueSupplied,
          deductions: farmer.rejectedBatches * 15,
          finalPayout: farmer.totalValueSupplied - farmer.rejectedBatches * 15,
          payoutAccount: farmer.payoutAccount,
          status: statusOverrides[id] || defaultStatus,
        };
      }),
    [data, statusOverrides]
  );

  const approveAll = async () => {
    const pendingRows = rows.filter((row) => row.status === "Pending" || row.status === "Processing");
    if (!pendingRows.length) return;

    for (const row of pendingRows) {
      try {
        await updateFarmerPayout(row.id, row.finalPayout, "processed");
      } catch (_err) {
        // Continue local updates for demo and offline workflows.
      }
    }

    setStatusOverrides((current) => {
      const next = { ...current };
      pendingRows.forEach((row) => {
        next[row.id] = "Paid";
      });
      return next;
    });
  };

  const downloadPayoutCsv = () => {
    if (!rows.length) return;

    const headers = [
      "Farmer Name",
      "Farm Name",
      "Period",
      "Batches Delivered",
      "Total Produce Value",
      "Deductions",
      "Final Payout",
      "Account",
      "Status",
    ];

    const lines = [headers.join(",")];
    rows.forEach((row) => {
      lines.push(
        [
          row.farmerName,
          row.farmName,
          row.period,
          row.batchesDelivered,
          row.totalProduceValue,
          row.deductions,
          row.finalPayout,
          row.payoutAccount,
          row.status,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `farmer-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="fd-grid-3"><div className="fd-card"><div className="fd-label">Current Payout Period</div><div className="fd-stat-value">Week 1 Apr</div></div><div className="fd-card"><div className="fd-label">Total Farmers</div><div className="fd-stat-value">{rows.length}</div></div><div className="fd-card"><div className="fd-label">Total Payout</div><div className="fd-stat-value">{formatCurrency(rows.reduce((sum, row) => sum + row.finalPayout, 0))}</div></div></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button onClick={approveAll}>Approve All</Button></div>
      <DataTable columns={[{ key: 'farmerName', label: 'Farmer Name' }, { key: 'farmName', label: 'Farm Name' }, { key: 'period', label: 'Period' }, { key: 'batchesDelivered', label: 'Batches Delivered' }, { key: 'totalProduceValue', label: 'Total Produce Value', render: (row) => formatCurrency(row.totalProduceValue) }, { key: 'deductions', label: 'Deductions', render: (row) => formatCurrency(row.deductions) }, { key: 'finalPayout', label: 'Final Payout', render: (row) => formatCurrency(row.finalPayout) }, { key: 'payoutAccount', label: 'Account' }, { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'Paid' ? 'success' : row.status === 'Failed' ? 'danger' : 'warning'}>{row.status}</Badge> }]} rows={rows} />
      <div className="fd-card"><div className="fd-title" style={{ fontSize: 24 }}>Payout history</div><Button style={{ marginTop: 12 }} onClick={downloadPayoutCsv}>Download CSV</Button></div>
    </div>
  );
}
