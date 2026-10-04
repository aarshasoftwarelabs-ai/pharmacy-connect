import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MedicineRequests from './pages/MedicineRequests';
import Orders from './pages/Orders';

import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import PharmacyProfile from './pages/PharmacyProfile';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Wholesale from './pages/Wholesale';
import WholesaleBilling from './pages/WholesaleBilling';
import Staff from './pages/Staff';
import Marketing from './pages/Marketing';

import WholesaleLayout from './layouts/WholesaleLayout';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* RETAIL ROUTES */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="medicine-requests" element={<MedicineRequests />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="staff" element={<Staff />} />
            {/* Wholesale features removed from retail and moved to Wholesale routes */}
            <Route path="billing" element={<Billing />} />
            <Route path="reports" element={<Reports />} />
            <Route path="pharmacy-profile" element={<PharmacyProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* WHOLESALE ROUTES */}
          <Route path="/" element={<WholesaleLayout />}>
            <Route path="wholesale-dashboard" element={<Wholesale />} />
            <Route path="wholesale-billing" element={<WholesaleBilling />} />
            <Route path="wholesale-profile" element={<PharmacyProfile />} />
            <Route path="wholesale-settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
