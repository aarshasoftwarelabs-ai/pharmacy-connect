import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  Briefcase,
  Store,
  LogOut,
  Settings,
  AlertTriangle,
  Building2,
  Users,
  FileText
} from 'lucide-react';

const navigation = [
  { name: 'B2B Operations', href: '/wholesale-dashboard', icon: Briefcase },
  { name: 'B2B Billing', href: '/wholesale-billing', icon: FileText },
  { name: 'My Profile', href: '/wholesale-profile', icon: Store },
];

export default function WholesaleSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pharmacy_profile_data');
    localStorage.removeItem('business_type');
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 flex-col hidden md:flex h-full">
      <div className="h-20 flex items-center px-6 border-b border-slate-800 flex-shrink-0 bg-slate-950">
        <div className="flex items-center justify-start w-full">
          <Building2 className="w-8 h-8 text-indigo-400 mr-2" />
          <span className="font-bold text-xl tracking-wide">DavaSetu <span className="text-indigo-400 text-sm align-top">B2B</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto flex flex-col justify-between">
        <nav className="py-6 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-100' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/wholesale-settings" className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="mr-3 h-5 w-5 text-slate-500" />
            Settings
          </Link>
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-red-500/70" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Sign Out</h3>
              <p className="text-center text-slate-500 text-sm mb-6">Are you sure you want to log out of wholesale portal?</p>
              
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
