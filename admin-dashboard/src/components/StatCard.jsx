import Badge from "./Badge";

export default function StatCard({ label, value, delta, tone = "neutral" }) {
  return (
    <div className="fd-card">
      <div className="fd-label">{label}</div>
      <div className="fd-stat-value" style={{ color: tone === "warning" ? "#b54708" : tone === "danger" ? "#b42318" : tone === "info" ? "#175cd3" : "var(--fd-primary-dark)" }}>
        {value}
      </div>
      {delta !== undefined && (
        <div style={{ marginTop: 8 }}>
          <Badge tone={delta >= 0 ? "success" : "danger"}>{delta >= 0 ? `▲ ${Math.abs(delta).toFixed(1)}%` : `▼ ${Math.abs(delta).toFixed(1)}%`}</Badge>
        </div>
      )}
    </div>
  );
}
