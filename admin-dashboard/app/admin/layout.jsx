"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "../../src/context/AdminAuthContext";

const allItems = [
  { label: "Dashboard", path: "/admin", icon: "◧", roles: ["admin", "warehouse staff", "finance staff", "driver"] },
  { label: "Orders", path: "/admin/orders", icon: "▣", roles: ["admin", "warehouse staff", "finance staff"] },
  { label: "Customers", path: "/admin/customers", icon: "◉", roles: ["admin"] },
  { label: "Products", path: "/admin/products", icon: "❖", roles: ["admin"] },
  { label: "Farmers", path: "/admin/farmers", icon: "⟡", roles: ["admin", "warehouse staff"] },
  { label: "Inventory", path: "/admin/inventory", icon: "▤", roles: ["admin", "warehouse staff"] },
  { label: "Drivers", path: "/admin/drivers", icon: "➜", roles: ["admin", "warehouse staff"] },
  { label: "Delivery Slots", path: "/admin/delivery-slots", icon: "◫", roles: ["admin"] },
  { label: "Finance", path: "/admin/finance", icon: "₵", roles: ["admin", "finance staff"] },
  { label: "Refunds", path: "/admin/refunds", icon: "↺", roles: ["admin", "finance staff"] },
  { label: "Farmer Payouts", path: "/admin/farmer-payouts", icon: "₮", roles: ["admin", "finance staff"] },
  { label: "Campaigns", path: "/admin/campaigns", icon: "✉", roles: ["admin"] },
  { label: "CRM", path: "/admin/crm", icon: "✎", roles: ["admin", "finance staff"] },
  { label: "Support Tickets", path: "/admin/support-tickets", icon: "?", roles: ["admin"] },
  { label: "Reports", path: "/admin/reports", icon: "≡", roles: ["admin", "finance staff"] },
  { label: "Staff Management", path: "/admin/staff", icon: "☰", roles: ["admin"] },
  { label: "Settings", path: "/admin/settings", icon: "⚙", roles: ["admin"] },
  { label: "Driver Deliveries", path: "/admin/driver-deliveries", icon: "🚚", roles: ["driver"] },
];

export default function AdminLayout({ children }) {
  const { token, adminUser, isAuthenticated, isHydrated, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleItems = useMemo(
    () => allItems.filter((item) => item.roles.includes(adminUser?.role || "admin")),
    [adminUser]
  );
  const currentLabel = visibleItems.find((item) => item.path === pathname)?.label || "Dashboard";

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !token) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isHydrated, token, router]);

  if (!isHydrated) {
    return null;
  }

  return (
    <div className="fd-shell">
      {sidebarOpen && <div className="fd-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fd-sidebar ${sidebarOpen ? "fd-sidebar-open" : ""}`}>
        <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="fd-title" style={{ fontSize: 28 }}>FarmDirect</div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 4 }}>Admin Portal</div>
          <button className="fd-btn fd-sidebar-mobile-close" style={{ marginTop: 16 }} onClick={() => setSidebarOpen(false)}>Close menu</button>
        </div>
        <nav style={{ padding: 12, display: "grid", gap: 8 }}>
          {visibleItems.map((item) => (
            <Link key={item.path} href={item.path} className={`fd-btn ${pathname === item.path ? "fd-chip-active" : ""}`} style={{ justifyContent: "flex-start" }} onClick={() => setSidebarOpen(false)}>
              <span style={{ width: 22, display: "inline-flex", justifyContent: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="fd-main">
        <header className="fd-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="fd-btn fd-mobile-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <div className="fd-label">{currentLabel}</div>
              <h1 className="fd-title" style={{ margin: 0, fontSize: 26 }}>{currentLabel}</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="fd-btn" aria-label="Notifications">🔔 <span className="fd-badge fd-badge-danger" style={{ padding: "2px 8px" }}>12</span></button>
            <div style={{ fontWeight: 600 }}>{adminUser?.name}</div>
            <button className="fd-btn" onClick={() => { logout(); router.replace("/admin/login"); }}>Logout</button>
          </div>
        </header>
        <div className="fd-page">{children}</div>
      </main>
    </div>
  );
}
