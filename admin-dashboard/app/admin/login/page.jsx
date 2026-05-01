"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../../../src/components/Input";
import Button from "../../../src/components/Button";
import { useAdminAuth } from "../../../src/context/AdminAuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost:3000";
  const { login, token, isAuthenticated, isHydrated } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated && token) {
      router.replace("/admin");
    }
  }, [isAuthenticated, isHydrated, token, router]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      router.replace("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form className="fd-card" style={{ width: "min(440px, 100%)", padding: 24 }} onSubmit={onSubmit}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="fd-title" style={{ fontSize: 40, color: "var(--fd-primary-dark)" }}>FarmDirect</div>
          <div className="fd-label" style={{ textTransform: "none" }}>Admin Portal</div>
        </div>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@farmdirect.com" />
        <div style={{ height: 14 }} />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        {error && <div style={{ color: "var(--fd-danger)", marginTop: 12, fontSize: 14 }}>{error}</div>}
        <Button type="submit" className="fd-btn-primary" style={{ width: "100%", marginTop: 18 }} disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        <a href={mainAppUrl} style={{ display: "inline-block", marginTop: 14, fontSize: 14, color: "var(--fd-primary-dark)" }}>
          Back to FarmDirect storefront
        </a>
      </form>
    </div>
  );
}
