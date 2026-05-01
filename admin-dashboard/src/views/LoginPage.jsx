"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      const message = String(err?.message || "Login failed");
      setError(
        message.includes("failed to fetch")
          ? "Unable to reach the backend. Start the backend server or enable NEXT_PUBLIC_USE_MOCK_API=true for local mock login."
          : message
      );
    } finally {
      setLoading(false);
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
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" />
        {error && <div style={{ color: "var(--fd-danger)", marginTop: 12, fontSize: 14 }}>{error}</div>}
        <Button type="submit" className="fd-btn-primary" style={{ width: "100%", marginTop: 18 }} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
