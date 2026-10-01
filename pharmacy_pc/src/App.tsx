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
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="medicine-requests" element={<MedicineRequests />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />

            <Route path="customers" element={<Customers />} />
            <Route path="billing" element={<Billing />} />
            <Route path="reports" element={<Reports />} />
            <Route path="pharmacy-profile" element={<PharmacyProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
