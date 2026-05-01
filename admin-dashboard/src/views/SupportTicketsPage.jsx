"use client";

import { useState } from "react";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import SlideOver from "../components/SlideOver";
import { useFetchData } from "../hooks/useFetchData";
import Button from "../components/Button";
import { api } from "../services/api";

export default function SupportTicketsPage() {
  const { data, setData } = useFetchData("/api/tickets", []);
  const [selected, setSelected] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  const sendReply = async () => {
    const message = replyDraft.trim();
    if (!selected || !message) return;

    try {
      await api.post("/tickets/reply", {
        ticketId: selected.id,
        message,
      });
    } catch (_err) {
      // Keep support workflow usable without blocking on API availability.
    }

    const nextMessage = { from: "Support", message };

    setData((current) =>
      current.map((ticket) =>
        ticket.id === selected.id
          ? {
              ...ticket,
              status: "In Progress",
              lastUpdated: new Date().toISOString().slice(0, 10),
              conversation: [...(ticket.conversation || []), nextMessage],
            }
          : ticket
      )
    );

    setSelected((current) =>
      current
        ? {
            ...current,
            status: "In Progress",
            lastUpdated: new Date().toISOString().slice(0, 10),
            conversation: [...(current.conversation || []), nextMessage],
          }
        : current
    );
    setReplyDraft("");
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="fd-grid-4"><div className="fd-card"><div className="fd-label">Open Tickets</div><div className="fd-stat-value">{data.filter((item) => item.status === 'Open').length}</div></div><div className="fd-card"><div className="fd-label">Average Resolution Time</div><div className="fd-stat-value">4.2h</div></div><div className="fd-card"><div className="fd-label">Resolved Today</div><div className="fd-stat-value">3</div></div><div className="fd-card"><div className="fd-label">Customer Satisfaction</div><div className="fd-stat-value">4.6/5</div></div></div>
      <DataTable columns={[{ key: 'id', label: 'Ticket ID' }, { key: 'customerName', label: 'Customer' }, { key: 'orderNumber', label: 'Order' }, { key: 'issueType', label: 'Issue Type' }, { key: 'priority', label: 'Priority', render: (row) => <Badge tone={row.priority === 'High' ? 'danger' : row.priority === 'Medium' ? 'warning' : 'neutral'}>{row.priority}</Badge> }, { key: 'assignedTo', label: 'Assigned To' }, { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'Resolved' ? 'success' : row.status === 'Open' ? 'warning' : 'info'}>{row.status}</Badge> }, { key: 'createdDate', label: 'Created Date' }, { key: 'lastUpdated', label: 'Last Updated' }]} rows={data} onRowClick={setSelected} />
      <SlideOver open={Boolean(selected)} title={selected?.id || 'Ticket'} onClose={() => setSelected(null)}><div style={{ display: 'grid', gap: 10 }}><div>{selected?.description}</div>{selected?.conversation?.map((message, index) => <div key={index} className="fd-card" style={{ padding: 12 }}>{message.from}: {message.message}</div>)}<textarea className="fd-textarea" rows={3} placeholder="Reply" value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} /><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button onClick={sendReply} disabled={!replyDraft.trim()}>Send Reply</Button></div></div></SlideOver>
    </div>
  );
}
