"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName || !email || !phone || !address || !password) {
      setError("Please fill all fields before submitting.");
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSaving(true);
    try {
      await register({ firstName, lastName, email, phone, address, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <section className="card w-full max-w-xl p-7 md:p-8">
        <p className="brand-title text-center text-3xl text-[var(--color-dark-green)]">FarmDirect</p>
        <h1 className="display-title mt-3 text-center text-3xl">Create account</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">First name</label>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="control w-full px-3 py-2" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Last name</label>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="control w-full px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="control w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+233"
              className="control w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Delivery address</label>
            <input value={address} onChange={(event) => setAddress(event.target.value)} className="control w-full px-3 py-2" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="control w-full px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-60">
            {saving ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
          Already have an account? <Link href="/login" className="font-semibold text-[var(--color-primary-green)]">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
