"use client";

import { useEffect } from "react";

export default function Modal({ open, title, children, onClose, width = 720 }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fd-overlay" onClick={onClose} />
      <div className="fd-modal" style={{ width: `min(${width}px, 96vw)` }} role="dialog" aria-modal="true">
        <div style={{ padding: 20, borderBottom: "1px solid var(--fd-border)", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="fd-label">Modal</div>
            <h3 className="fd-title" style={{ margin: 0, fontSize: 28 }}>{title}</h3>
          </div>
          <button className="fd-btn" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </>
  );
}
