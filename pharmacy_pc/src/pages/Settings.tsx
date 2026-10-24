import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PharmacyService } from '../services/pharmacyService';
import { PaymentService } from '../services/paymentService';
import { BillingService } from '../services/billingService';
import { testPrintThermalReceipt } from '../utils/printUtils';
import { 
  Bell, 
  Shield, 
  Smartphone, 
  Printer, 
  Volume2,
  CheckCircle2,
  Save,
  Crown,
  CreditCard,
  Sparkles,
  Check,
  Coffee,
  ShieldCheck,
  TrendingUp,
  HeartHandshake,
  Zap,
  RefreshCw,
  MessageSquare,
  History,
  Receipt,
  ChevronDown,
  FileText
} from 'lucide-react';

import StaffManagement from '../components/settings/StaffManagement';
import DistributorSettings from '../components/settings/DistributorSettings';
import { MessagingService, MessagingSettings, MessageLogItem } from '../services/messagingService';

interface SettingsState {
  acceptingOrders: boolean;
  open24Hours: boolean;
  pushNotifications: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
  soundEnabled: boolean;
  autoPrintReceipts: boolean;
  compactView: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  acceptingOrders: true,
  open24Hours: false,
  pushNotifications: true,
  emailAlerts: false,
  smsAlerts: true,
  soundEnabled: true,
  autoPrintReceipts: false,
  compactView: false,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    let init = { ...DEFAULT_SETTINGS };
    try {
      const saved = localStorage.getItem('pharmacy_app_settings');
      if (saved) {
        init = { ...init, ...JSON.parse(saved) };
      }
    } catch (_) {}
    const autoPrintSaved = localStorage.getItem('auto_print_receipt');
    if (autoPrintSaved !== null) {
      init.autoPrintReceipts = autoPrintSaved === 'true';
    }
    return init;
  });
  const [isSaved, setIsSaved] = useState(false);
  const [paidCount, setPaidCount] = useState<number>(0);
  const [isEarlyAdopter, setIsEarlyAdopter] = useState<boolean>(true); // default true before load
  const [spotsLeft, setSpotsLeft] = useState<number>(3);
  const [profile, setProfile] = useState<any>(null);

  // Hardware & POS Printer states
  const [installedPrinters, setInstalledPrinters] = useState<Array<{ name: string; displayName?: string; isDefault: boolean }>>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('selected_printer_name') || '');
  const [silentPrinting, setSilentPrinting] = useState<boolean>(localStorage.getItem('silent_printing_enabled') !== 'false');
  const [printFormat, setPrintFormat] = useState<string>(localStorage.getItem('default_printer_format') || 'THERMAL_80MM');
  const [isTestingPrint, setIsTestingPrint] = useState<boolean>(false);
  const [testPrintStatus, setTestPrintStatus] = useState<string | null>(null);
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [isRefreshingPrinters, setIsRefreshingPrinters] = useState<boolean>(false);

  const fetchPrinters = async () => {
    const hasElectron = typeof window !== 'undefined' && !!(window as any).ipcRenderer;
    setIsElectron(hasElectron);
    if (hasElectron) {
      setIsRefreshingPrinters(true);
      try {
        const printers = await (window as any).ipcRenderer.invoke('get-printers');
        if (Array.isArray(printers)) {
          setInstalledPrinters(printers);
          const savedPrinter = localStorage.getItem('selected_printer_name');
          if (!savedPrinter) {
            const def = printers.find((p: any) => p.isDefault);
            if (def) {
              setSelectedPrinter(def.name);
              localStorage.setItem('selected_printer_name', def.name);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load system printers:', err);
      } finally {
        setIsRefreshingPrinters(false);
      }
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    setTestPrintStatus('Printing live receipt slip...');
    try {
      let latestBill: any = null;
      try {
        let pId = 1;
        const localData = localStorage.getItem('pharmacy_profile_data');
        if (localData) {
          const p = JSON.parse(localData);
          if (p.id) pId = p.id;
        }
        const bills = await BillingService.getPharmacyBills(pId);
        if (bills && bills.length > 0) {
          latestBill = bills[0];
        }
      } catch (e) {
        console.warn('Could not fetch latest bill for print preview:', e);
      }

      const fmt = printFormat === 'THERMAL_58MM' ? '58MM' : (printFormat === 'A4' ? 'A4' : '80MM');
      const res = await testPrintThermalReceipt(fmt, latestBill);
      if (res?.success) {
        setTestPrintStatus(res.silent ? 'Receipt printed silently!' : 'Receipt printed!');
      } else {
        setTestPrintStatus('Print sent');
      }
    } catch (err: any) {
      setTestPrintStatus('Print error: ' + (err?.message || 'Check printer'));
    } finally {
      setIsTestingPrint(false);
      setTimeout(() => setTestPrintStatus(null), 4000);
    }
  };

  // Automated WhatsApp & SMS Messaging Gateway states
  const [msgSettings, setMsgSettings] = useState<MessagingSettings | null>(null);
  const [isLoadingMsg, setIsLoadingMsg] = useState<boolean>(false);
  const [msgLogs, setMsgLogs] = useState<MessageLogItem[]>([]);
  const [showLogsModal, setShowLogsModal] = useState<boolean>(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  const fetchMessagingSettings = async () => {
    setIsLoadingMsg(true);
    // Initial populate from localStorage for instant display
    const cached = localStorage.getItem('pharmacy_messaging_settings');
    if (cached) {
      try {
        setMsgSettings(JSON.parse(cached));
      } catch (_) {}
    }

    try {
      const data = await MessagingService.getSettings();
      if (data) {
        setMsgSettings(data);
        localStorage.setItem('pharmacy_messaging_settings', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not fetch remote messaging settings, using local cache:', err);
      if (!cached) {
        setMsgSettings({
          pharmacyId: 1,
          autoSendBillWhatsapp: true,
          gatewayProvider: 'SIMULATED',
          isActive: true
        });
      }
    } finally {
      setIsLoadingMsg(false);
    }
  };

  useEffect(() => {
    fetchMessagingSettings();
  }, []);

  const toggleAutoSendWhatsapp = async () => {
    const nextState = !(msgSettings?.isActive ?? true);
    const updated: MessagingSettings = {
      ...(msgSettings || { pharmacyId: 1 }),
      isActive: nextState,
      autoSendBillWhatsapp: nextState,
      gatewayProvider: 'SIMULATED'
    };
    setMsgSettings(updated);
    localStorage.setItem('pharmacy_messaging_settings', JSON.stringify(updated));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    try {
      await MessagingService.updateSettings(updated);
    } catch (e) {
      console.warn('Note on auto-saving messaging toggle:', e);
    }
  };

  const handleOpenLogs = async () => {
    setShowLogsModal(true);
    setIsLoadingLogs(true);
    try {
      const logs = await MessagingService.getLogs(30);
      setMsgLogs(logs);
    } catch (err) {
      console.warn('Failed to load message logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pharmacy_app_settings');
    const autoPrintSaved = localStorage.getItem('auto_print_receipt');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...DEFAULT_SETTINGS,
          ...parsed,
          autoPrintReceipts: autoPrintSaved !== null ? autoPrintSaved === 'true' : (parsed.autoPrintReceipts ?? prev.autoPrintReceipts)
        }));
      } catch (e) {
        console.error('Failed to parse settings');
      }
    } else if (autoPrintSaved !== null) {
      setSettings(prev => ({ ...prev, autoPrintReceipts: autoPrintSaved === 'true' }));
    }

    const fetchStats = async () => {
      try {
        const stats = await PharmacyService.getSubscriptionStats();
        const count = stats.paidCount;
        setPaidCount(count);
        setIsEarlyAdopter(count < 20);
        setSpotsLeft(Math.max(0, 20 - count));
      } catch (e) {
        console.error('Failed to load subscription stats');
      }
    };
    fetchStats();

    const fetchProfile = async () => {
      try {
        let pId = 1;
        const localData = localStorage.getItem('pharmacy_profile_data');
        if (localData) {
          const p = JSON.parse(localData);
          if (p.id) pId = p.id;
        }
        const data = await PharmacyService.getPharmacyProfile(pId);
        setProfile(data);
      } catch (e) {
        console.error('Failed to load pharmacy profile in settings', e);
      }
    };
    fetchProfile();
  }, []);

  // Handle setting toggle
  const toggleSetting = (key: keyof SettingsState) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    // Auto-save to localStorage
    localStorage.setItem('pharmacy_app_settings', JSON.stringify(newSettings));
    
    // Show saved indicator
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Dedicated robust toggle for auto print
  const handleToggleAutoPrint = () => {
    setSettings(prev => {
      const nextVal = !prev.autoPrintReceipts;
      const updated = { ...prev, autoPrintReceipts: nextVal };
      try {
        localStorage.setItem('pharmacy_app_settings', JSON.stringify(updated));
        localStorage.setItem('auto_print_receipt', String(nextVal));
      } catch (e) {
        console.error('Failed to save auto print setting:', e);
      }
      return updated;
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePaymentClick = (plan: 'Monthly' | 'Yearly' | 'Lifetime') => {
    let finalAmount = 0;
    let planName = '';
    
    if (plan === 'Monthly') {
      planName = 'Monthly Pro';
      finalAmount = isEarlyAdopter ? 759 : 799;
    } else if (plan === 'Yearly') {
      planName = 'Yearly Premium';
      finalAmount = isEarlyAdopter ? 5699 : 5999;
    } else if (plan === 'Lifetime') {
      planName = 'Founder Lifetime';
      finalAmount = isEarlyAdopter ? 23749 : 24999;
    }
    
    handlePayment(finalAmount, planName);
  };

  const handlePayment = async (amount: number, planName: string) => {
    try {
      // 1. Create order on the server
      const orderData = await PaymentService.createOrder(amount, 'INR', planName);
      
      if (!orderData.success) {
        alert('Failed to initiate payment. Please try again.');
        return;
      }

      const options = {
        key: 'rzp_live_Tj0ccml38XqvgQ',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'DavaSetu',
        description: `${planName} Subscription`,
        order_id: orderData.order.id, // The order ID from backend
        handler: async function (response: any) {
          // This is called when payment is successful
          try {
            // 2. Verify payment on the server
            const verification = await PaymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.success) {
              const duration = planName.includes('Monthly') ? 1 : (planName.includes('Yearly') || planName.includes('Mobile')) ? 12 : undefined;
              const planType = planName.includes('Lifetime') ? 'LIFETIME' : planName.includes('Mobile') ? 'MOBILE_YEARLY' : planName.includes('Yearly') ? 'YEARLY' : 'MONTHLY';
              
              // Using hardcoded pharmacy ID 1 for now
              await PharmacyService.updateSubscription(1, planType, duration); 
              alert(`Payment successful! Welcome to the ${planName}.\nPayment ID: ${response.razorpay_payment_id}`);
              window.location.reload();
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Subscription update failed:', error);
            alert('Payment succeeded but failed to update subscription. Please contact support.');
          }
        },
        prefill: {
          name: 'Pharmacy Owner',
          email: 'owner@davasetu.com',
          contact: '9999999999'
        },
        theme: {
          color: '#0284c7' // pharmacy-600 color approx
        }
      };
      
      // @ts-ignore - Razorpay is loaded via script tag
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any){
          alert(`Payment failed! Reason: ${response.error.description}`);
      });
      
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Could not connect to payment server.');
    }
  };

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onChange 
  }: { 
    icon: any, 
    title: string, 
    description: string, 
    value: boolean, 
    onChange: () => void 
  }) => (
    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${value ? 'bg-pharmacy-100 text-pharmacy-600' : 'bg-slate-100 text-slate-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button 
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:ring-offset-2 ${value ? 'bg-pharmacy-600' : 'bg-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-16">
      
      {/* Header Area */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight w-fit">Application Settings</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your pharmacy operations and subscription.</p>
            </div>
            
            <div className={`flex items-center space-x-2 text-sm font-medium text-emerald-600 transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved</span>
            </div>
          </div>

          {/* 1. Our Transparency Promise (Trust & Value) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/60 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-emerald-100/90 p-6 md:p-8 backdrop-blur-sm">
            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                DavaSetu Trust & Value Commitment
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <HeartHandshake className="w-7 h-7 text-emerald-600" />
                Our Transparency Promise
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto font-medium">
                We believe in 100% transparency. No hidden fees, no surprise charges. Here is exactly why DavaSetu is the smartest choice for your pharmacy.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="bg-white/95 p-6 rounded-2xl border border-amber-100/80 shadow-sm flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-2">Cost Less Than Tea</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  At just <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">₹16/day</span> (Yearly Plan), DavaSetu costs less than a daily cup of tea, while bringing you completely new online customers.
                </p>
              </div>

              <div className="bg-white/95 p-6 rounded-2xl border border-emerald-100/80 shadow-sm flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-2">Zero Hidden Costs</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Other softwares charge ₹12,000 upfront + ₹5,000 yearly AMCs. We offer everything in a single, transparent, affordable package.
                </p>
              </div>

              <div className="bg-white/95 p-6 rounded-2xl border border-blue-100/80 shadow-sm flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base mb-2">Guaranteed Growth</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Connect your pharmacy to our mobile app. The extra orders you receive will pay for this software multiple times over!
                </p>
              </div>
            </div>
          </div>

          {/* Subscription & Plans Area */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {isEarlyAdopter && (
              <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all bg-gradient-to-r from-pharmacy-600 to-blue-600">
                <div className="flex items-center text-white">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-300 animate-pulse shrink-0" />
                  <span className="font-bold text-sm">
                    Early Adopter Offer: First 20 pharmacies get flat 5% OFF! (Only {spotsLeft} Spots Left!)
                  </span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-lg text-white text-xs font-mono font-bold tracking-wider border border-white/20 shrink-0">
                  CODE: DAVA5
                </span>
              </div>
            )}
            
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-6">
                <Crown className="w-6 h-6 mr-3 text-amber-500" />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Subscription & Plans</h3>
                  <p className="text-sm text-slate-500">Upgrade to unlock Smart Inventory, Unlimited Billing & Analytics.</p>
                </div>
              </div>

              {profile?.planType === 'MOBILE_YEARLY' && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-200 text-amber-900 shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-amber-900">Current Plan: Mobile-Only Pro (₹1,499/Year)</span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">📱 Mobile Phone Only</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                        આ એકાઉન્ટ ₹1,499 વાળા Mobile-Only પ્લાન પર છે જે ખાસ મોબાઈલ વાપરતા કેમિસ્ટ માટે છે (PC/લેપટોપ વગરના સ્ટોર માટે). PC અને Laptop પર ડેસ્કટોપ સોફ્ટવેર અને પ્રિન્ટિંગ ચલાવવા માટે નીચે આપેલા પ્લાનમાંથી PC પ્લાન પસંદ કરો.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Monthly Plan */}
                <div className="border border-slate-200 rounded-2xl p-5 transition-all flex flex-col relative bg-white h-full hover:border-pharmacy-300">
                  <h4 className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-2">Monthly Pro</h4>
                  <div className="mb-4">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">₹799</span>
                        <div>
                          <span className="text-3xl font-bold text-slate-800">₹759</span>
                          <span className="text-slate-500 text-sm"> /mo</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-800">₹799</span>
                        <span className="text-slate-500 text-sm"> /mo</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600">
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Unlimited Billing</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Thermal Printer Support</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Basic Reports</li>
                    <li className="flex items-start text-emerald-700 font-medium"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> Mobile App Access (1 Phone Terminal)</li>
                  </ul>
                  <button onClick={() => handlePaymentClick('Monthly')} className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">Select Monthly</button>
                </div>

                {/* Yearly Plan - Best Value */}
                <div className="border-2 rounded-2xl p-5 relative flex flex-col shadow-md transform lg:-translate-y-2 h-full z-10 border-pharmacy-500 bg-pharmacy-50">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm whitespace-nowrap bg-pharmacy-600">Best Value</div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider mb-2 mt-2 text-pharmacy-700">Yearly Premium</h4>
                  <div className="mb-4">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">₹5,999</span>
                        <div>
                          <span className="text-3xl font-bold text-slate-900">₹5,699</span>
                          <span className="text-slate-500 text-sm"> /yr</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-900">₹5,999</span>
                        <span className="text-slate-500 text-sm"> /yr</span>
                      </div>
                    )}
                    <div className="mt-2"><span className="text-xs font-bold px-2.5 py-1 rounded-md border text-pharmacy-700 bg-pharmacy-100 border-pharmacy-200">Just ₹16/day</span></div>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-700">
                    <li className="flex items-start"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> Everything in Monthly</li>
                    <li className="flex items-start"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> Smart Inventory (AI)</li>
                    <li className="flex items-start"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> 7-Day Advanced Trends</li>
                    <li className="flex items-start font-semibold text-emerald-800"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> Mobile App + Multi-Device Cloud Sync</li>
                    <li className="flex items-start"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> Staff Phone Barcode Scanners</li>
                    <li className="flex items-start"><Check className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-pharmacy-600" /> Priority Support</li>
                  </ul>
                  <button onClick={() => handlePaymentClick('Yearly')} className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm bg-pharmacy-600 hover:bg-pharmacy-700 shadow-pharmacy-500/30">Upgrade to Yearly</button>
                </div>

                {/* Lifetime Plan */}
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all flex flex-col relative bg-slate-900 text-white overflow-hidden h-full">
                  <div className="absolute -right-4 -top-4 bg-amber-500 w-24 h-24 rounded-full opacity-20 blur-2xl"></div>
                  <h4 className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-2 relative z-10">Founder's Lifetime</h4>
                  <div className="mb-4 relative z-10">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">₹24,999</span>
                        <div>
                          <span className="text-3xl font-bold text-white">₹23,749</span>
                          <span className="text-slate-400 text-sm"> once</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">₹24,999</span>
                        <span className="text-slate-400 text-sm"> once</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300 relative z-10">
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> Lifetime Access</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> No Recurring Fees</li>
                    <li className="flex items-start text-amber-300 font-semibold"><Check className="w-4 h-4 text-amber-400 mr-2 shrink-0 mt-0.5" /> Lifetime Mobile App & Real-Time Sync</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-400 mr-2 shrink-0 mt-0.5" /> Unlimited Staff Mobile Scanner Seats</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> All Future Updates</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> VIP Support</li>
                  </ul>
                  <button onClick={() => handlePaymentClick('Lifetime')} className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 relative z-10">Get Lifetime Deal</button>
                </div>

              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center text-xs text-slate-500 bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-center sm:text-left">
                <CreditCard className="w-5 h-5 mb-2 sm:mb-0 sm:mr-3 text-slate-400" />
                Payments are securely processed via Razorpay/Stripe. Upgrade anytime, no hidden charges.
              </div>
            </div>
          </div>


          {/* Unified Receipt & Bill Dispatch Suite */}
          <div className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/60 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 mb-8 backdrop-blur-xl transition-all">
            {/* Ambient Decorative Background Glows */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-emerald-400/10 via-teal-300/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-sky-400/10 via-indigo-300/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Suite Header Bar */}
            <div className="px-7 py-5 border-b border-slate-100/90 bg-white/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-50 shrink-0">
                  <Receipt className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Receipt & Bill Dispatch
                    </h3>
                    {(settings.autoPrintReceipts || (msgSettings?.isActive ?? true)) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Auto-Dispatch Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Auto-Dispatch Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Dual-Channel Checkout Engine • Instant thermal paper slips & free paperless WhatsApp tax bills
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {isElectron && (
                  <button
                    type="button"
                    onClick={fetchPrinters}
                    disabled={isRefreshingPrinters}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Scan for USB thermal printers"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingPrinters ? 'animate-spin' : ''}`} />
                    Refresh Printers
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenLogs}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 text-xs font-bold text-emerald-800 shadow-xs hover:border-emerald-300 hover:shadow transition-all active:scale-95 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Logs
                </button>
              </div>
            </div>

            {/* Dual Engine Columns */}
            <div className="p-7 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Physical Thermal Slip */}
                <div className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Header with Auto-Print Toggle */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/15 shrink-0 group-hover:scale-105 transition-transform">
                          <Printer className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel 01</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-md">POS Hardware</span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">Thermal Slip Printing</h4>
                          <p className="text-[11px] text-slate-500">Physical receipt for walk-in counter patients</p>
                        </div>
                      </div>

                      {/* Polished Compact Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.autoPrintReceipts}
                        onClick={handleToggleAutoPrint}
                        className={`group/toggle inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 active:scale-95 ${
                          settings.autoPrintReceipts
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-500'
                        }`}
                        title={settings.autoPrintReceipts ? 'Auto-Print is ON (Click to turn OFF)' : 'Auto-Print is OFF (Click to turn ON)'}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              settings.autoPrintReceipts ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`}
                          />
                          <span className={`text-[11px] font-bold tracking-tight transition-colors ${
                            settings.autoPrintReceipts ? 'text-emerald-800' : 'text-slate-500 group-hover/toggle:text-slate-700'
                          }`}>
                            Auto-Print
                          </span>
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            settings.autoPrintReceipts ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              settings.autoPrintReceipts ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    </div>

                    {isElectron ? (
                      <div className="space-y-4">
                        {/* Printer Hardware Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              Selected POS Printer
                            </label>
                            {selectedPrinter ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> USB Ready
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Default Spooler</span>
                            )}
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Printer className="w-4 h-4 text-slate-500" />
                            </div>
                            <select
                              value={selectedPrinter}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedPrinter(val);
                                localStorage.setItem('selected_printer_name', val);
                                setIsSaved(true);
                                setTimeout(() => setIsSaved(false), 2000);
                              }}
                              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none transition-all shadow-xs cursor-pointer"
                            >
                              <option value="">System Default Printer</option>
                              {installedPrinters.map((p, idx) => (
                                <option key={idx} value={p.name}>
                                  {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Format & Silent Print Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                              Paper Roll Format
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                              <select
                                value={printFormat}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPrintFormat(val);
                                  localStorage.setItem('default_printer_format', val);
                                  setIsSaved(true);
                                  setTimeout(() => setIsSaved(false), 2000);
                                }}
                                className="w-full pl-8 pr-8 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none transition-all shadow-xs cursor-pointer"
                              >
                                <option value="THERMAL_80MM">Thermal 80mm (3")</option>
                                <option value="THERMAL_58MM">Thermal 58mm (2")</option>
                                <option value="A4">A4 Sheet / PDF</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                              Instant Silent Print
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = !silentPrinting;
                                setSilentPrinting(nextVal);
                                localStorage.setItem('silent_printing_enabled', String(nextVal));
                                setIsSaved(true);
                                setTimeout(() => setIsSaved(false), 2000);
                              }}
                              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all shadow-xs cursor-pointer ${
                                silentPrinting 
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30 shadow-emerald-500/5' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Zap className={`w-3.5 h-3.5 ${silentPrinting ? 'text-emerald-600 fill-emerald-500' : 'text-slate-400'}`} />
                                {silentPrinting ? 'Fast 0.5s USB' : 'Dialog Mode'}
                              </span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${silentPrinting ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                        <strong>Browser Mode:</strong> Printing opens via the standard system dialog. Launch from the Desktop App for 0.5s instant silent USB printing!
                      </div>
                    )}
                  </div>

                  {/* Test Slip Action Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{testPrintStatus || 'Hardware spooler ready'}</span>
                    </span>
                    <button
                      type="button"
                      disabled={isTestingPrint}
                      onClick={handleTestPrint}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-900/15 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <Printer className={`w-3.5 h-3.5 ${isTestingPrint ? 'animate-pulse text-emerald-400' : 'text-slate-300'}`} />
                      <span>{isTestingPrint ? 'Printing Slip...' : 'Print Test Slip'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Digital WhatsApp Receipt */}
                <div className="group relative rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 p-6 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Header with Auto-Send Toggle */}
                    <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Channel 02</span>
                            <span className="text-emerald-300">•</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.2 rounded-md">Cloud Paperless</span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">Digital WhatsApp Receipt</h4>
                          <p className="text-[11px] text-slate-500">Paperless digital tax invoice sent to patient mobile</p>
                        </div>
                      </div>

                      {/* Polished Compact Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={msgSettings?.isActive ?? true}
                        onClick={toggleAutoSendWhatsapp}
                        className={`group/toggle inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 active:scale-95 ${
                          (msgSettings?.isActive ?? true)
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                        title={(msgSettings?.isActive ?? true) ? 'Auto-Send WhatsApp is ON (Click to turn OFF)' : 'Auto-Send WhatsApp is OFF (Click to turn ON)'}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              (msgSettings?.isActive ?? true) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            }`}
                          />
                          <span className={`text-[11px] font-bold tracking-tight transition-colors ${
                            (msgSettings?.isActive ?? true) ? 'text-emerald-800' : 'text-slate-500 group-hover/toggle:text-slate-700'
                          }`}>
                            Auto-Send
                          </span>
                        </span>
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            (msgSettings?.isActive ?? true) ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              (msgSettings?.isActive ?? true) ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    </div>

                    {/* Features Showcase Card */}
                    <div className="space-y-3">
                      <div className="p-3.5 bg-white/95 rounded-xl border border-emerald-200/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            Direct WhatsApp Gateway
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                            100% Free Lifetime
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Automatically dispatches an itemized digital receipt with medicine names, batch & expiry, GST breakdown, and recovery greetings directly to patient WhatsApp upon billing checkout.
                        </p>
                      </div>

                      {/* 4 Feature Badges in 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2 font-bold text-slate-700 shadow-xs">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[11px] truncate">Zero Meta API Fees</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2 font-bold text-slate-700 shadow-xs">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[11px] truncate">0 Cellular SMS Charges</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2 font-bold text-slate-700 shadow-xs">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[11px] truncate">Automated Recovery Wish</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center gap-2 font-bold text-slate-700 shadow-xs">
                          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[11px] truncate">Itemized GST Breakdown</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Action Bar */}
                  <div className="pt-4 border-t border-emerald-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                      </span>
                      <span>{(msgSettings?.isActive ?? true) ? 'Active on all checkout bills' : 'Auto-send paused'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenLogs}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications & Audio Alerts */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-pharmacy-600" />
                Notifications & Audio Ring Alerts
              </h3>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Active in Production
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingRow 
                icon={Volume2}
                title="Loud Order Ring Alert"
                description="Loud bell/ring chime when customer orders or uploads prescription"
                value={settings.soundEnabled}
                onChange={() => {
                  toggleSetting('soundEnabled');
                  const nextVal = !settings.soundEnabled;
                  localStorage.setItem('sound_alert_enabled', String(nextVal));
                }}
              />
              <SettingRow 
                icon={Bell}
                title="Push Notifications"
                description="Receive alerts in your browser/OS"
                value={settings.pushNotifications}
                onChange={() => toggleSetting('pushNotifications')}
              />
              <SettingRow 
                icon={Smartphone}
                title="SMS Alerts"
                description="Get important updates via text message"
                value={settings.smsAlerts}
                onChange={() => toggleSetting('smsAlerts')}
              />
              <SettingRow 
                icon={Shield}
                title="Email Notifications"
                description="Receive daily summaries and reports"
                value={settings.emailAlerts}
                onChange={() => toggleSetting('emailAlerts')}
              />
            </div>
          </div>

          {/* Staff & Distributor Settings (Owner Only) */}
          {(JSON.parse(localStorage.getItem('user') || '{}').role || 'OWNER') === 'OWNER' && (
            <div className="space-y-6">
              <StaffManagement />
              <DistributorSettings />
            </div>
          )}

          {/* Delivery Logs Modal */}
          {showLogsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      Invoice Dispatch History
                    </h3>
                    <p className="text-xs text-slate-500">Live records of digital receipts sent to customers</p>
                  </div>
                  <button
                    onClick={() => setShowLogsModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-3 flex-1">
                  {isLoadingLogs ? (
                    <div className="text-center py-10 text-xs text-slate-400">Loading delivery logs...</div>
                  ) : msgLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">No message logs recorded yet. Create a bill with a customer phone to see live dispatches here.</div>
                  ) : (
                    msgLogs.map((log) => (
                      <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${log.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                              {log.channel}
                            </span>
                            <span className="font-bold text-slate-800">To: +91 {log.recipientPhone}</span>
                            {log.billNumber && (
                              <span className="text-slate-500 font-medium">({log.billNumber})</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] truncate max-w-md">{log.messageContent}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                            log.status === 'SIMULATED' ? 'bg-blue-100 text-blue-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {log.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    onClick={() => setShowLogsModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
  );
}
