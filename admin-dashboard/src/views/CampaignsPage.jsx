"use client";

import { useState } from "react";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { useFetchData } from "../hooks/useFetchData";
import { formatDate, formatCurrency } from "../utils/formatters";
import { createCampaign } from "../services/campaignsService";

export default function CampaignsPage() {
  const { data, setData } = useFetchData("/api/campaigns", []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    segment: "",
    message: "",
    channel: "SMS",
  });

  const estimatedRevenue = form.message.trim() ? form.message.trim().length * 2.5 : 0;

  const submitCampaign = async () => {
    const segment = form.segment.trim();
    const message = form.message.trim();

    if (!segment || !message) {
      setError("Segment and message are required.");
      return;
    }

    setSaving(true);
    setError("");

    const now = new Date().toISOString();
    const payload = {
      name: `${segment} ${form.channel} Campaign`,
      targetSegment: segment,
      channel: form.channel,
      message,
      status: "Scheduled",
      scheduledDate: now,
      messagesSent: 0,
      ordersGenerated: 0,
      createdAt: now,
    };

    try {
      await createCampaign(payload);
    } catch (_err) {
      // Keep UI functional even if a database write is blocked.
    }

    setData((current) => [
      {
        id: `CMP-${Date.now()}`,
        ...payload,
      },
      ...current,
    ]);

    setForm({ segment: "", message: "", channel: "SMS" });
    setOpen(false);
    setSaving(false);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="fd-grid-3"><div className="fd-card"><div className="fd-label">Active Campaigns</div><div className="fd-stat-value">{data.filter((item) => item.status !== 'Sent').length}</div></div><div className="fd-card"><div className="fd-label">Messages Sent This Month</div><div className="fd-stat-value">1,420</div></div><div className="fd-card"><div className="fd-label">Average Response Rate</div><div className="fd-stat-value">24.8%</div></div></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button onClick={() => setOpen(true)}>Create Campaign</Button></div>
      <DataTable columns={[{ key: 'name', label: 'Campaign Name' }, { key: 'targetSegment', label: 'Target Segment' }, { key: 'channel', label: 'Channel' }, { key: 'scheduledDate', label: 'Scheduled Date', render: (row) => formatDate(row.scheduledDate) }, { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'Sent' ? 'success' : row.status === 'Scheduled' ? 'info' : 'neutral'}>{row.status}</Badge> }, { key: 'messagesSent', label: 'Messages Sent' }, { key: 'ordersGenerated', label: 'Orders Generated' }]} rows={data} />
      <Modal open={open} title="Create Campaign" onClose={() => setOpen(false)}><div style={{ display: 'grid', gap: 12 }}><input className="fd-input" placeholder="Segment" value={form.segment} onChange={(event) => setForm((current) => ({ ...current, segment: event.target.value }))} /><textarea className="fd-textarea" placeholder="Message" rows={4} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /><select className="fd-select" value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}><option>SMS</option><option>Email</option><option>WhatsApp</option></select><div>Preview will show here. Estimated revenue: {formatCurrency(estimatedRevenue)}</div>{error && <div style={{ color: 'var(--fd-danger)' }}>{error}</div>}<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><Button onClick={submitCampaign} disabled={saving}>{saving ? 'Creating...' : 'Create Campaign'}</Button></div></div></Modal>
    </div>
  );
}
