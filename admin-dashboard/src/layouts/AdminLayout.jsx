import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth, mockAdminRoleMenu } from "../context/AdminAuthContext";

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
  { label: "Support Tickets", path: "/admin/support-tickets", icon: "?", roles: ["admin"] },
  { label: "Reports", path: "/admin/reports", icon: "≡", roles: ["admin", "finance staff"] },
  { label: "Staff Management", path: "/admin/staff", icon: "☰", roles: ["admin"] },
  { label: "Settings", path: "/admin/settings", icon: "⚙", roles: ["admin"] },
  { label: "Driver Deliveries", path: "/admin/driver-deliveries", icon: "🚚", roles: ["driver"] },
];

export default function AdminLayout() {
  const { adminUser, logout } = useAdminAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleItems = useMemo(() => allItems.filter((item) => item.roles.includes(adminUser?.role || "admin")), [adminUser]);
  const currentLabel = visibleItems.find((item) => location.pathname === item.path)?.label || "Dashboard";

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
            <NavLink key={item.path} to={item.path} end={item.path === "/admin"} className={({ isActive }) => `fd-btn ${isActive ? "fd-chip-active" : ""}`} style={{ justifyContent: "flex-start" }} onClick={() => setSidebarOpen(false)}>
              <span style={{ width: 22, display: "inline-flex", justifyContent: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
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
            <button className="fd-btn" onClick={logout}>Logout</button>
          </div>
        </header>
        <div className="fd-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
