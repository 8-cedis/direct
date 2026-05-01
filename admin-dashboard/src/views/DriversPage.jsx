"use client";

import { useState } from "react";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import SlideOver from "../components/SlideOver";
import { useFetchData } from "../hooks/useFetchData";

const StarRating = ({ value }) => {
  const stars = Math.round(value);
  return (
    <span style={{ color: "#d97706", letterSpacing: 1 }} title={`${value} / 5`}>
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      <span style={{ color: "var(--fd-muted)", fontSize: 12, marginLeft: 4 }}>{value.toFixed(1)}</span>
    </span>
  );
};

export default function DriversPage() {
  const { data } = useFetchData("/api/drivers", []);
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "vehiclePlate", label: "Vehicle Plate" },
    { key: "zone", label: "Zone" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          tone={
            row.status === "Available"
              ? "success"
              : row.status === "On Delivery"
              ? "warning"
              : "neutral"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    { key: "deliveriesCompletedToday", label: "Today" },
    { key: "totalDeliveries", label: "Total" },
    {
      key: "rating",
      label: "Rating",
      render: (row) => <StarRating value={row.rating ?? 0} />,
    },
    {
      key: "complaints",
      label: "Complaints",
      render: (row) => (
        <Badge tone={row.complaints === 0 ? "success" : row.complaints >= 3 ? "danger" : "warning"}>
          {row.complaints}
        </Badge>
      ),
    },
  ];

  const zoneSet = Array.from(new Set(data.map((d) => d.zone)));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Summary cards */}
      <div className="fd-grid-4">
        {[
          { label: "Total Drivers", value: data.length },
          { label: "Available Now", value: data.filter((d) => d.status === "Available").length },
          { label: "Currently Delivering", value: data.filter((d) => d.status === "On Delivery").length },
          { label: "Off Duty", value: data.filter((d) => d.status === "Off Duty").length },
        ].map(({ label, value }) => (
          <div key={label} className="fd-card">
            <div className="fd-label">{label}</div>
            <div className="fd-stat-value">{value}</div>
          </div>
        ))}
      </div>

      {/* Zone coverage */}
      <div className="fd-card" style={{ display: "grid", gap: 8 }}>
        <div className="fd-label">Zone Coverage</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {zoneSet.map((zone) => {
            const count = data.filter((d) => d.zone === zone).length;
            const active = data.filter((d) => d.zone === zone && d.status !== "Off Duty").length;
            return (
              <div key={zone} className="fd-card" style={{ padding: "8px 14px", minWidth: 130 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{zone}</div>
                <div style={{ fontSize: 12, color: "var(--fd-muted)" }}>
                  {active}/{count} active
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live map placeholder */}
      <div
        className="fd-card"
        style={{
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#eaf5e4,#f5f9f2)",
          color: "var(--fd-muted)",
          fontSize: 14,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 22 }}>🗺️</span>
        Live Map — North Accra · East Legon · Osu · Tema · Airport · Spintex · Adenta · Labadi
      </div>

      {/* Driver table */}
      <DataTable columns={columns} rows={data} onRowClick={setSelected} />

      {/* Slide-over detail panel */}
      <SlideOver
        open={Boolean(selected)}
        title={selected?.name || "Driver details"}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="fd-grid-2">
              <div className="fd-card">
                <div className="fd-label">Driver ID</div>
                <div style={{ fontWeight: 600 }}>{selected.id}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Zone</div>
                <div style={{ fontWeight: 600 }}>{selected.zone}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Phone</div>
                <div>{selected.phone}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Vehicle Plate</div>
                <div>{selected.vehiclePlate}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Total Deliveries</div>
                <div style={{ fontWeight: 600 }}>{selected.totalDeliveries}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Avg / Day</div>
                <div style={{ fontWeight: 600 }}>{selected.averagePerDay}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Rating</div>
                <StarRating value={selected.rating ?? 0} />
              </div>
              <div className="fd-card">
                <div className="fd-label">Complaints</div>
                <Badge tone={selected.complaints === 0 ? "success" : selected.complaints >= 3 ? "danger" : "warning"}>
                  {selected.complaints}
                </Badge>
              </div>
              <div className="fd-card">
                <div className="fd-label">Joined</div>
                <div>{selected.joinedDate}</div>
              </div>
              <div className="fd-card">
                <div className="fd-label">Status</div>
                <Badge tone={selected.status === "Available" ? "success" : selected.status === "On Delivery" ? "warning" : "neutral"}>
                  {selected.status}
                </Badge>
              </div>
            </div>

            <div className="fd-card">
              <div className="fd-label" style={{ marginBottom: 8 }}>Today's Deliveries ({selected.deliveriesCompletedToday} completed)</div>
              {selected.todayDeliveries.length === 0 ? (
                <div style={{ color: "var(--fd-muted)", fontSize: 13 }}>No deliveries today.</div>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {selected.todayDeliveries.map((delivery) => (
                    <div key={delivery.orderNumber} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{delivery.orderNumber}</span>
                      <span style={{ color: "var(--fd-muted)" }}>{delivery.address}</span>
                      <Badge tone={delivery.status === "Delivered" ? "success" : "warning"}>{delivery.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
