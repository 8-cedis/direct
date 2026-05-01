"use client";

export default function Pagination({ page, pageCount, onNext, onPrev }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
      <button className="fd-btn" onClick={onPrev} disabled={page <= 1}>Previous</button>
      <div className="fd-label" style={{ textTransform: "none" }}>Page {page} of {pageCount}</div>
      <button className="fd-btn" onClick={onNext} disabled={page >= pageCount}>Next</button>
    </div>
  );
}
