"use client";

import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Input from "../components/Input";
import Modal from "../components/Modal";
import { useProductsRealtime } from "../hooks/useRealtimeData";
import {
  createProduct,
  updateProduct,
  updateProductStock,
  getInventorySummary,
  uploadProductCoverImage,
} from "../services/productsService";
import { formatCurrency } from "../utils/formatters";

const FILTERS = ["all", "vegetables", "fruits", "grains", "active", "inactive"];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const initialForm = {
  name: "",
  category: "vegetables",
  price: "",
  stock: "",
  unit: "kg",
  status: "active",
  description: "",
  emoji: "🥬",
  image: "",
};

export default function ProductsPage() {
  const { products, loading, error } = useProductsRealtime();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [stockDrafts, setStockDrafts] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const haystack = `${product.name || ""} ${product.category || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const productStatus = String(product.status || "inactive").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();

      if (filter === "all") return matchesSearch;
      if (filter === "active" || filter === "inactive") {
        return matchesSearch && productStatus === filter;
      }

      return matchesSearch && productCategory === filter;
    });
  }, [products, search, filter]);

  const summary = useMemo(() => getInventorySummary(products), [products]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || "vegetables",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      unit: product.unit || "kg",
      status: product.status || "active",
      description: product.description || "",
      emoji: product.emoji || "🥬",
      image: product.image || "", // Preserve existing image URL
    });
    setImagePreview(product.image || "");
    setImageFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const onFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitProduct = async () => {
    if (!form.name.trim()) return;
    setFormError("");

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: toNumber(form.price),
      stock: toNumber(form.stock),
      unit: form.unit || "kg",
      status: form.status,
      description: form.description,
      emoji: form.emoji || "🥬",
      image: form.image || "",
      imageFile,
    };

    setSaving(true);
    try {
      if (editingProduct?.id) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(initialForm);
      setImageFile(null);
      setImagePreview("");
      setFormError("");
    } catch (error) {
      setFormError(error?.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const onToggleStatus = async (product) => {
    const nextStatus = String(product.status || "active").toLowerCase() === "active" ? "inactive" : "active";
    await updateProduct(product.id, { status: nextStatus });
  };

  const onSaveStock = async (product) => {
    const nextValue = stockDrafts[product.id];
    const stock = toNumber(nextValue, product.stock || 0);
    await updateProductStock(product.id, stock);
    setStockDrafts((prev) => {
      const copy = { ...prev };
      delete copy[product.id];
      return copy;
    });
  };

  const onImageSelect = async (file) => {
    setImageFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div style={{ display: "grid", gap: 4 }}>
          <strong>{row.emoji || "🥬"} {row.name}</strong>
          <span style={{ color: "var(--fd-muted)", fontSize: 12 }}>{row.category} • {row.unit || "kg"}</span>
        </div>
      ),
    },
    {
      key: "image",
      label: "Image",
      render: (row) => (
        row.image ? (
          <img src={row.image} alt={row.name} style={{ width: 56, height: 44, objectFit: "cover", borderRadius: 10, border: "1px solid var(--fd-border)" }} />
        ) : (
          <Badge tone="neutral">No image</Badge>
        )
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (row) => formatCurrency(toNumber(row.price)),
    },
    {
      key: "stock",
      label: "Stock",
      render: (row) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 180 }}>
          <input
            type="number"
            className="fd-input"
            style={{ padding: "8px 10px", width: 88 }}
            value={stockDrafts[row.id] ?? row.stock ?? 0}
            onChange={(event) =>
              setStockDrafts((prev) => ({
                ...prev,
                [row.id]: event.target.value,
              }))
            }
          />
          <Button size="sm" onClick={(event) => {
            event.stopPropagation();
            onSaveStock(row);
          }}>
            Save
          </Button>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge tone={String(row.status).toLowerCase() === "active" ? "success" : "neutral"}>
          {row.status || "inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="sm" onClick={(event) => {
            event.stopPropagation();
            openEditModal(row);
          }}>
            Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={(event) => {
            event.stopPropagation();
            onToggleStatus(row);
          }}>
            Toggle
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="fd-products-hero">
        <div>
          <div className="fd-label" style={{ color: "#cde0b9" }}>Catalog Control</div>
          <h2 className="fd-title" style={{ margin: "6px 0", fontSize: 34, color: "#fff" }}>Products and Inventory</h2>
          <p style={{ margin: 0, color: "#dceccf", maxWidth: 680 }}>
            Add new products, update stock levels, and keep storefront listings synced in real time.
          </p>
        </div>
      </section>

      <section className="fd-grid-4">
        <article className="fd-card"><div className="fd-label">Total Products</div><div className="fd-stat-value">{summary.totalProducts}</div></article>
        <article className="fd-card"><div className="fd-label">Active Listings</div><div className="fd-stat-value">{summary.activeProducts}</div></article>
        <article className="fd-card"><div className="fd-label">Low Stock</div><div className="fd-stat-value" style={{ color: "var(--fd-warning)" }}>{summary.lowStockCount}</div></article>
        <article className="fd-card"><div className="fd-label">Inventory Value</div><div className="fd-stat-value">{formatCurrency(summary.totalInventoryValue)}</div></article>
      </section>

      <section className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input
            placeholder="Search by product name or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`fd-chip ${filter === value ? "fd-chip-active" : ""}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Button onClick={openCreateModal}>Add Product</Button>
          </div>
        </div>
      </section>

      {error && <div className="fd-card" style={{ color: "var(--fd-danger)" }}>{error}</div>}
      {loading ? <div className="fd-card">Loading products...</div> : <DataTable columns={columns} rows={filteredProducts} onRowClick={openEditModal} />}

      <Modal
        open={modalOpen}
        title={editingProduct ? `Edit ${editingProduct.name}` : "Add New Product"}
        onClose={() => setModalOpen(false)}
        width={760}
      >
        <div className="fd-grid-2">
          <Input label="Product Name" value={form.name} onChange={(event) => onFormChange("name", event.target.value)} />
          <Input label="Emoji" value={form.emoji} onChange={(event) => onFormChange("emoji", event.target.value)} />

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Category</span>
            <select className="fd-select" value={form.category} onChange={(event) => onFormChange("category", event.target.value)}>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Status</span>
            <select className="fd-select" value={form.status} onChange={(event) => onFormChange("status", event.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <Input label="Price" type="number" value={form.price} onChange={(event) => onFormChange("price", event.target.value)} />
          <Input label="Stock" type="number" value={form.stock} onChange={(event) => onFormChange("stock", event.target.value)} />
          <Input label="Unit" value={form.unit} onChange={(event) => onFormChange("unit", event.target.value)} />
          <div />

          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Product Image</span>
            <input
              type="file"
              accept="image/*"
              className="fd-input"
              style={{ padding: "10px 12px" }}
              onChange={(event) => onImageSelect(event.target.files?.[0] || null)}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Product preview"
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, border: "1px solid var(--fd-border)" }}
              />
            )}
          </label>

          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 6 }}>
            <span className="fd-label" style={{ textTransform: "none" }}>Description</span>
            <textarea
              className="fd-textarea"
              rows={4}
              style={{ padding: "12px 14px" }}
              value={form.description}
              onChange={(event) => onFormChange("description", event.target.value)}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          {formError && (
            <div style={{ marginRight: "auto", color: "var(--fd-danger)", fontWeight: 700 }}>
              {formError}
            </div>
          )}
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={submitProduct} disabled={saving}>{saving ? "Saving..." : "Save Product"}</Button>
        </div>
      </Modal>
    </div>
  );
}
