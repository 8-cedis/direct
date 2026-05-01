import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, adminUser } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && adminUser && !allowedRoles.includes(adminUser.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
