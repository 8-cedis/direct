"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const ADMIN_TOKEN_KEY = "farmdirect_admin_token";
const ADMIN_USER_KEY = "farmdirect_admin_user";
const ALLOWED_ADMIN_ROLES = new Set(["admin", "warehouse staff", "finance staff", "driver"]);
const USE_MOCK_AUTH = true;
const AUTO_FALLBACK_TO_MOCK = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DISABLE_MOCK_FALLBACK !== "true";

const mockAdminUsers = [
  { email: "admin@farmdirect.com", password: "admin123", name: "Ama Mensah", role: "admin" },
  { email: "warehouse@farmdirect.com", password: "admin123", name: "Kojo Boateng", role: "warehouse staff" },
  { email: "finance@farmdirect.com", password: "admin123", name: "Efua Agyeman", role: "finance staff" },
  { email: "driver@farmdirect.com", password: "admin123", name: "Yaw Osei", role: "driver" },
];

const readStorage = (key) => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
};

const shouldFallbackToMockLogin = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("network") || message.includes("cors");
};

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [adminUser, setAdminUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = readStorage(ADMIN_TOKEN_KEY) || "";
    const storedUser = readStorage(ADMIN_USER_KEY);

    setToken(storedToken);
    setAdminUser(storedUser ? JSON.parse(storedUser) : null);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  }, [token, isHydrated]);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    if (adminUser) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    else localStorage.removeItem(ADMIN_USER_KEY);
  }, [adminUser, isHydrated]);

  const loginWithMock = (email, password) => {
    const found = mockAdminUsers.find((user) => user.email === email && user.password === password);
    if (!found) {
      throw new Error("Invalid admin credentials. Use admin@farmdirect.com / admin123.");
    }

    const nextToken = `fd-admin-${Date.now()}`;
    const safeUser = { name: found.name, email: found.email, role: found.role };
    setToken(nextToken);
    setAdminUser(safeUser);
    return safeUser;
  };

  const login = async (email, password) => {
    if (USE_MOCK_AUTH) {
      return loginWithMock(email, password);
    }

    let payload;
    try {
      payload = await api.post("/login", { email, password });
    } catch (error) {
      if (AUTO_FALLBACK_TO_MOCK && shouldFallbackToMockLogin(error)) {
        return loginWithMock(email, password);
      }
      throw error;
    }

    const user = payload?.user;
    const tokenFromApi = payload?.token;

    if (!tokenFromApi || !user) {
      throw new Error("Invalid login response from server.");
    }

    const role = (user.role || "").toLowerCase();
    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      throw new Error("You do not have admin portal access.");
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    };

    setToken(tokenFromApi);
    setAdminUser(safeUser);
    return safeUser;
  };

  const logout = () => {
    setToken("");
    setAdminUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      adminUser,
      isHydrated,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, adminUser, isHydrated]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
};

export const mockAdminRoleMenu = {
  admin: ["Dashboard", "Orders", "Customers", "Products", "Farmers", "Inventory", "Drivers", "Delivery Slots", "Finance", "Refunds", "Farmer Payouts", "Campaigns", "Support Tickets", "Reports", "Staff Management", "Settings"],
  "warehouse staff": ["Dashboard", "Orders", "Inventory", "Farmers", "Drivers"],
  "finance staff": ["Dashboard", "Finance", "Refunds", "Farmer Payouts", "Reports"],
  driver: ["Dashboard", "Driver Deliveries"],
};
