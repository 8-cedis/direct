"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "../components/Input";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import SlideOver from "../components/SlideOver";
import Tabs from "../components/Tabs";
import Button from "../components/Button";
import { formatCurrency, formatDate } from "../utils/formatters";
import { fetchCustomers, updateCustomer } from "../services/customersService";

export default function CustomersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [panelTab, setPanelTab] = useState("Profile");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteMessage, setNoteMessage] = useState("");

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchCustomers(1000);
      setData(result.customers || []);
    } catch (err) {
      setError(err?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => data.filter((customer) => {
    const matchesSearch = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tier === "All" || customer.loyaltyTier === tier;
    const matchesStatus = status === "All" || customer.status === status;
    return matchesSearch && matchesTier && matchesStatus;
  }), [data, search, tier, status]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "memberSince", label: "Member Since", render: (row) => formatDate(row.memberSince) },
    { key: "totalOrders", label: "Total Orders" },
    { key: "totalSpent", label: "Total Spent", render: (row) => formatCurrency(row.totalSpent) },
    { key: "loyaltyTier", label: "Loyalty Tier", render: (row) => <Badge tone={row.loyaltyTier === "Platinum" ? "platinum" : row.loyaltyTier === "Gold" ? "earth" : row.loyaltyTier === "Silver" ? "neutral" : "neutral"}>{row.loyaltyTier}</Badge> },
    { key: "status", label: "Status", render: (row) => <Badge tone={row.status === "Active" ? "success" : "danger"}>{row.status}</Badge> },
  ];

  const saveCustomerNote = async () => {
    if (!selected) return;

    const note = noteDraft.trim();
    if (!note) {
      setNoteMessage("Please enter a note before saving.");
      return;
    }

    try {
      await updateCustomer(selected.id, {
        notes: [...(selected.notes || []), { note, createdAt: new Date().toISOString() }],
      });
    } catch (err) {
      setNoteMessage(err?.message || "Failed to save note.");
      return;
    }

    setData((current) =>
      current.map((customer) =>
        customer.id === selected.id
          ? {
              ...customer,
              notes: [...(customer.notes || []), { note, createdAt: new Date().toISOString() }],
            }
          : customer
      )
    );

    setSelected((current) =>
      current
        ? {
            ...current,
            notes: [...(current.notes || []), { note, createdAt: new Date().toISOString() }],
          }
        : current
    );
    setNoteDraft("");
    setNoteMessage("Note saved.");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-grid-3" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
          <Input placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="fd-select" value={tier} onChange={(e) => setTier(e.target.value)}>
            {['All','Regular','Silver','Gold','Platinum'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select className="fd-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['All','Active','Inactive'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="fd-label" style={{ textTransform: "none" }}>Total customers: {filtered.length}</div>
      </div>
      {error && <div className="fd-card" style={{ color: "var(--fd-danger)" }}>{error}</div>}
      {loading ? <div className="fd-card">Loading customers...</div> : <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />}
      <SlideOver open={Boolean(selected)} title={selected?.name || "Customer profile"} onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: "grid", gap: 14 }}>
            <Tabs tabs={["Profile", "Orders", "Loyalty", "Tickets", "Notes"]} active={panelTab} onChange={setPanelTab} />
            {panelTab === "Profile" && <div className="fd-card" style={{ padding: 12 }}><div>{selected.name}</div><div>{selected.email}</div><div>{selected.phone}</div><div>{selected.address}</div></div>}
            {panelTab === "Orders" && <div>{selected.totalOrders} orders</div>}
            {panelTab === "Loyalty" && <div>{selected.loyaltyPoints} points</div>}
            {panelTab === "Tickets" && <div>No open tickets</div>}
            {panelTab === "Notes" && <div style={{ display: "grid", gap: 10 }}><textarea className="fd-textarea" rows={4} placeholder="Add a note" style={{ padding: 12 }} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} /><div style={{ display: "flex", justifyContent: "flex-end" }}><Button onClick={saveCustomerNote}>Save Note</Button></div>{noteMessage && <div style={{ color: noteMessage.includes("saved") ? "var(--fd-success)" : "var(--fd-danger)" }}>{noteMessage}</div>}{Array.isArray(selected.notes) && selected.notes.length > 0 && <div className="fd-card" style={{ padding: 12 }}><div className="fd-label" style={{ textTransform: "none" }}>Saved notes</div>{selected.notes.map((item, index) => <div key={`${item.createdAt || index}-${index}`} style={{ marginTop: 8 }}>{item.note}</div>)}</div>}</div>}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
