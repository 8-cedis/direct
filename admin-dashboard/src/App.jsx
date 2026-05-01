import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./views/LoginPage";
import DashboardPage from "./views/DashboardPage";
import OrdersPage from "./views/OrdersPage";
import CustomersPage from "./views/CustomersPage";
import ProductsPage from "./views/ProductsPage";
import FarmersPage from "./views/FarmersPage";
import InventoryPage from "./views/InventoryPage";
import DriversPage from "./views/DriversPage";
import DeliverySlotsPage from "./views/DeliverySlotsPage";
import FinancePage from "./views/FinancePage";
import RefundsPage from "./views/RefundsPage";
import FarmerPayoutsPage from "./views/FarmerPayoutsPage";
import CampaignsPage from "./views/CampaignsPage";
import SupportTicketsPage from "./views/SupportTicketsPage";
import ReportsPage from "./views/ReportsPage";
import StaffManagementPage from "./views/StaffManagementPage";
import SettingsPage from "./views/SettingsPage";
import DriverDeliveriesPage from "./views/DriverDeliveriesPage";

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/customers" element={<CustomersPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/farmers" element={<FarmersPage />} />
            <Route path="/admin/inventory" element={<InventoryPage />} />
            <Route path="/admin/drivers" element={<DriversPage />} />
            <Route path="/admin/delivery-slots" element={<DeliverySlotsPage />} />
            <Route path="/admin/finance" element={<FinancePage />} />
            <Route path="/admin/refunds" element={<RefundsPage />} />
            <Route path="/admin/farmer-payouts" element={<FarmerPayoutsPage />} />
            <Route path="/admin/campaigns" element={<CampaignsPage />} />
            <Route path="/admin/support-tickets" element={<SupportTicketsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/staff" element={<StaffManagementPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/driver-deliveries" element={<DriverDeliveriesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
