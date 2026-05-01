"use client";

export default function Input({ label, error, hint, className = "", ...props }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label && <span className="fd-label" style={{ textTransform: "none" }}>{label}</span>}
      <input className={`fd-input ${className}`} style={{ padding: "12px 14px" }} {...props} />
      {hint && !error && <span style={{ color: "var(--fd-muted)", fontSize: 12 }}>{hint}</span>}
      {error && <span style={{ color: "var(--fd-danger)", fontSize: 12 }}>{error}</span>}
    </label>
  );
}
