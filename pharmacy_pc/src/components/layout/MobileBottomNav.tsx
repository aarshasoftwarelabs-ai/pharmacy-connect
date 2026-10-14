import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Receipt, 
  ShoppingCart, 
  MoreHorizontal, 
  X, 
  Inbox, 
  FileText, 
  Building2, 
  Truck, 
  Users, 
  BarChart3, 
  Store, 
  Settings, 
  LogOut, 
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    setShowLogoutConfirm(false);
    setIsMoreOpen(false);
    navigate('/login');
  };

  const moreMenuItems = [
    { name: 'Medicine Requests', href: '/medicine-requests', icon: Inbox, perm: 'MEDICINE_REQUESTS_VIEW', badge: 'Live' },
    { name: 'Prescriptions', href: '/prescriptions', icon: FileText, perm: 'PRESCRIPTIONS_VIEW' },
    { name: 'Suppliers', href: '/suppliers', icon: Building2, perm: 'SUPPLIERS_VIEW' },
    { name: 'Purchases (Inward)', href: '/purchases', icon: Truck, perm: 'PURCHASES_VIEW' },
    { name: 'Customers & Patients', href: '/customers', icon: Users, perm: 'CUSTOMERS_VIEW' },
    { name: 'Reports & Tax Filing', href: '/reports', icon: BarChart3, perm: 'REPORTS_VIEW' },
    { name: 'Pharmacy Profile', href: '/pharmacy-profile', icon: Store, perm: 'PHARMACY_PROFILE_VIEW' },
    { name: 'Settings & Plans', href: '/settings', icon: Settings, perm: 'DASHBOARD_VIEW' },
    { name: 'Help & Support', href: '/help-support', icon: HelpCircle, perm: 'DASHBOARD_VIEW' },
  ];

  const filteredMoreItems = moreMenuItems.filter(item => !item.perm || hasPermission(item.perm));

  return (
    <>
      {/* Fixed Bottom Navigation Bar - Only visible on screens < md (Phones & Tablets) */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:hidden px-2 py-1.5 safe-area-pb"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto relative">
          
          {/* 1. Dashboard */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-pharmacy-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            <div className={`p-1 rounded-xl transition-all ${currentPath.includes('dashboard') ? 'bg-pharmacy-50 text-pharmacy-600' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Home</span>
          </NavLink>

          {/* 2. Smart Inventory */}
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-pharmacy-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            <div className={`p-1 rounded-xl transition-all ${currentPath.includes('inventory') ? 'bg-pharmacy-50 text-pharmacy-600' : ''}`}>
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Stock</span>
          </NavLink>

          {/* 3. CENTER ELEVATED ACTION BUTTON - FAST POS BILLING */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              onClick={() => navigate('/billing')}
              className="relative group focus:outline-none"
              title="Fast Mobile POS Billing"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pharmacy-700 via-pharmacy-600 to-emerald-400 text-white flex flex-col items-center justify-center shadow-lg shadow-pharmacy-600/40 active:scale-95 transition-all border-2 border-white ring-4 ring-pharmacy-100">
                <Receipt className="w-6 h-6 stroke-[2.2]" />
                <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">BILL</span>
              </div>
            </button>
          </div>

          {/* 4. Orders / Requests */}
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-pharmacy-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            <div className={`p-1 rounded-xl transition-all ${currentPath.includes('orders') ? 'bg-pharmacy-50 text-pharmacy-600' : ''}`}>
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Orders</span>
          </NavLink>

          {/* 5. More Menu Drawer Trigger */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl focus:outline-none ${
              isMoreOpen 
                ? 'text-pharmacy-600 font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isMoreOpen ? 'bg-pharmacy-50 text-pharmacy-600' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">More</span>
          </button>

        </div>
      </nav>

      {/* Slide-up "More" Drawer for Mobile Phone View */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Grabber handle & header */}
            <div className="pt-3 pb-2 px-5 flex items-center justify-between border-b border-slate-100">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
              <div className="flex items-center gap-2 mt-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pharmacy-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Pharmacy Apps & Tools</h3>
                  <p className="text-xs text-slate-500">Quick access to all medical store modules</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center mt-2 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules Grid / List */}
            <div className="overflow-y-auto p-4 space-y-1.5 custom-scrollbar pb-6">
              <div className="grid grid-cols-1 gap-1.5">
                {filteredMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.includes(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate(item.href);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${
                        isActive
                          ? 'bg-pharmacy-50 text-pharmacy-700 font-bold border border-pharmacy-200/80 shadow-sm'
                          : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isActive 
                            ? 'bg-pharmacy-600 text-white shadow-sm' 
                            : 'bg-white text-slate-600 border border-slate-200/70'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm">{item.name}</p>
                          {item.badge && (
                            <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-full mt-0.5">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-pharmacy-600' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-red-500 border border-red-200 flex items-center justify-center">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-sm">Sign Out of Mobile POS</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog for Mobile */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] md:hidden flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sign Out</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Are you sure you want to log out of your pharmacy store account on this phone?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md shadow-red-500/30"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
