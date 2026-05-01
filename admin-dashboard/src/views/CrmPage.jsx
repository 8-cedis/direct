"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "../components/Button";
import Input from "../components/Input";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { api } from "../services/api";
import { formatDate, formatTime } from "../utils/formatters";

const complaintStatuses = ["open", "in_review", "resolved", "rejected"];

/* ── Dummy reviews shown when API returns nothing ── */
const DUMMY_REVIEWS = [
  { id: 1, customerName: "Adwoa Kyei", product: "Organic Tomatoes (1kg)", rating: 5, reviewText: "Absolutely fresh! Arrived well-packed and the tomatoes were perfect for my stew.", orderId: "FD-4180", createdAt: "2026-04-28T09:14:00Z", status: "published" },
  { id: 2, customerName: "Kofi Acheampong", product: "Free-Range Eggs (30 tray)", rating: 4, reviewText: "Good quality eggs. Delivery was a day late but the product made up for it.", orderId: "FD-4173", createdAt: "2026-04-27T14:32:00Z", status: "published" },
  { id: 3, customerName: "Esi Amoah", product: "Fresh Plantain (bunch)", rating: 3, reviewText: "Plantains were slightly overripe on arrival. Hope for better next time.", orderId: "FD-4165", createdAt: "2026-04-26T11:05:00Z", status: "pending" },
  { id: 4, customerName: "Kwabena Antwi", product: "Garden Eggs (500g)", rating: 5, reviewText: "Very fresh. Best garden eggs I've bought online. Will order again!", orderId: "FD-4158", createdAt: "2026-04-25T16:48:00Z", status: "published" },
  { id: 5, customerName: "Akua Sarpong", product: "Cassava (2kg)", rating: 2, reviewText: "The cassava was a bit old and dry. Expected better quality for the price.", orderId: "FD-4150", createdAt: "2026-04-24T08:20:00Z", status: "flagged" },
  { id: 6, customerName: "Yaw Boateng", product: "Organic Tomatoes (1kg)", rating: 5, reviewText: "Outstanding freshness. My family loved the stew I made. 10/10!", orderId: "FD-4141", createdAt: "2026-04-23T13:55:00Z", status: "published" },
  { id: 7, customerName: "Abena Ofori", product: "Kenkey (10 pieces)", rating: 4, reviewText: "Authentic taste. Slightly cold on arrival but acceptable.", orderId: "FD-4133", createdAt: "2026-04-22T10:10:00Z", status: "published" },
];

