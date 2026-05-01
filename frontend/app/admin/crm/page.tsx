"use client";

import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { Complaint, CrmCustomer, CrmInteraction, NotificationTrigger } from "../../types";

type InteractionForm = {
  userId: number;
  interactionType: CrmInteraction["interaction_type"];
  notes: string;
  interactionDate: string;
};

type TriggerForm = {
  triggerType: NotificationTrigger["trigger_type"];
  channel: NotificationTrigger["channel"];
  targetUserId: string;
  payloadText: string;
};

const defaultInteraction: InteractionForm = {
  userId: 0,
  interactionType: "email",
  notes: "",
  interactionDate: new Date().toISOString().slice(0, 10),
};

const defaultTrigger: TriggerForm = {
  triggerType: "order_update",
  channel: "email",
  targetUserId: "",
  payloadText: '{"message":"Your order status was updated"}',
};

const complaintStatuses: Array<Complaint["status"]> = ["open", "in_review", "resolved", "rejected"];

export default function AdminCrmPage() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [interactionForm, setInteractionForm] = useState<InteractionForm>(defaultInteraction);
  const [triggerForm, setTriggerForm] = useState<TriggerForm>(defaultTrigger);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [complaintStatus, setComplaintStatus] = useState<Complaint["status"]>("in_review");
  const [complaintResponse, setComplaintResponse] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBase = async () => {
    try {
      const [customerData, complaintData, triggerData] = await Promise.all([
        apiRequest<CrmCustomer[]>("/crm/customers"),
        apiRequest<Complaint[]>("/crm/complaints"),
        apiRequest<NotificationTrigger[]>("/crm/notifications"),
      ]);
      setCustomers(customerData);
      setComplaints(complaintData);
      setTriggers(triggerData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadInteractions = async (userId: number) => {
    try {
      const data = await apiRequest<CrmInteraction[]>(`/crm/customers/${userId}/interactions`);
      setInteractions(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    // Initial async fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBase();
  }, []);

  const onSelectCustomer = async (userId: number) => {
    setSelectedCustomerId(userId);
    setInteractionForm((prev) => ({ ...prev, userId }));
    await loadInteractions(userId);
  };

  const submitInteraction = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      if (!interactionForm.userId) {
        setError("Select a customer first.");
        return;
      }

      await apiRequest(`/crm/customers/${interactionForm.userId}/interactions`, {
        method: "POST",
        body: JSON.stringify({
          interactionType: interactionForm.interactionType,
          notes: interactionForm.notes,
          interactionDate: new Date(interactionForm.interactionDate).toISOString(),
        }),
      });

      setInteractionForm((prev) => ({ ...prev, notes: "" }));
      setMessage("Interaction logged.");
      await loadInteractions(interactionForm.userId);
      await loadBase();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const submitComplaintResponse = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      if (!selectedComplaintId) {
        setError("Select a complaint first.");
        return;
      }

      await apiRequest(`/crm/complaints/${selectedComplaintId}/respond`, {
        method: "PUT",
        body: JSON.stringify({
          status: complaintStatus,
          adminResponse: complaintResponse,
        }),
      });

      setMessage(`Complaint #${selectedComplaintId} updated.`);
      setSelectedComplaintId(null);
      setComplaintResponse("");
      await loadBase();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const submitTrigger = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await apiRequest(`/crm/notifications/trigger`, {
        method: "POST",
        body: JSON.stringify({
          triggerType: triggerForm.triggerType,
          channel: triggerForm.channel,
          targetUserId: triggerForm.targetUserId ? Number(triggerForm.targetUserId) : null,
          payload: JSON.parse(triggerForm.payloadText || "{}"),
        }),
      });

      setMessage("Notification trigger queued.");
      await loadBase();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-3xl p-8"
      >
        <h1 className="display-title text-4xl text-[#4F633D]">CRM Command Center</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          Manage customers, track interactions, resolve complaints, and trigger email/SMS workflows.
        </p>
      </motion.div>

      {message && <div className="glass rounded-xl p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6 xl:col-span-2"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Customer List and Segmentation</h2>
          <div className="mt-4 space-y-3">
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedCustomerId === customer.id
                    ? "border-[rgba(79,99,61,0.52)] bg-[rgba(139,161,148,0.25)]"
                    : "border-[rgba(79,99,61,0.2)] bg-white/60"
                }`}
              >
                <div className="grid grid-cols-1 gap-2 md:grid-cols-6 md:items-center">
                  <div className="md:col-span-2">
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-700">{customer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Tag</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#4F633D]">
                      {customer.segmentation_tag}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Orders</p>
                    <p className="font-semibold text-slate-900">{customer.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Value</p>
                    <p className="font-semibold text-slate-900">${customer.total_order_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Interactions</p>
                    <p className="font-semibold text-slate-900">{customer.interaction_count}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={submitInteraction}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-[#4F633D]">Log Interaction</h2>
          <div className="mt-4 space-y-3">
            <select
              value={interactionForm.interactionType}
              onChange={(e) =>
                setInteractionForm((prev) => ({
                  ...prev,
                  interactionType: e.target.value as CrmInteraction["interaction_type"],
                }))
              }
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="meeting">Meeting</option>
              <option value="support_ticket">Support Ticket</option>
            </select>
            <input
              type="date"
              value={interactionForm.interactionDate}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, interactionDate: e.target.value }))}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            />
            <textarea
              value={interactionForm.notes}
              onChange={(e) => setInteractionForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={5}
              placeholder="Interaction notes"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
              required
            />
            <button type="submit" className="btn-primary w-full px-4 py-2">
              Save Interaction
            </button>
          </div>
        </motion.form>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Interaction History</h2>
          <div className="mt-4 space-y-3">
            {interactions.length === 0 && (
              <p className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">Select a customer to view interactions.</p>
            )}
            {interactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-4">
                <p className="text-sm font-semibold text-[#4F633D]">{item.interaction_type.toUpperCase()}</p>
                <p className="mt-1 text-sm text-slate-700">{item.notes}</p>
                <p className="mt-2 text-xs text-slate-600">{new Date(item.interaction_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={submitComplaintResponse}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold text-[#4F633D]">Complaint and Dispute Panel</h2>
          <div className="mt-4 space-y-3">
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {complaints.map((complaint) => (
                <button
                  type="button"
                  key={complaint.id}
                  onClick={() => {
                    setSelectedComplaintId(complaint.id);
                    setComplaintStatus(complaint.status);
                    setComplaintResponse(complaint.admin_response || "");
                  }}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedComplaintId === complaint.id
                      ? "border-[rgba(79,99,61,0.55)] bg-[rgba(139,161,148,0.2)]"
                      : "border-[rgba(79,99,61,0.2)] bg-white/60"
                  }`}
                >
                  <p className="font-semibold text-slate-900">#{complaint.id} {complaint.subject}</p>
                  <p className="text-xs text-slate-600">{complaint.user_name} • {complaint.status}</p>
                </button>
              ))}
            </div>

            <select
              value={complaintStatus}
              onChange={(e) => setComplaintStatus(e.target.value as Complaint["status"])}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            >
              {complaintStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <textarea
              value={complaintResponse}
              onChange={(e) => setComplaintResponse(e.target.value)}
              rows={4}
              placeholder="Admin response"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
            />
            <button type="submit" className="btn-primary w-full px-4 py-2" disabled={!selectedComplaintId}>
              Save Response
            </button>
          </div>
        </motion.form>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onSubmit={submitTrigger}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-[#4F633D]">Email/SMS Notification Triggers</h2>
        <p className="mt-2 text-sm text-slate-700">Configure order update or abandoned cart notifications.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={triggerForm.triggerType}
            onChange={(e) =>
              setTriggerForm((prev) => ({ ...prev, triggerType: e.target.value as NotificationTrigger["trigger_type"] }))
            }
            className="rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
          >
            <option value="order_update">order_update</option>
            <option value="abandoned_cart">abandoned_cart</option>
          </select>
          <select
            value={triggerForm.channel}
            onChange={(e) => setTriggerForm((prev) => ({ ...prev, channel: e.target.value as NotificationTrigger["channel"] }))}
            className="rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
          >
            <option value="email">email</option>
            <option value="sms">sms</option>
          </select>
          <input
            value={triggerForm.targetUserId}
            onChange={(e) => setTriggerForm((prev) => ({ ...prev, targetUserId: e.target.value }))}
            placeholder="Target User ID"
            className="rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
          />
          <button type="submit" className="btn-primary px-4 py-2">
            Queue Trigger
          </button>
        </div>
        <textarea
          value={triggerForm.payloadText}
          onChange={(e) => setTriggerForm((prev) => ({ ...prev, payloadText: e.target.value }))}
          rows={3}
          className="mt-3 w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-3 py-2"
        />

        <div className="mt-4 max-h-52 space-y-2 overflow-auto">
          {triggers.map((trigger) => (
            <div key={trigger.id} className="rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-3 text-sm">
              <p className="font-semibold text-slate-900">
                #{trigger.id} {trigger.trigger_type} via {trigger.channel}
              </p>
              <p className="text-xs text-slate-600">Status: {trigger.status}</p>
            </div>
          ))}
        </div>
      </motion.form>
    </section>
  );
}
