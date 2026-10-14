import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Lock, Sparkles, Bell, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { getPharmacyId } from '../config/development';
import NewOrderRingModal, { RingAlertData } from '../components/layout/NewOrderRingModal';

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
    if (path.includes('prescriptions')) return { title: 'Prescriptions', subtitle: 'Manage customer uploaded prescriptions.' };
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
  const [ringAlert, setRingAlert] = useState<RingAlertData | null>(null);
  const navigate = useNavigate();

  const getActualPharmacyId = () => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const p = JSON.parse(localData);
        if (p.id) return p.id;
      }
    } catch (e) {}
    return getPharmacyId();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await PharmacyService.getPharmacyProfile(getActualPharmacyId());
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch pharmacy profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Global Socket for Notifications
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://api.davasetu.com';
    const socket = io(socketUrl);
    socket.on('connect', () => {
      socket.emit('join_pharmacy', getActualPharmacyId().toString());
    });

    const triggerRingAlert = (data: { title: string; message: string; type: 'REQUEST' | 'PRESCRIPTION' | 'ORDER'; customerName?: string; medicineName?: string; id?: any }) => {
      setRingAlert({
        title: data.title,
        message: data.message,
        type: data.type,
        customerName: data.customerName,
        medicineName: data.medicineName,
        id: data.id,
        timestamp: new Date()
      });

      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    };

    socket.on('new_request', (newReq: any) => {
      const isPrescription = newReq.isPrescription || !newReq.medicineName;
      const title = isPrescription ? 'New Prescription Received!' : 'New Customer Order/Request!';
      const message = newReq.medicineName ? `Medicine: ${newReq.medicineName}` : 'A customer uploaded a new prescription.';

      triggerRingAlert({
        title,
        message,
        type: isPrescription ? 'PRESCRIPTION' : 'REQUEST',
        customerName: newReq.customerName || 'Mobile App Customer',
        medicineName: newReq.medicineName,
        id: newReq.id
      });
      
      const event = new CustomEvent('app_notification', {
        detail: {
          title: title,
          message: message,
          type: isPrescription ? 'prescription' : 'request'
        }
      });
      window.dispatchEvent(event);
    });

    socket.on('new_prescription', (presc: any) => {
      triggerRingAlert({
        title: 'New Prescription Uploaded!',
        message: 'A patient sent a new prescription slip.',
        type: 'PRESCRIPTION',
        customerName: 'Mobile Patient',
        id: presc.id
      });
    });

    socket.on('new_pharmacy_notification', (notif: any) => {
      if (notif.type === 'MEDICINE_REQUEST_CREATED' || notif.type === 'CUSTOMER_CONFIRMATION_RECEIVED') {
        triggerRingAlert({
          title: notif.title || 'New Order Alert!',
          message: notif.message,
          type: 'REQUEST',
          id: notif.reference_id
        });
      } else {
        setNotification({ title: notif.title, message: notif.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      const event = new CustomEvent('new_pharmacy_notification');
      window.dispatchEvent(event);
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
  const isBillingPage = path.includes('billing');

  const showLockScreen = isLocked && isRestrictedRoute;

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header pageTitle={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5 lg:px-6 pb-24 md:pb-6 relative">
          <div className="w-full transition-all duration-300">
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

      {/* Mobile Bottom Navigation Bar (Phones & Tablets < 768px) */}
      <MobileBottomNav />

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
      {/* Global New Order Ring Alert Modal */}
      <NewOrderRingModal alert={ringAlert} onDismiss={() => setRingAlert(null)} />
    </div>
  );
}
