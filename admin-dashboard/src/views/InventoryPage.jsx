"use client";

import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Input from "../components/Input";
import Modal from "../components/Modal";
import { useProductsRealtime } from "../hooks/useRealtimeData";
import { updateProductStock, getInventorySummary } from "../services/productsService";
import { formatCurrency } from "../utils/formatters";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function InventoryPage() {
  const { products, loading, error } = useProductsRealtime();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustType, setAdjustType] = useState("add");

  const summary = useMemo(() => getInventorySummary(products), [products]);

  const rows = useMemo(() => {
    return products.map((item) => {
      const reorderPoint = toNumber(item.reorderPoint, 10);
      const stock = toNumber(item.stock, 0);
      const reserved = Math.min(10, stock);

      return {
        ...item,
        reorderPoint,
        reserved,
        freeToSell: Math.max(0, stock - reserved),
      };
    });
  }, [products]);

  const applyAdjustment = async () => {
    const product = products.find((item) => String(item.id) === selectedProduct);
    if (!product) return;

    const qty = Math.abs(toNumber(adjustQuantity));
    const current = toNumber(product.stock, 0);
    const next = adjustType === "subtract" ? Math.max(0, current - qty) : current + qty;

    await updateProductStock(product.id, next);
    setAdjustOpen(false);
    setSelectedProduct("");
    setAdjustQuantity("");
    setAdjustType("add");
  };

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (row) => `${row.emoji || "🥬"} ${row.name}`,
    },
    { key: "category", label: "Category" },
    { key: "stock", label: "In Stock" },
    { key: "reserved", label: "Reserved" },
    { key: "freeToSell", label: "Free to Sell" },
    { key: "reorderPoint", label: "Reorder Point" },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const stock = toNumber(row.stock, 0);
        if (stock === 0) return <Badge tone="danger">Out of stock</Badge>;
        if (stock <= row.reorderPoint) return <Badge tone="warning">Low stock</Badge>;
        return <Badge tone="success">Healthy</Badge>;
      },
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="fd-grid-4">
        <article className="fd-card"><div className="fd-label">Total Products</div><div className="fd-stat-value">{summary.totalProducts}</div></article>
        <article className="fd-card"><div className="fd-label">Low Stock</div><div className="fd-stat-value" style={{ color: "var(--fd-warning)" }}>{summary.lowStockCount}</div></article>
        <article className="fd-card"><div className="fd-label">Out of Stock</div><div className="fd-stat-value" style={{ color: "var(--fd-danger)" }}>{summary.outOfStockCount}</div></article>
        <article className="fd-card"><div className="fd-label">Inventory Value</div><div className="fd-stat-value">{formatCurrency(summary.totalInventoryValue)}</div></article>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={() => setAdjustOpen(true)}>Adjust Stock</Button>
      </div>

      {error && <div className="fd-card" style={{ color: "var(--fd-danger)" }}>{error}</div>}
      {loading ? <div className="fd-card">Loading inventory...</div> : <DataTable columns={columns} rows={rows} />}

      <Modal open={adjustOpen} title="Manual Stock Adjustment" onClose={() => setAdjustOpen(false)}>
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Product</span>
            <select className="fd-select" value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={String(product.id)}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Adjustment type</span>
            <select className="fd-select" value={adjustType} onChange={(event) => setAdjustType(event.target.value)}>
              <option value="add">Add stock</option>
              <option value="subtract">Reduce stock</option>
            </select>
          </label>

          <Input
            label="Quantity"
            type="number"
            min="0"
            value={adjustQuantity}
            onChange={(event) => setAdjustQuantity(event.target.value)}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={applyAdjustment} disabled={!selectedProduct || !adjustQuantity}>Apply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
