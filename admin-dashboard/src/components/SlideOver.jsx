"use client";

import { useEffect } from "react";

export default function SlideOver({ open, title, children, onClose, width = 520 }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fd-overlay" onClick={onClose} />
      <aside className="fd-siderail" style={{ width: `min(${width}px, 92vw)` }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--fd-border)", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="fd-label">Details</div>
            <h3 className="fd-title" style={{ margin: 0, fontSize: 24 }}>{title}</h3>
          </div>
          <button className="fd-btn" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </aside>
    </>
  );
}
