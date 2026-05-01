"use client";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {tabs.map((tab) => (
        <button key={tab} className={`fd-tab ${active === tab ? "fd-tab-active" : ""}`} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}
