export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <section className="fd-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", marginBottom: 12 }}>
        <div>
          <div className="fd-label">{subtitle}</div>
          <h3 className="fd-title" style={{ margin: 0, fontSize: 26 }}>{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
