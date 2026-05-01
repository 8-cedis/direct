"use client";

import Link from "next/link";
import { useState } from "react";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function CheckoutSuccessPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="card w-full max-w-2xl p-8 space-y-6">
        {/* Confirmation header */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-light-green)]">
            <span className="text-3xl text-[var(--color-primary-green)]">✓</span>
          </div>
          <h1 className="display-title text-4xl text-[var(--color-dark-green)]">Order confirmed</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Your order has been placed and is now being prepared for dispatch.
          </p>
        </div>

        {/* Order meta cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Order ID</p>
            <p className="mt-1 text-sm font-bold text-[var(--color-primary-green)]">FD-4201</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Delivery date</p>
            <p className="mt-1 text-sm font-bold text-[var(--color-primary-green)]">April 5, 2026</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Status</p>
            <p className="mt-1 text-sm font-bold text-[var(--color-primary-green)]">Confirmed</p>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-[var(--radius-card)] bg-[var(--color-light-green)] p-5">
          <h2 className="text-lg font-semibold text-[var(--color-primary-green)]">What happens next</h2>
          <p className="mt-2 text-sm text-[var(--color-primary-green)]">
            You can track your order in real time from the order tracking page.
          </p>
        </div>

        {/* ── Review form ── */}
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="display-title text-xl text-[var(--color-dark-green)]">Leave a Review</h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              How was your experience? Your feedback helps our farmers improve.
            </p>
          </div>

          {submitted ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "20px 0",
                color: "var(--color-primary-green)",
              }}
            >
              <span style={{ fontSize: 36 }}>🌿</span>
              <p className="font-semibold">Thank you for your review!</p>
              <p className="text-sm text-[var(--color-muted)]">Your feedback has been submitted and will help our farming community.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star selector */}
              <div>
                <p className="text-sm font-medium text-[var(--color-dark-green)] mb-2">Rating</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        fontSize: 30,
                        color: star <= (hovered || rating) ? "#d97706" : "#d1d5db",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        transition: "color 0.15s",
                      }}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {(hovered || rating) > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-primary-green)", fontWeight: 600 }}>
                    {STAR_LABELS[hovered || rating]}
                  </p>
                )}
              </div>

              {/* Review text */}
              <div>
                <label
                  htmlFor="review-text"
                  className="text-sm font-medium text-[var(--color-dark-green)] mb-1 block"
                >
                  Your review <span className="text-[var(--color-muted)] font-normal">(optional)</span>
                </label>
                <textarea
                  id="review-text"
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the freshness, packaging, and delivery…"
                  className="w-full bg-white p-3 text-sm"
                  style={{
                    borderRadius: "var(--radius-control)",
                    border: "var(--border-default)",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!rating || submitting}
                className="btn-primary w-full py-3 font-semibold text-sm"
                style={{ opacity: !rating ? 0.55 : 1 }}
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
              {!rating && (
                <p className="text-xs text-center text-[var(--color-muted)]">Please select a star rating first.</p>
              )}
            </form>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/products" className="btn-secondary px-6 py-3 text-sm font-semibold">
            Continue Shopping
          </Link>
          <Link href="/orders/tracking" className="btn-primary px-6 py-3 text-sm font-semibold">
            Track order
          </Link>
        </div>
      </section>
    </div>
  );
}
