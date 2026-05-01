"use client";

import { FormEvent, useState } from "react";

type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    id: 1,
    question: "How fast is delivery in Accra?",
    answer: "Most orders are delivered the same day when placed before 4 PM.",
  },
  {
    id: 2,
    question: "Can I schedule delivery windows?",
    answer: "Yes. You can choose your preferred time slot during checkout.",
  },
  {
    id: 3,
    question: "Do you offer only local produce?",
    answer: "Yes. We source directly from trusted farms across Ghana.",
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
    setSubject("General Inquiry");
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="display-title text-4xl">Contact us</h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="card p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-light-green)]">📞</div>
            <p className="font-semibold">Phone</p>
            <p className="text-sm text-[var(--color-muted)]">+233 24 123 4567</p>
            <p className="text-sm text-[var(--color-muted)]">Mon-Sat, 8 AM to 7 PM</p>
          </article>

          <article className="card p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-light-green)]">✉️</div>
            <p className="font-semibold">Email</p>
            <p className="text-sm text-[var(--color-muted)]">hello@farmdirect.gh</p>
            <p className="text-sm text-[var(--color-muted)]">Response in under 24 hours</p>
          </article>

          <article className="card p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-light-green)]">📍</div>
            <p className="font-semibold">Warehouse</p>
            <p className="text-sm text-[var(--color-muted)]">Community 8 Industrial Lane</p>
            <p className="text-sm text-[var(--color-muted)]">Tema, Greater Accra</p>
          </article>

          <article className="card p-4">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-light-green)]">💬</div>
            <p className="font-semibold">WhatsApp</p>
            <p className="text-sm text-[var(--color-muted)]">+233 24 000 0000</p>
            <p className="text-sm text-[var(--color-muted)]">Quick support and order help</p>
          </article>
        </div>

        <section className="card p-4">
          <h2 className="display-title text-2xl">FAQs</h2>
          <div className="mt-3 space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="card p-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq((current) => (current === faq.id ? null : faq.id))}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-[var(--color-dark-green)]"
                >
                  {faq.question}
                  <span>{openFaq === faq.id ? "−" : "+"}</span>
                </button>
                {openFaq === faq.id && <p className="mt-2 text-sm text-[var(--color-muted)]">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="card h-fit p-5 md:p-6">
        <h2 className="display-title text-3xl">Send a message</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="control w-full px-3 py-2" required />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="control w-full px-3 py-2" required />
          <select value={subject} onChange={(event) => setSubject(event.target.value)} className="control w-full px-3 py-2">
            <option>General Inquiry</option>
            <option>Order Issue</option>
            <option>Partnership</option>
          </select>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message"
            rows={5}
            className="control w-full px-3 py-2"
            required
          />
          <button type="submit" className="btn-primary w-full px-4 py-3 text-sm font-semibold">
            Send
          </button>
          {sent && (
            <p className="rounded-[var(--radius-control)] bg-[var(--color-light-green)] px-3 py-2 text-sm text-[var(--color-primary-green)]">
              Message sent successfully. We will get back to you shortly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
