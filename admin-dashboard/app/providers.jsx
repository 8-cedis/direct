"use client";

import { useEffect } from "react";
import { AdminAuthProvider } from "../src/context/AdminAuthContext";
import { installMockApi } from "../src/services/mockApi";

export default function Providers({ children }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      installMockApi();
    }
  }, []);

  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
