"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    login({ email, password });
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <section className="card w-full max-w-md p-7 md:p-8">
        <p className="brand-title text-center text-3xl text-[var(--color-dark-green)]">FarmDirect</p>
        <h1 className="display-title mt-3 text-center text-3xl">Sign in</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <label className="mb-1.5 block text-sm font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="control w-full px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" className="btn-primary w-full px-4 py-3 text-sm font-semibold">
            Sign in
          </button>

          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-black/15" />
            <span className="text-xs text-[var(--color-muted)]">or</span>
            <span className="h-px flex-1 bg-black/15" />
          </div>

          <button type="button" className="btn-secondary w-full px-4 py-3 text-sm font-semibold">
            Continue with Google
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="#" className="text-[var(--color-muted)] hover:text-[var(--color-primary-green)]">
            Forgot password?
          </Link>
          <Link href="/register" className="font-semibold text-[var(--color-primary-green)]">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
