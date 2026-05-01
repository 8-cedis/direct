"use client";

import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { apiRequest } from "../../lib/api";
import { User } from "../../types";

export default function ComplaintSubmissionPage() {
  const [subject, setSubject] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const rawUser = localStorage.getItem("farm_store_user");
      const user: User | null = rawUser ? JSON.parse(rawUser) : null;
      if (!user) {
        setError("Please login first to submit a complaint.");
        return;
      }

      await apiRequest("/crm/complaints", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          subject,
          complaintText,
        }),
      });

      setSubject("");
      setComplaintText("");
      setMessage("Complaint submitted successfully. Our admin team will respond soon.");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-3xl p-8"
      >
        <h1 className="display-title text-4xl text-[#4F633D]">Buyer Complaint Form</h1>
        <p className="mt-3 max-w-2xl text-slate-700">
          Share your issue and we will investigate quickly. Please include order details in your notes when possible.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onSubmit={handleSubmit}
        className="glass rounded-2xl p-6"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-4 py-2"
              placeholder="Late delivery, damaged item, wrong order"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Complaint Details</label>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/80 px-4 py-2"
              rows={8}
              placeholder="Describe your issue in detail"
              required
            />
          </div>
        </div>

        {message && <p className="mt-4 text-sm font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" className="btn-primary mt-5 px-6 py-2">
          Submit Complaint
        </button>
      </motion.form>
    </section>
  );
}

