import { useState, useEffect, useRef } from 'react';
import { Bell, UserCircle, ChevronDown, Menu, ShoppingCart, Pill, Info, CheckCircle2, PanelLeft, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { PharmacyService } from '../../services/pharmacyService';
import { NotificationService, Notification } from '../../services/notificationService';
import { getPharmacyId } from '../../config/development';
import { offlineSyncService } from '../../services/offlineSyncService';

interface HeaderProps {
  pageTitle: string;
  subtitle?: string;
}

export default function Header({ pageTitle, subtitle }: HeaderProps) {
  const [pharmacyName, setPharmacyName] = useState('My Pharmacy');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOfflineBills, setPendingOfflineBills] = useState(0);
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Read logged-in user details from local storage immediately
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.email) setUserEmail(u.email);
        if (u.name) setUserName(u.name);
        if (u.pharmacyName) setPharmacyName(u.pharmacyName);
      }
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.name) setPharmacyName(parsed.name);
      }
    } catch (e) {}

    // Pharmacy Profile sync from server if available
    const pharmId = getPharmacyId();
    if (pharmId) {
      PharmacyService.getPharmacyProfile(pharmId)
        .then(profile => {
          if (profile?.name) setPharmacyName(profile.name);
          if (profile?.email && !userEmail) setUserEmail(profile.email);
        })
        .catch(() => {});
    }

    // Fetch initial notifications
    fetchNotifications();

    // Listen to real-time events from DashboardLayout
    const handleAppNotification = (e: any) => {
      // Just re-fetch notifications when a real-time event hits
      fetchNotifications();
    };

    window.addEventListener('app_notification', handleAppNotification);
    window.addEventListener('new_pharmacy_notification', handleAppNotification);

    // Subscribe to Offline Sync Queue changes
    const unsubscribeSync = offlineSyncService.subscribe((count, online) => {
      setPendingOfflineBills(count);
      setIsOnlineState(online);
    });

    return () => {
      window.removeEventListener('app_notification', handleAppNotification);
      window.removeEventListener('new_pharmacy_notification', handleAppNotification);
      unsubscribeSync();
    };
  }, []);

  const fetchNotifications = async () => {
    const notifs = await NotificationService.getNotifications(50);
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.is_read).length);
  };

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

  const markAsRead = async (id: number) => {
    await NotificationService.markAsRead(id);
    const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.is_read).length);
  };

  const markAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    setUnreadCount(0);
  };

  const getIconForType = (type: string) => {
    if (type.includes('REQUEST')) return <Pill className="w-4 h-4 text-emerald-500" />;
    if (type.includes('BILL') || type.includes('PURCHASE')) return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    return <Info className="w-4 h-4 text-amber-500" />;
  };

  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('davasetu_toggle_sidebar'));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3.5 sm:px-6 flex-shrink-0 z-50 relative">
      <div className="flex items-center gap-2">
        {/* Desktop Sidebar Toggle */}
        <button 
          onClick={handleToggleSidebar}
          title="Toggle Sidebar (Ctrl+B)"
          className="hidden md:flex p-2 -ml-2 mr-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        {/* Mobile Hamburger / Navigation Menu Toggle */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('davasetu_open_mobile_menu'))}
          aria-label="Open Navigation Menu"
          title="Open Menu"
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-pharmacy-50 to-emerald-100 text-pharmacy-700 hover:bg-pharmacy-200 border border-pharmacy-200/80 shadow-xs active:scale-95 transition-all flex-shrink-0 focus:outline-none"
        >
          <Menu className="w-5 h-5 text-pharmacy-700" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">{pageTitle}</h1>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block truncate">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Dynamic Cloud / Offline Billing Sync Badge */}
        {!isOnlineState ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold shadow-sm">
            <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Offline Mode</span>
            {pendingOfflineBills > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px]">
                {pendingOfflineBills} queued
              </span>
            )}
          </div>
        ) : pendingOfflineBills > 0 ? (
          <button
            onClick={async () => {
              setIsManualSyncing(true);
              try {
                await offlineSyncService.syncQueue();
              } finally {
                setIsManualSyncing(false);
              }
            }}
            disabled={isManualSyncing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Click to sync offline bills to cloud database now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>Sync {pendingOfflineBills} Offline {pendingOfflineBills === 1 ? 'Bill' : 'Bills'}</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Synced</span>
          </div>
        )}
        
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
              <div className="w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-white rounded-xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
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
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-slate-50/50' : 'opacity-70'}`}
                      >
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notif.type.includes('BILL') ? 'bg-blue-100' : 
                          notif.type.includes('REQUEST') ? 'bg-emerald-100' : 'bg-amber-100'
                        }`}>
                          {getIconForType(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm truncate ${!notif.is_read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-pharmacy-500 flex-shrink-0 mt-1.5"></span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(notif.created_at).toLocaleString()}</p>
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
        
        <div className="flex items-center space-x-3 text-left p-1.5 rounded-xl border border-slate-200/60 bg-white/50">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pharmacy-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm uppercase">
            {userName ? userName.slice(0, 2) : <UserCircle className="h-5 w-5" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">{pharmacyName}</p>
            <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{userEmail || userName || 'Owner'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
