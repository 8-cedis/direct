"use client";

import { useEffect, useMemo, useState } from "react";
import Input from "../components/Input";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import SlideOver from "../components/SlideOver";
import Tabs from "../components/Tabs";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { formatCurrency, formatDate } from "../utils/formatters";
import { createFarmer, fetchFarmers } from "../services/farmersService";

export default function FarmersPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("Profile");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({
    name: "",
    farmName: "",
    region: "Volta Region",
    phone: "",
    payoutAccount: "",
  });

  const loadFarmers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchFarmers(1000);
      setData(result.farmers || []);
    } catch (err) {
      setError(err?.message || "Failed to load farmers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const filtered = useMemo(() => data.filter((farmer) => {
    const matchesSearch = `${farmer.name} ${farmer.farmName}`.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = region === "All" || farmer.region === region;
    const matchesStatus = status === "All" || farmer.status === status;
    return matchesSearch && matchesRegion && matchesStatus;
  }), [data, search, region, status]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "farmName", label: "Farm Name" },
    { key: "region", label: "Region" },
    { key: "productsSupplied", label: "Products Supplied" },
    { key: "qualityScore", label: "Quality Score", render: (row) => `${"★".repeat(Math.round(row.qualityScore))} ${row.qualityScore.toFixed(1)}` },
    { key: "totalBatches", label: "Total Batches" },
    { key: "rejectedBatches", label: "Rejected Batches" },
    { key: "status", label: "Status", render: (row) => <Badge tone={row.status === "Approved" ? "success" : row.status === "Pending" ? "warning" : "danger"}>{row.status}</Badge> },
  ];

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addFarmer = async () => {
    const name = form.name.trim();
    const farmName = form.farmName.trim();

    if (!name || !farmName) {
      setAddError("Farmer name and farm name are required.");
      return;
    }

    const payload = {
      farmerCode: `FRM-${Date.now()}`,
      name,
      farmName,
      region: form.region,
      productsSupplied: 0,
      qualityScore: 5,
      totalBatches: 0,
      rejectedBatches: 0,
      status: "Pending",
      phone: form.phone.trim() || "-",
      payoutAccount: form.payoutAccount.trim() || "-",
      totalValueSupplied: 0,
      totalRejections: 0,
      batches: [],
      payouts: [],
    };

    try {
      const created = await createFarmer(payload);
      setData((current) => [created, ...current]);
    } catch (err) {
      setAddError(err?.message || "Failed to create farmer.");
      return;
    }

    setForm({ name: "", farmName: "", region: "Volta Region", phone: "", payoutAccount: "" });
    setOpenAddModal(false);
    setAddError("");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="fd-card" style={{ display: "grid", gap: 12 }}>
        <div className="fd-grid-3" style={{ gridTemplateColumns: "2fr 1fr 1fr auto" }}>
          <Input placeholder="Search farmers" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="fd-select" value={region} onChange={(e) => setRegion(e.target.value)}>{['All','Volta Region','Ashanti Region','Eastern Region','Central Region','Northern Region'].map((value) => <option key={value}>{value}</option>)}</select>
          <select className="fd-select" value={status} onChange={(e) => setStatus(e.target.value)}>{['All','Approved','Pending','Suspended'].map((value) => <option key={value}>{value}</option>)}</select>
          <Button onClick={() => setOpenAddModal(true)}>Add Farmer</Button>
        </div>
      </div>
      {error && <div className="fd-card" style={{ color: "var(--fd-danger)" }}>{error}</div>}
      {loading ? <div className="fd-card">Loading farmers...</div> : <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />}
      <Modal open={openAddModal} title="Add Farmer" onClose={() => setOpenAddModal(false)}>
        <div style={{ display: "grid", gap: 12 }}>
          <div className="fd-grid-2">
            <input className="fd-input" placeholder="Farmer name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            <input className="fd-input" placeholder="Farm name" value={form.farmName} onChange={(event) => updateForm("farmName", event.target.value)} />
            <select className="fd-select" value={form.region} onChange={(event) => updateForm("region", event.target.value)}>{['Volta Region','Ashanti Region','Eastern Region','Central Region','Northern Region'].map((value) => <option key={value}>{value}</option>)}</select>
            <input className="fd-input" placeholder="Phone" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
            <input className="fd-input" placeholder="Payout account" value={form.payoutAccount} onChange={(event) => updateForm("payoutAccount", event.target.value)} />
          </div>
          {addError && <div style={{ color: "var(--fd-danger)" }}>{addError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={addFarmer}>Create Farmer</Button>
          </div>
        </div>
      </Modal>
      <SlideOver open={Boolean(selected)} title={selected?.farmName || "Farmer details"} onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: "grid", gap: 14 }}>
            <Tabs tabs={["Profile", "Batches", "Payouts", "Performance"]} active={tab} onChange={setTab} />
            {tab === "Profile" && <div className="fd-card" style={{ padding: 12 }}><div>{selected.name}</div><div>{selected.region}</div><div>{selected.phone}</div><div>{selected.payoutAccount}</div></div>}
            {tab === "Batches" && selected.batches.map((batch) => <div key={batch.id} className="fd-card" style={{ padding: 12 }}>{batch.product} - {batch.quantity}kg</div>)}
            {tab === "Payouts" && selected.payouts.map((payout, index) => <div key={index} className="fd-card" style={{ padding: 12 }}>{payout.period} - {formatCurrency(payout.amount)} - {payout.status}</div>)}
            {tab === "Performance" && <div className="fd-card" style={{ padding: 12 }}>Total value supplied: {formatCurrency(selected.totalValueSupplied)}<br />Total rejections: {selected.totalRejections}</div>}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