export default function CrmPage() {
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const [customers, setCustomers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [triggers, setTriggers] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState(complaintIdParam ? Number(complaintIdParam) : null);
  const [interactionType, setInteractionType] = useState("email");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("in_review");
  const [complaintResponse, setComplaintResponse] = useState("");
  const [triggerType, setTriggerType] = useState("order_update");
  const [triggerChannel, setTriggerChannel] = useState("email");
  const [triggerTargetUserId, setTriggerTargetUserId] = useState("");
  const [triggerPayloadText, setTriggerPayloadText] = useState('{"message":"Your order status was updated"}');
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBase = async () => {
    try {
      const [customerData, complaintData, triggerData] = await Promise.all([
        api.get("/crm/customers"),
        api.get("/crm/complaints"),
        api.get("/crm/notifications"),
      ]);

      setCustomers(Array.isArray(customerData) ? customerData : []);
      setComplaints(Array.isArray(complaintData) ? complaintData : []);
      setTriggers(Array.isArray(triggerData) ? triggerData : []);

      // Load reviews; fall back to dummy data if not yet implemented
      try {
        const reviewData = await api.get("/crm/reviews");
        setReviews(Array.isArray(reviewData) && reviewData.length ? reviewData : DUMMY_REVIEWS);
      } catch {
        setReviews(DUMMY_REVIEWS);
      }
    } catch (err) {
      setError(err.message || "Failed to load CRM data.");
    }
  };

  const loadInteractions = async (userId) => {
    try {
      const data = await api.get(`/crm/customers/${userId}/interactions`);
      setInteractions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load customer interactions.");
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (complaintIdParam) {
      const nextId = Number(complaintIdParam);
      if (Number.isFinite(nextId)) {
        setSelectedComplaintId(nextId);
        const complaint = complaints.find((item) => Number(item.id) === nextId);
        if (complaint) {
          setComplaintStatus(complaint.status || "in_review");
          setComplaintResponse(complaint.admin_response || "");
        }
      }
    }
  }, [complaintIdParam, complaints]);

  const selectedComplaint = useMemo(
    () => complaints.find((item) => Number(item.id) === Number(selectedComplaintId)) || null,
    [complaints, selectedComplaintId]
  );

  const onSelectCustomer = async (userId) => {
    setSelectedCustomerId(userId);
    await loadInteractions(userId);
  };

  const submitInteraction = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (!selectedCustomerId) {
        setError("Select a customer first.");
        return;
      }

      await api.post(`/crm/customers/${selectedCustomerId}/interactions`, {
        interactionType,
        notes: interactionNotes,
        interactionDate: new Date().toISOString(),
      });

      setInteractionNotes("");
      setMessage("Interaction logged.");
      await loadInteractions(selectedCustomerId);
      await loadBase();
    } catch (err) {
      setError(err.message || "Failed to save interaction.");
    }
  };

  const submitComplaintUpdate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (!selectedComplaintId) {
        setError("Select a complaint first.");
        return;
      }

      await api.put(`/crm/complaints/${selectedComplaintId}/respond`, {
        status: complaintStatus,
        adminResponse: complaintResponse,
      });

      setMessage(`Complaint #${selectedComplaintId} updated.`);
      await loadBase();
    } catch (err) {
      setError(err.message || "Failed to update complaint.");
    }
  };

  const submitTrigger = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/crm/notifications/trigger", {
        triggerType,
        channel: triggerChannel,
        targetUserId: triggerTargetUserId ? Number(triggerTargetUserId) : null,
        payload: JSON.parse(triggerPayloadText || "{}"),
      });

      setMessage("Notification trigger queued.");
      await loadBase();
    } catch (err) {
      setError(err.message || "Failed to queue trigger.");
    }
  };

  const customerColumns = [
    { key: "id", label: "ID", width: 90 },
    { key: "name", label: "Customer" },
    { key: "segmentation_tag", label: "Segment" },
    { key: "total_orders", label: "Orders" },
    { key: "total_order_value", label: "Value", render: (row) => `GHS ${Number(row.total_order_value || 0).toFixed(2)}` },
  ];

  return (
    <section className="space-y-8">
      <div className="fd-card space-y-2">
        <div className="fd-label">CRM</div>
        <h1 className="fd-title text-3xl">Customer and complaint command center</h1>
        <p className="text-sm text-[var(--fd-muted)]">Review customers, log interactions, resolve complaints, and queue notification triggers.</p>
      </div>

      {message && <div className="fd-card" style={{ borderColor: "#86efac", color: "#166534" }}>{message}</div>}
      {error && <div className="fd-card" style={{ borderColor: "#fca5a5", color: "#b42318" }}>{error}</div>}

      <div className="fd-grid-2">
        <div className="fd-card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="fd-label">Customers</div>
              <h2 className="fd-title text-2xl">Customer list</h2>
            </div>
            <Badge tone="info">{customers.length} records</Badge>
          </div>
          <DataTable
            columns={customerColumns}
            rows={customers}
            onRowClick={(row) => onSelectCustomer(row.id)}
            emptyText="No customers found."
          />
          <div className="space-y-3">
            <div className="fd-label">Log interaction</div>
            <select className="fd-select w-full" value={interactionType} onChange={(event) => setInteractionType(event.target.value)}>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="meeting">Meeting</option>
              <option value="support_ticket">Support Ticket</option>
            </select>
            <textarea
              className="fd-textarea w-full"
              rows={4}
              placeholder="Interaction notes"
              value={interactionNotes}
              onChange={(event) => setInteractionNotes(event.target.value)}
            />
            <Button onClick={submitInteraction} className="w-full">Save Interaction</Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="fd-card space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="fd-label">Selected customer</div>
                <h2 className="fd-title text-2xl">Interaction history</h2>
              </div>
              <Badge tone="neutral">{selectedCustomerId ? `ID ${selectedCustomerId}` : "None"}</Badge>
            </div>
            <div className="space-y-3">
              {interactions.length === 0 && <div className="fd-card">Select a customer to view interactions.</div>}
              {interactions.map((item) => (
                <div key={item.id} className="fd-card">
                  <div className="flex items-center justify-between gap-4">
                    <strong>{String(item.interaction_type || "interaction").toUpperCase()}</strong>
                    <span className="text-xs text-[var(--fd-muted)]">{formatDate(item.interaction_date)} {formatTime(item.interaction_date)}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--fd-muted)]">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fd-card space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="fd-label">Complaints</div>
                <h2 className="fd-title text-2xl">Complaint panel</h2>
              </div>
              <Badge tone="warning">{complaints.length} items</Badge>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {complaints.map((complaint) => (
                <button
                  key={complaint.id}
                  type="button"
                  onClick={() => {
                    setSelectedComplaintId(Number(complaint.id));
                    setComplaintStatus(complaint.status || "in_review");
                    setComplaintResponse(complaint.admin_response || "");
                  }}
                  className={`fd-card w-full text-left ${Number(selectedComplaintId) === Number(complaint.id) ? "fd-chip-active" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <strong>#{complaint.id} {complaint.subject}</strong>
                    <Badge tone={complaint.status === "resolved" ? "success" : complaint.status === "rejected" ? "danger" : "warning"}>{complaint.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-[var(--fd-muted)]">{complaint.user_name} | {complaint.user_email}</div>
                </button>
              ))}
            </div>
            <select className="fd-select w-full" value={complaintStatus} onChange={(event) => setComplaintStatus(event.target.value)}>
              {complaintStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <textarea
              className="fd-textarea w-full"
              rows={4}
              placeholder="Admin response"
              value={complaintResponse}
              onChange={(event) => setComplaintResponse(event.target.value)}
            />
            <Button onClick={submitComplaintUpdate} className="w-full" disabled={!selectedComplaintId}>Save Response</Button>
            {selectedComplaint && (
              <div className="fd-card bg-[var(--fd-primary-light)]">
                <div className="fd-label">Active complaint</div>
                <p className="mt-2 text-sm text-[var(--fd-primary-dark)]">{selectedComplaint.complaint_text}</p>
              </div>
            )}
          </div>

          <div className="fd-card space-y-3">
            <div className="fd-label">Notification triggers</div>
            <h2 className="fd-title text-2xl">Queue email or SMS triggers</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select className="fd-select" value={triggerType} onChange={(event) => setTriggerType(event.target.value)}>
                <option value="order_update">order_update</option>
                <option value="abandoned_cart">abandoned_cart</option>
              </select>
              <select className="fd-select" value={triggerChannel} onChange={(event) => setTriggerChannel(event.target.value)}>
                <option value="email">email</option>
                <option value="sms">sms</option>
              </select>
              <Input label="Target User ID" value={triggerTargetUserId} onChange={(event) => setTriggerTargetUserId(event.target.value)} placeholder="Optional" />
            </div>
            <textarea className="fd-textarea w-full" rows={3} value={triggerPayloadText} onChange={(event) => setTriggerPayloadText(event.target.value)} />
            <Button onClick={submitTrigger} className="w-full">Queue Trigger</Button>
            <div className="max-h-48 space-y-2 overflow-auto pr-1">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="fd-card">
                  <div className="flex items-center justify-between gap-4">
                    <strong>#{trigger.id} {trigger.trigger_type}</strong>
                    <Badge tone="info">{trigger.channel}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-[var(--fd-muted)]">Status: {trigger.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Customer Reviews Panel ── */}
      <div className="fd-card space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="fd-label">Customer Feedback</div>
            <h2 className="fd-title text-2xl">Product Reviews</h2>
            <p className="text-sm text-[var(--fd-muted)] mt-1">Reviews submitted by customers after purchase.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Badge tone="info">{reviews.length} total</Badge>
            <Badge tone="success">{reviews.filter((r) => r.rating >= 4).length} positive</Badge>
            <Badge tone="warning">{reviews.filter((r) => r.rating === 3).length} neutral</Badge>
            <Badge tone="danger">{reviews.filter((r) => r.rating <= 2).length} negative</Badge>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "5", "4", "3", "2", "1"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setReviewFilter(f)}
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                border: "1px solid var(--fd-border, #e2e8f0)",
                background: reviewFilter === f ? "#3B6D11" : "transparent",
                color: reviewFilter === f ? "#fff" : "inherit",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: reviewFilter === f ? 700 : 400,
              }}
            >
              {f === "all" ? "All" : `${"★".repeat(Number(f))} ${f}★`}
            </button>
          ))}
        </div>

        {/* Review cards */}
        <div style={{ display: "grid", gap: 10 }}>
          {reviews
            .filter((r) => reviewFilter === "all" || String(r.rating) === reviewFilter)
            .map((review) => (
              <div
                key={review.id}
                className="fd-card"
                style={{ display: "grid", gap: 6 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{review.customerName}</span>
                    <span style={{ color: "var(--fd-muted)", fontSize: 12, marginLeft: 8 }}>
                      Order {review.orderId}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#d97706", fontSize: 15, letterSpacing: 1 }}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          review.status === "published" ? "#dcfce7" :
                          review.status === "flagged" ? "#fee2e2" : "#fef3c7",
                        color:
                          review.status === "published" ? "#166534" :
                          review.status === "flagged" ? "#991b1b" : "#92400e",
                      }}
                    >
                      {review.status}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--fd-muted)" }}>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--fd-muted)" }}>
                  Product: <strong>{review.product}</strong>
                </div>
                <p style={{ fontSize: 14, marginTop: 2 }}>{review.reviewText}</p>
              </div>
            ))}
          {reviews.filter((r) => reviewFilter === "all" || String(r.rating) === reviewFilter).length === 0 && (
            <div className="fd-card" style={{ color: "var(--fd-muted)", textAlign: "center" }}>
              No reviews for this filter.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
