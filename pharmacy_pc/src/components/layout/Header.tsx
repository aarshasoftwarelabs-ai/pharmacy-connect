import { useState, useEffect, useRef } from 'react';
import { Bell, UserCircle, ChevronDown, Menu, ShoppingCart, Pill, Info, CheckCircle2 } from 'lucide-react';
import { PharmacyService } from '../../services/pharmacyService';
import { DEV_PHARMACY_ID } from '../../config/development';

interface HeaderProps {
  pageTitle: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'request' | 'system';
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'welcome',
    title: 'Welcome to DavaSetu',
    message: 'Your pharmacy dashboard is ready. Live orders will appear here.',
    time: 'Just now',
    read: false,
    type: 'system'
  }
];

export default function Header({ pageTitle, subtitle }: HeaderProps) {
  const [pharmacyName, setPharmacyName] = useState('Loading...');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load pharmacy name & notifications
  useEffect(() => {
    // Pharmacy Name
    PharmacyService.getPharmacyProfile(DEV_PHARMACY_ID)
      .then(profile => {
        let name = profile?.name || 'DavaSetu Pharmacy';
        const localData = localStorage.getItem('pharmacy_profile_data');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed.name) name = parsed.name;
          } catch(e) {}
        }
        setPharmacyName(name);
      })
      .catch(() => setPharmacyName('DavaSetu Admin'));

    // Notifications logic
    const savedNotifications = localStorage.getItem('pharmacy_notifications_v2');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem('pharmacy_notifications_v2', JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    // Listen to real-time events from DashboardLayout
    const handleAppNotification = (e: any) => {
      const newNotif: Notification = {
        id: Date.now().toString(),
        title: e.detail.title,
        message: e.detail.message,
        time: 'Just now',
        read: false,
        type: e.detail.type
      };
      
      setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 50); // Keep max 50
        localStorage.setItem('pharmacy_notifications_v2', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('app_notification', handleAppNotification);

    return () => {
      window.removeEventListener('app_notification', handleAppNotification);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowNotifications(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 150);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('pharmacy_notifications_v2', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('pharmacy_notifications_v2', JSON.stringify(updated));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'request': return <Pill className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-50 relative">
      <div className="flex items-center">
        <button className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        
        {/* Notification Bell */}
        <div 
          className="relative" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors relative focus:outline-none"
          >
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
            )}
            <Bell className="h-5 w-5" />
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full pt-2 z-50">
              <div className="w-80 bg-white rounded-xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-pharmacy-600 hover:text-pharmacy-700 flex items-center"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">No notifications yet.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notif.read ? 'bg-slate-50/50' : 'opacity-70'}`}
                      >
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'order' ? 'bg-blue-100' : 
                          notif.type === 'request' ? 'bg-emerald-100' : 'bg-amber-100'
                        }`}>
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm truncate ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-pharmacy-500 flex-shrink-0 mt-1.5"></span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        
        <button className="flex items-center space-x-3 text-left hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <div className="h-8 w-8 rounded-full bg-pharmacy-100 flex items-center justify-center text-pharmacy-700">
            <UserCircle className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{pharmacyName}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
