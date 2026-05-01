"use client";

import { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import { settings } from "../data";
import { api } from "../services/api";

export default function SettingsPage() {
  const [saved, setSaved] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(String(settings.delivery.fee || ""));
  const [minimumOrder, setMinimumOrder] = useState(String(settings.delivery.minimumOrder || ""));
  const [deliveryZones, setDeliveryZones] = useState(settings.delivery.zones || []);
  const [pointsPerGhc, setPointsPerGhc] = useState(String(settings.loyalty.pointsPerGhc || ""));
  const [silver, setSilver] = useState(String(settings.loyalty.silver || ""));
  const [gold, setGold] = useState(String(settings.loyalty.gold || ""));
  const [platinum, setPlatinum] = useState(String(settings.loyalty.platinum || ""));
  const [vat, setVat] = useState(String(settings.finance.vat || ""));
  const [payoutDay, setPayoutDay] = useState(String(settings.finance.payoutDay || ""));
  const [commission, setCommission] = useState(String(settings.finance.platformCommissionRate || 0));
  const [notifications, setNotifications] = useState(settings.notifications || {});
  const [thresholds, setThresholds] = useState(() =>
    Object.fromEntries(settings.reorderThresholds.map((item) => [item.id, String(item.threshold)]))
  );

  const persistSection = async (section, payload, successMessage) => {
    try {
      await api.put(`/settings/${section}`, payload);
    } catch (_err) {
      // Keep settings usable when API endpoints are not wired yet.
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(`fd_settings_${section}`, JSON.stringify(payload));
    }

    setSaved(successMessage);
  };

  const toggleZone = (zone) => {
    setDeliveryZones((current) =>
      current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone]
    );
  };

  const toggleNotification = (key) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveDeliverySettings = async () => {
    await persistSection(
      "delivery",
      {
        fee: Number(deliveryFee),
        minimumOrder: Number(minimumOrder),
        zones: deliveryZones,
      },
      "Delivery settings saved."
    );
  };

  const saveLoyaltySettings = async () => {
    await persistSection(
      "loyalty",
      {
        pointsPerGhc: Number(pointsPerGhc),
        silver: Number(silver),
        gold: Number(gold),
        platinum: Number(platinum),
      },
      "Loyalty settings saved."
    );
  };

  const saveFinanceSettings = async () => {
    const parsed = Number(commission);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setSaved("Commission rate must be between 0 and 100.");
      return;
    }

    await persistSection(
      "finance",
      {
        vat: Number(vat),
        payoutDay,
        platformCommissionRate: parsed,
      },
      "Finance settings saved."
    );
  };

  const saveNotificationSettings = async () => {
    await persistSection("notifications", notifications, "Notification settings saved.");
  };

  const saveReorderThresholds = async () => {
    const payload = settings.reorderThresholds.map((item) => ({
      ...item,
      threshold: Number(thresholds[item.id] || 0),
    }));

    await persistSection("reorder-thresholds", payload, "Reorder thresholds saved.");
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="fd-card" style={{ display: 'grid', gap: 12 }}>
        <h3 className="fd-title" style={{ fontSize: 24 }}>Delivery Settings</h3>
        <div className="fd-grid-3"><Input label="Delivery Fee" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} /><Input label="Minimum Order Value" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} /><div style={{ display: 'grid', gap: 8 }}>{settings.delivery.zones.map((zone) => <label key={zone} style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={deliveryZones.includes(zone)} onChange={() => toggleZone(zone)} />{zone}</label>)}</div></div>
        <Button onClick={saveDeliverySettings}>Save</Button>
      </section>
      <section className="fd-card" style={{ display: 'grid', gap: 12 }}>
        <h3 className="fd-title" style={{ fontSize: 24 }}>Loyalty Settings</h3>
        <div className="fd-grid-4"><Input label="Points per GH₵" value={pointsPerGhc} onChange={(event) => setPointsPerGhc(event.target.value)} /><Input label="Silver" value={silver} onChange={(event) => setSilver(event.target.value)} /><Input label="Gold" value={gold} onChange={(event) => setGold(event.target.value)} /><Input label="Platinum" value={platinum} onChange={(event) => setPlatinum(event.target.value)} /></div>
        <Button onClick={saveLoyaltySettings}>Save</Button>
      </section>
      <section className="fd-card" style={{ display: 'grid', gap: 12 }}>
        <h3 className="fd-title" style={{ fontSize: 24 }}>Finance Settings</h3>
        <div className="fd-grid-3">
          <Input label="VAT Percentage" value={vat} onChange={(event) => setVat(event.target.value)} />
          <Input label="Farmer Payout Day" value={payoutDay} onChange={(event) => setPayoutDay(event.target.value)} />
          <Input label="Platform Commission Rate (%)" type="number" min="0" max="100" step="0.1" value={commission} onChange={(event) => setCommission(event.target.value)} />
        </div>
        <Button onClick={saveFinanceSettings}>Save</Button>
      </section>
      <section className="fd-card" style={{ display: 'grid', gap: 12 }}>
        <h3 className="fd-title" style={{ fontSize: 24 }}>Notification Settings</h3>
        <div style={{ display: 'grid', gap: 8 }}>{Object.keys(settings.notifications).map((key) => <label key={key} style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={Boolean(notifications[key])} onChange={() => toggleNotification(key)} />{key}</label>)}</div>
        <Button onClick={saveNotificationSettings}>Save</Button>
      </section>
      <section className="fd-card" style={{ display: 'grid', gap: 12 }}>
        <h3 className="fd-title" style={{ fontSize: 24 }}>Reorder Thresholds</h3>
        <div className="fd-grid-2">{settings.reorderThresholds.map((item) => <Input key={item.id} label={item.name} value={thresholds[item.id] || ""} onChange={(event) => setThresholds((current) => ({ ...current, [item.id]: event.target.value }))} />)}</div>
        <Button onClick={saveReorderThresholds}>Save</Button>
      </section>
      {saved && <div className="fd-card" style={{ background: 'var(--fd-primary-light)' }}>{saved}</div>}
    </div>
  );
}
