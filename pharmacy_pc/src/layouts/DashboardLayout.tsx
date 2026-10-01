import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Lock, Sparkles, Bell, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { DEV_PHARMACY_ID } from '../config/development';

export default function DashboardLayout() {
  const location = useLocation();
  
  // Very basic title mapping based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return { title: 'Dashboard', subtitle: 'Manage your pharmacy operations from one place.' };
    if (path.includes('medicine-requests')) return { title: 'Medicine Requests', subtitle: 'Review and respond to customer requests.' };
    if (path.includes('orders')) return { title: 'Orders', subtitle: 'Manage and track customer orders.' };
    if (path.includes('inventory')) return { title: 'Smart Inventory', subtitle: 'AI-powered insights to optimize your pharmacy inventory.' };
    if (path.includes('medicines')) return { title: 'Medicine Catalogue', subtitle: 'Manage your medicine inventory and pricing.' };
    if (path.includes('inventory')) return { title: 'Inventory', subtitle: 'Track stock levels and updates.' };
    if (path.includes('customers')) return { title: 'Customers', subtitle: 'View customer information and history.' };
    if (path.includes('billing')) return { title: 'Billing', subtitle: 'Generate and manage invoices.' };
    if (path.includes('reports')) return { title: 'Reports', subtitle: 'View sales and order reports.' };
    if (path.includes('pharmacy-profile')) return { title: 'Pharmacy Profile', subtitle: 'Manage your business settings.' };
    if (path.includes('settings')) return { title: 'Settings', subtitle: 'Manage your preferences and configurations.' };
    return { title: 'DavaSetu', subtitle: '' };
  };

  const { title, subtitle } = getPageTitle();

  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const navigate = useNavigate();

  const getActualPharmacyId = () => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const p = JSON.parse(localData);
        if (p.id) return p.id;
      }
    } catch (e) {}
    return DEV_PHARMACY_ID;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await PharmacyService.getPharmacyProfile(1); // Using 1 for DEV
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch pharmacy profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Global Socket for Notifications
    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      socket.emit('join_pharmacy', getActualPharmacyId().toString());
    });

    socket.on('new_request', (newReq: any) => {
      // Show native browser notification if allowed
      if (Notification.permission === 'granted') {
        new Notification('New Medicine Request!', {
          body: newReq.medicineName ? `Request for: ${newReq.medicineName}` : 'New prescription image uploaded.',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      const title = 'New Order Received!';
      const message = newReq.medicineName ? `Customer requested: ${newReq.medicineName}` : 'New prescription image uploaded.';

      // Show custom in-app toast
      setNotification({ title, message });
      
      // Dispatch event to update Header dropdown
      const event = new CustomEvent('app_notification', {
        detail: {
          title: 'New Medicine Request',
          message: message,
          type: 'request'
        }
      });
      window.dispatchEvent(event);

      // Hide after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const isTrialExpired = () => {
    if (!profile || !profile.trialStartDate) return false;
    const trialStart = new Date(profile.trialStartDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - trialStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 15;
  };

  const planType = profile?.planType || 'FREE_TRIAL';
  const isLocked = isTrialExpired() && planType === 'FREE_TRIAL';

  const path = location.pathname;
  const isRestrictedRoute = path.includes('inventory') || path.includes('reports');

  const showLockScreen = isLocked && isRestrictedRoute;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            {loading ? (
               <div className="flex justify-center items-center h-64">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharmacy-600"></div>
               </div>
            ) : showLockScreen ? (
              <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Lock className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Feature Locked</h2>
                <p className="text-slate-600 mb-8">
                  Your 15-day free trial has expired. Upgrade your plan to unlock {title}, Smart Analytics, and unlimited billing.
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="bg-pharmacy-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pharmacy-500/30 hover:bg-pharmacy-700 transition-colors flex items-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Upgrade Plans
                </button>
              </div>
            ) : (
              <Outlet context={{ profile, isTrialExpired }} />
            )}
          </div>
        </main>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className="absolute top-6 right-6 z-50 animate-bounce">
          <div className="bg-white border-l-4 border-pharmacy-600 rounded-lg shadow-2xl p-4 flex items-start max-w-sm">
            <div className="bg-pharmacy-100 p-2 rounded-full mr-3">
              <Bell className="w-5 h-5 text-pharmacy-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">{notification.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
              <button 
                onClick={() => {
                  setNotification(null);
                  navigate('/medicine-requests');
                }}
                className="text-xs font-bold text-pharmacy-600 mt-2 hover:underline"
              >
                View Request
              </button>
            </div>
            <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
