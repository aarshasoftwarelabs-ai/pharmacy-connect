import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MedicineRequests from './pages/MedicineRequests';
import Orders from './pages/Orders';

import Customers from './pages/Customers';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import PharmacyProfile from './pages/PharmacyProfile';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import Inventory from './pages/Inventory';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Wholesale from './pages/Wholesale';
import WholesaleBilling from './pages/WholesaleBilling';
import WholesaleInventory from './pages/WholesaleInventory';
import Staff from './pages/Staff';
import Marketing from './pages/Marketing';
import WholesaleDelivery from './pages/WholesaleDelivery';

import WholesaleLayout from './layouts/WholesaleLayout';
import { AuthProvider, useAuth } from './components/auth/AuthContext';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const PermissionRoute = ({ permissionKey, children }: { permissionKey: string, children: React.ReactNode }) => {
  const { loading, hasPermission } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!hasPermission(permissionKey)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* RETAIL ROUTES */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<PermissionRoute permissionKey="DASHBOARD_VIEW"><Dashboard /></PermissionRoute>} />
              <Route path="medicine-requests" element={<PermissionRoute permissionKey="MEDICINE_REQUESTS_VIEW"><MedicineRequests /></PermissionRoute>} />
              <Route path="orders" element={<PermissionRoute permissionKey="MEDICINE_REQUESTS_VIEW"><Orders /></PermissionRoute>} />
              <Route path="inventory" element={<PermissionRoute permissionKey="INVENTORY_VIEW"><Inventory /></PermissionRoute>} />
              <Route path="customers" element={<PermissionRoute permissionKey="CUSTOMERS_VIEW"><Customers /></PermissionRoute>} />
              <Route path="prescriptions" element={<PermissionRoute permissionKey="PRESCRIPTIONS_VIEW"><Prescriptions /></PermissionRoute>} />
              <Route path="suppliers" element={<PermissionRoute permissionKey="SUPPLIERS_VIEW"><Suppliers /></PermissionRoute>} />
              <Route path="purchases" element={<PermissionRoute permissionKey="PURCHASES_VIEW"><Purchases /></PermissionRoute>} />
              <Route path="billing" element={<PermissionRoute permissionKey="BILLING_VIEW"><Billing /></PermissionRoute>} />
              <Route path="reports" element={<PermissionRoute permissionKey="REPORTS_VIEW"><Reports /></PermissionRoute>} />
              <Route path="pharmacy-profile" element={<PermissionRoute permissionKey="PHARMACY_PROFILE_VIEW"><PharmacyProfile /></PermissionRoute>} />
              <Route path="settings" element={<PermissionRoute permissionKey="SETTINGS_VIEW"><Settings /></PermissionRoute>} />
              <Route path="help-support" element={<PermissionRoute permissionKey="DASHBOARD_VIEW"><HelpSupport /></PermissionRoute>} />
            </Route>
            

            {/* WHOLESALE ROUTES */}
            <Route path="/" element={<WholesaleLayout />}>
              <Route path="wholesale-dashboard" element={<PermissionRoute permissionKey="WHOLESALE_VIEW"><Wholesale /></PermissionRoute>} />
              <Route path="wholesale-inventory" element={<PermissionRoute permissionKey="WHOLESALE_VIEW"><WholesaleInventory /></PermissionRoute>} />
              <Route path="wholesale-billing" element={<PermissionRoute permissionKey="WHOLESALE_VIEW"><WholesaleBilling /></PermissionRoute>} />
              <Route path="wholesale-marketing" element={<PermissionRoute permissionKey="WHOLESALE_VIEW"><Marketing /></PermissionRoute>} />
              <Route path="wholesale-delivery" element={<PermissionRoute permissionKey="WHOLESALE_VIEW"><WholesaleDelivery /></PermissionRoute>} />
              <Route path="wholesale-staff" element={<PermissionRoute permissionKey="STAFF_VIEW"><Staff /></PermissionRoute>} />
              <Route path="wholesale-profile" element={<PermissionRoute permissionKey="PHARMACY_PROFILE_VIEW"><PharmacyProfile /></PermissionRoute>} />
              <Route path="wholesale-settings" element={<PermissionRoute permissionKey="SETTINGS_VIEW"><Settings /></PermissionRoute>} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
