import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PharmacyService } from '../services/pharmacyService';
import { PaymentService } from '../services/paymentService';
import { testPrintThermalReceipt } from '../utils/printUtils';
import { 
  Bell, 
  Store, 
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
  RefreshCw
} from 'lucide-react';

import StaffManagement from '../components/settings/StaffManagement';
import DistributorSettings from '../components/settings/DistributorSettings';

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
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pharmacy_app_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse settings');
      }
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
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:ring-offset-2 ${value ? 'bg-pharmacy-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${value ? 'translate-x-6' : 'translate-x-1'}`} />
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

          {/* Staff & Distributor Settings (Owner Only) */}
          {(JSON.parse(localStorage.getItem('user') || '{}').role || 'OWNER') === 'OWNER' && (
            <>
              <StaffManagement />
              <DistributorSettings />
            </>
          )}

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

          {/* Transparency Section */}
          <div className="bg-gradient-to-br from-pharmacy-50 to-blue-50 rounded-[2rem] shadow-sm border border-pharmacy-100 p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 mr-2 text-pharmacy-600" />
                Our Transparency Promise
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                We believe in 100% transparency. No hidden fees, no surprise charges. Here is exactly why DavaSetu is the smartest choice for your pharmacy.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-pharmacy-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Cost Less Than Tea</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  At just <span className="font-bold text-pharmacy-600 bg-pharmacy-50 px-1 py-0.5 rounded">₹16/day</span> (Yearly Plan), DavaSetu costs less than a daily cup of tea, while bringing you completely new online customers.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-pharmacy-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Zero Hidden Costs</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Other softwares charge ₹12,000 upfront + ₹5,000 yearly AMCs. We offer everything in a single, transparent, affordable package.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-pharmacy-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Guaranteed Growth</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Connect your pharmacy to our mobile app. The extra orders you receive will pay for this software multiple times over!
                </p>
              </div>
            </div>
          </div>

          {/* Store Operations */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Store className="w-4 h-4 mr-2 text-pharmacy-600" />
                Store Operations
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <SettingRow 
                icon={Store}
                title="Accepting Orders"
                description="Temporarily pause incoming orders when busy"
                value={settings.acceptingOrders}
                onChange={() => toggleSetting('acceptingOrders')}
              />
              <SettingRow 
                icon={CheckCircle2}
                title="24/7 Service Enabled"
                description="Show your pharmacy as always open"
                value={settings.open24Hours}
                onChange={() => toggleSetting('open24Hours')}
              />
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
            </div>
          </div>

          {/* Hardware & POS Thermal Printing Suite */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-pharmacy-50 flex items-center justify-center text-pharmacy-600 border border-pharmacy-100/60">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Thermal Hardware & Silent Printing
                    {isElectron && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Zap className="w-3 h-3 mr-1 text-emerald-600" />
                        POS Hardware Engine Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">Configure 58mm / 80mm USB & thermal receipt printers</p>
                </div>
              </div>

              {isElectron && (
                <button
                  type="button"
                  onClick={fetchPrinters}
                  disabled={isRefreshingPrinters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
                  title="Scan for newly plugged-in USB thermal printers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingPrinters ? 'animate-spin' : ''}`} />
                  Refresh Printers
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Printer Hardware Selection (Electron) */}
              {isElectron ? (
                <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      Selected POS Printer
                      {selectedPrinter && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Connected</span>}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Choose your USB or thermal slip printer (e.g. TVS, POS-80, Epson, Everycom)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPrinter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPrinter(val);
                        localStorage.setItem('selected_printer_name', val);
                        setIsSaved(true);
                        setTimeout(() => setIsSaved(false), 2000);
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 min-w-[200px]"
                    >
                      <option value="">System Default Printer</option>
                      {installedPrinters.map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 border border-amber-100 bg-amber-50/60 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong>Browser Mode:</strong> Printing opens via the standard system dialog. Launching from the DavaSetu Desktop App unlocks <strong>1-Click Instant Silent Printing</strong> directly to USB POS hardware!
                  </div>
                </div>
              )}

              {/* Silent Printing Toggle */}
              {isElectron && (
                <SettingRow 
                  icon={Zap}
                  title="Silent Instant Printing (Bypass Dialog)"
                  description="Slip prints directly from the thermal printer in 0.5s without opening the Windows print popup"
                  value={silentPrinting}
                  onChange={() => {
                    const nextVal = !silentPrinting;
                    setSilentPrinting(nextVal);
                    localStorage.setItem('silent_printing_enabled', String(nextVal));
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2000);
                  }}
                />
              )}

              {/* Auto-Print on Bill Completion */}
              <SettingRow 
                icon={Printer}
                title="Auto-Print POS Thermal Slip on Billing"
                description="Automatically triggers receipt print the moment you click Save & Bill"
                value={settings.autoPrintReceipts}
                onChange={() => {
                  toggleSetting('autoPrintReceipts');
                  localStorage.setItem('auto_print_receipt', String(!settings.autoPrintReceipts));
                }}
              />

              {/* Default Paper Format */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Thermal Roll Paper Size</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Select your retail pharmacy counter printer roll format</p>
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
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pharmacy-500"
                >
                  <option value="THERMAL_80MM">Thermal 80mm (3-Inch Standard POS Roll)</option>
                  <option value="THERMAL_58MM">Thermal 58mm (2-Inch Mini Slip Roll)</option>
                  <option value="A4">Standard A4 Sheet / PDF</option>
                </select>
              </div>

              {/* Hardware Test Print Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Test your thermal printer paper alignment, cut feed, and clarity with a sample receipt.
                </div>
                <div className="flex items-center gap-3">
                  {testPrintStatus && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {testPrintStatus}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isTestingPrint}
                    onClick={async () => {
                      setIsTestingPrint(true);
                      setTestPrintStatus('Printing test slip...');
                      try {
                        const fmt = printFormat === 'THERMAL_58MM' ? '58MM' : (printFormat === 'A4' ? 'A4' : '80MM');
                        const res = await testPrintThermalReceipt(fmt);
                        if (res?.success) {
                          setTestPrintStatus(res.silent ? 'Receipt printed silently!' : 'Print sent!');
                        } else {
                          setTestPrintStatus('Print triggered');
                        }
                      } catch (err: any) {
                        setTestPrintStatus('Print error: ' + (err?.message || 'Check printer'));
                      } finally {
                        setIsTestingPrint(false);
                        setTimeout(() => setTestPrintStatus(null), 4000);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <Printer className={`w-3.5 h-3.5 ${isTestingPrint ? 'animate-pulse' : ''}`} />
                    {isTestingPrint ? 'Printing...' : 'Test POS Thermal Print'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
