import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import WholesaleSidebar from '../components/layout/WholesaleSidebar';
import Header from '../components/layout/Header';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Lock, Sparkles, Bell, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { getPharmacyId } from '../config/development';
import NewOrderRingModal, { RingAlertData } from '../components/layout/NewOrderRingModal';

export default function WholesaleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('wholesale-dashboard')) return { title: 'B2B Wholesale Operations', subtitle: 'Manage your bulk distribution, clients, and ledgers.' };
    if (path.includes('pharmacy-profile')) return { title: 'Business Profile', subtitle: 'Manage your wholesale business settings.' };
    if (path.includes('settings')) return { title: 'Settings', subtitle: 'Manage your preferences.' };
    return { title: 'Wholesale Portal', subtitle: '' };
  };

  const { title, subtitle } = getPageTitle();

  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  const [ringAlert, setRingAlert] = useState<RingAlertData | null>(null);

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

    // Global Socket for Notifications & Incoming Orders
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

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden relative">
      <WholesaleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* We can reuse Header or create WholesaleHeader. Let's reuse Header */}
        <Header pageTitle={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-6 relative bg-slate-100">
          <div className="w-full">
            {loading ? (
               <div className="flex justify-center items-center h-64">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
               </div>
            ) : (
              <Outlet context={{ profile }} />
            )}
          </div>
        </main>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className="absolute top-6 right-6 z-50 animate-bounce">
          <div className="bg-white border-l-4 border-indigo-600 rounded-lg shadow-2xl p-4 flex items-start max-w-sm">
            <div className="bg-indigo-100 p-2 rounded-full mr-3">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">{notification.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
              <button 
                onClick={() => {
                  setNotification(null);
                  navigate('/medicine-requests');
                }}
                className="text-xs font-bold text-indigo-600 mt-2 hover:underline"
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

