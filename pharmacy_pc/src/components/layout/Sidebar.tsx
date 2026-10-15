import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package,
  Users, 
  Receipt, 
  BarChart3, 
  Store, 
  LogOut, 
  Settings, 
  Inbox, 
  AlertTriangle, 
  HelpCircle,
  Building2,
  Truck,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  perm?: string;
  shortcut?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'DASHBOARD_VIEW' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, perm: 'MEDICINE_REQUESTS_VIEW' },
  { name: 'Smart Inventory', href: '/inventory', icon: Package, perm: 'INVENTORY_VIEW' },
  { name: 'Suppliers', href: '/suppliers', icon: Building2, perm: 'SUPPLIERS_VIEW' },
  { name: 'Purchases', href: '/purchases', icon: Truck, perm: 'PURCHASES_VIEW' },
  { name: 'Customers', href: '/customers', icon: Users, perm: 'CUSTOMERS_VIEW' },
  { name: 'Prescriptions', href: '/prescriptions', icon: FileText, perm: 'PRESCRIPTIONS_VIEW' },
  { name: 'Billing', href: '/billing', icon: Receipt, perm: 'BILLING_VIEW' },
  { name: 'Reports', href: '/reports', icon: BarChart3, perm: 'REPORTS_VIEW' },
  { name: 'Pharmacy Profile', href: '/pharmacy-profile', icon: Store, perm: 'PHARMACY_PROFILE_VIEW' },
  { name: 'Help & Support', href: '/help-support', icon: HelpCircle, perm: 'DASHBOARD_VIEW' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { hasPermission } = useAuth();

  // Collapsed state - persists across reloads
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('davasetu_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('davasetu_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    // Listen to custom toggle event (from Header or elsewhere)
    const handleToggleEvent = () => toggleCollapse();
    window.addEventListener('davasetu_toggle_sidebar', handleToggleEvent);

    // Keyboard shortcut: Ctrl + B or Cmd + B
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return; // Don't intercept while typing in inputs
        }
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('davasetu_toggle_sidebar', handleToggleEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <aside 
      className={`bg-white border-r border-slate-200/90 flex flex-col hidden md:flex h-full select-none transition-all duration-300 ease-in-out relative z-30 shadow-sm ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Top Header / Logo Bar (h-16 matches the Header height) */}
      <div className="h-16 flex items-center px-3.5 border-b border-slate-200 flex-shrink-0 bg-white justify-between">
        {isCollapsed ? (
          <button
            onClick={toggleCollapse}
            title="Expand Sidebar (Ctrl+B)"
            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl bg-gradient-to-br from-pharmacy-50 to-emerald-100 text-pharmacy-700 hover:bg-pharmacy-100 hover:shadow-sm border border-pharmacy-200/70 transition-all group relative focus:outline-none"
          >
            <Pill className="w-5 h-5 group-hover:hidden transition-all text-pharmacy-600" />
            <PanelLeftOpen className="w-5 h-5 hidden group-hover:block transition-all text-pharmacy-700" />
            
            {/* Tooltip */}
            <span className="absolute left-[78px] px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap flex items-center gap-1.5">
              <span>Expand Menu</span>
              <kbd className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+B</kbd>
            </span>
          </button>
        ) : (
          <>
            <div className="flex items-center min-w-0 pr-2">
              <img 
                src="./davasetu_logo.png" 
                alt="DavaSetu" 
                className="h-9 w-auto object-contain object-left cursor-pointer"
                onClick={() => navigate('/dashboard')}
              />
            </div>
            <button
              onClick={toggleCollapse}
              title="Collapse Sidebar (Ctrl+B)"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors flex-shrink-0 focus:outline-none"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar overflow-x-hidden flex flex-col justify-between py-3">
        <nav className={`space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navigation.map((item) => {
            if (item.perm && !hasPermission(item.perm)) return null;

            const isActive = location.pathname.startsWith(item.href);

            if (isCollapsed) {
              return (
                <div key={item.name} className="relative group flex justify-center">
                  <Link
                    to={item.href}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
                      isActive 
                        ? 'bg-pharmacy-600 text-white shadow-md shadow-pharmacy-600/30' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  </Link>

                  {/* Floating Tooltip */}
                  <div className="absolute left-[68px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-[70] whitespace-nowrap flex items-center gap-2">
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive 
                    ? 'bg-pharmacy-50 text-pharmacy-800 font-semibold shadow-sm border border-pharmacy-200/60' 
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-pharmacy-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-4 rounded-full bg-pharmacy-600"></span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Actions: Settings & Logout */}
        <div className={`pt-3 border-t border-slate-100 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {/* Settings */}
          {hasPermission('SETTINGS_VIEW') && (
            isCollapsed ? (
              <div className="relative group flex justify-center">
                <Link
                  to="/settings"
                  className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                    location.pathname.startsWith('/settings')
                      ? 'bg-pharmacy-600 text-white shadow-md shadow-pharmacy-600/30'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Settings className="h-5 w-5 flex-shrink-0 group-hover:rotate-45 transition-transform duration-200" />
                </Link>
                <div className="absolute left-[68px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[70] whitespace-nowrap">
                  Settings
                </div>
              </div>
            ) : (
              <Link 
                to="/settings" 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-pharmacy-50 text-pharmacy-800 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="mr-3 h-5 w-5 text-slate-400" />
                <span>Settings</span>
              </Link>
            )
          )}

          {/* Logout */}
          {isCollapsed ? (
            <div className="relative group flex justify-center">
              <button 
                onClick={() => setShowLogoutModal(true)} 
                className="w-11 h-11 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all focus:outline-none"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
              </button>
              <div className="absolute left-[68px] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-900 text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[70] whitespace-nowrap">
                Sign Out
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogoutModal(true)} 
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors focus:outline-none"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500 flex-shrink-0" />
              <span>Logout</span>
            </button>
          )}

          {/* Shortcut hint in expanded mode */}
          {!isCollapsed && (
            <div className="px-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Collapse bar</span>
              <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">Ctrl+B</kbd>
            </div>
          )}
        </div>
      </div>
      
      {/* Logout Confirmation Modal - Rendered via Portal at document.body to ensure full backdrop coverage */}
      {showLogoutModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogoutModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-100 relative z-10">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Sign Out</h3>
              <p className="text-center text-slate-500 text-sm mb-6">Are you sure you want to log out of your account?</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                >
                  Yes, Log Out
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}

