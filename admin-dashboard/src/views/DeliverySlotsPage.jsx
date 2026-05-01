"use client";

import { useState } from "react";
import DataTable from "../components/DataTable";
import Button from "../components/Button";
import { useFetchData } from "../hooks/useFetchData";
import { updateDeliverySlot } from "../services/deliveryService";

const slots = ["8 to 10 AM","10 AM to 12 PM","12 to 2 PM","2 to 4 PM","4 to 6 PM","6 to 8 PM"];

export default function DeliverySlotsPage() {
  const { data } = useFetchData("/api/orders", []);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slotStates, setSlotStates] = useState(() =>
    slots.map((slot, index) => ({
      id: `slot-${index + 1}`,
      slot,
      booked: 10 + index,
      capacity: 20 + index * 2,
      fillPercent: 50 + index * 5,
      isOpen: index % 2 !== 0,
    }))
  );

  const toggleSlot = async (slotId) => {
    const target = slotStates.find((item) => item.id === slotId);
    if (!target) return;

    const nextOpenState = !target.isOpen;

    try {
      await updateDeliverySlot(slotId, { status: nextOpenState ? "open" : "closed", date });
    } catch (_err) {
      // Keep local operation responsive when backend is unavailable.
    }

    setSlotStates((current) =>
      current.map((item) => (item.id === slotId ? { ...item, isOpen: nextOpenState } : item))
    );
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <input className="fd-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 220, padding: 12 }} />
      <div className="fd-grid-3">
        {slotStates.map((slot) => <div key={slot.slot} className="fd-card"><div className="fd-title" style={{ fontSize: 22 }}>{slot.slot}</div><div>{slot.booked} booked / {slot.capacity} capacity</div><div style={{ height: 8, background: '#eef2f6', borderRadius: 999, marginTop: 10 }}><div style={{ width: `${slot.fillPercent}%`, height: '100%', background: 'var(--fd-primary)', borderRadius: 999 }} /></div><Button style={{ marginTop: 12 }} onClick={() => toggleSlot(slot.id)}>{slot.isOpen ? 'Close Slot' : 'Open Slot'}</Button></div>)}
      </div>
      <DataTable columns={[{ key: 'id', label: 'Order' }, { key: 'deliverySlot', label: 'Slot' }, { key: 'customerName', label: 'Customer' }]} rows={data.slice(0, 12)} />
    </div>
  );
}
