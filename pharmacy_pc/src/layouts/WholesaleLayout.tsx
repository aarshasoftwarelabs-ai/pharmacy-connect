import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import WholesaleSidebar from '../components/layout/WholesaleSidebar';
import Header from '../components/layout/Header';
import { PharmacyService, PharmacyProfile } from '../services/pharmacyService';
import { Lock, Sparkles, Bell, X } from 'lucide-react';
import { DEV_PHARMACY_ID } from '../config/development';

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
        const data = await PharmacyService.getPharmacyProfile(getActualPharmacyId());
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch pharmacy profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden relative">
      <WholesaleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* We can reuse Header or create WholesaleHeader. Let's reuse Header */}
        <Header pageTitle={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-slate-100">
          <div className="max-w-7xl mx-auto w-full">
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
    </div>
  );
}
