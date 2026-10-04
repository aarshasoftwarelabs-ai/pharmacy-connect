import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  Briefcase
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Medicine Requests', href: '/medicine-requests', icon: Inbox },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Smart Inventory', href: '/inventory', icon: Package },

  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Wholesale (B2B)', href: '/wholesale', icon: Briefcase },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Pharmacy Profile', href: '/pharmacy-profile', icon: Store },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full">
      <div className="h-20 flex items-center px-6 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-start w-full">
          <img src="./davasetu_logo.png" alt="DavaSetu" className="h-16 w-auto object-contain object-left" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto flex flex-col justify-between">
        <nav className="py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const role = user.role || 'OWNER'; // Default to OWNER for legacy sessions
            const perms = user.permissions || [];
            
            // Permission filtering logic
            if (role === 'STAFF') {
              if (item.name === 'Medicine Requests' && !perms.includes('MEDICINE_REQUESTS')) return null;
              if (item.name === 'Billing' && !perms.includes('BILLING')) return null;
              if (item.name === 'Smart Inventory' && !perms.includes('MEDICINE_CATALOGUE')) return null;
              if (item.name === 'Wholesale (B2B)' && !perms.includes('WHOLESALE')) return null;
              if (item.name === 'Reports' && !perms.includes('REPORTS')) return null;
              if (item.name === 'Pharmacy Profile' && !perms.includes('PHARMACY_SETTINGS')) return null;
            }

            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-pharmacy-50 text-pharmacy-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-pharmacy-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200 space-y-1">
          {(JSON.parse(localStorage.getItem('user') || '{}').role || 'OWNER') === 'OWNER' && (
            <Link to="/settings" className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <Settings className="mr-3 h-5 w-5 text-slate-400" />
              Settings
            </Link>
          )}
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-red-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900 bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
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
        </div>
      )}
    </aside>
  );
}
