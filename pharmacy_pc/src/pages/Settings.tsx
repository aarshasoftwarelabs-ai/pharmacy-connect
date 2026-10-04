import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PharmacyService } from '../services/pharmacyService';
import { PaymentService } from '../services/paymentService';
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
  HeartHandshake
} from 'lucide-react';

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
  const location = useLocation();
  const isWholesale = location.pathname.includes('wholesale');

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

  const handlePaymentClick = (originalAmount: number, planName: string) => {
    const finalAmount = isEarlyAdopter ? Math.floor(originalAmount * 0.95) : originalAmount;
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
              const duration = planName.includes('Monthly') ? 1 : planName.includes('Yearly') ? 12 : undefined;
              const planType = planName.includes('Lifetime') ? 'LIFETIME' : planName.includes('Yearly') ? 'YEARLY' : 'MONTHLY';
              
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
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Area */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Application Settings</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your pharmacy operations and subscription.</p>
            </div>
            
            <div className={`flex items-center space-x-2 text-sm font-medium text-emerald-600 transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved</span>
            </div>
          </div>

          {/* Distributor Settings (Owner Only) */}
          {(JSON.parse(localStorage.getItem('user') || '{}').role || 'OWNER') === 'OWNER' && (
            <>
              <DistributorSettings />
            </>
          )}

          {/* Subscription & Plans Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {isEarlyAdopter && (
              <div className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all ${isWholesale ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-pharmacy-600 to-indigo-600'}`}>
                <div className="flex items-center text-white">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-300 animate-pulse shrink-0" />
                  <span className="font-bold text-sm">
                    {isWholesale 
                      ? `Early Adopter Offer: First 20 Wholesalers get flat 10% OFF + 15 Days Free Trial! (Only ${spotsLeft} Spots Left!)`
                      : `Early Adopter Offer: First 20 pharmacies get flat 5% OFF! (Only ${spotsLeft} Spots Left!)`}
                  </span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-lg text-white text-xs font-mono font-bold tracking-wider border border-white/20 shrink-0">
                  CODE: {isWholesale ? 'B2B10' : 'DAVA5'}
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 xl:gap-6 pt-2">
                
                {/* Monthly Plan */}
                <div className={`border border-slate-200 rounded-2xl p-5 transition-all flex flex-col relative bg-white h-full ${isWholesale ? 'hover:border-blue-300' : 'hover:border-pharmacy-300'}`}>
                  <h4 className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-2">Monthly Pro</h4>
                  <div className="mb-4">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">{isWholesale ? '₹999' : '₹799'}</span>
                        <div>
                          <span className="text-3xl font-bold text-slate-800">{isWholesale ? '₹899' : '₹759'}</span>
                          <span className="text-slate-500 text-sm"> /mo</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-800">{isWholesale ? '₹999' : '₹799'}</span>
                        <span className="text-slate-500 text-sm"> /mo</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600">
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> {isWholesale ? 'B2B Khata & Ledgers' : 'Unlimited Billing'}</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> {isWholesale ? 'Trade Schemes' : 'Thermal Printer Support'}</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" /> {isWholesale ? 'Basic AI PO Scanner' : 'Basic Reports'}</li>
                  </ul>
                  <button onClick={() => handlePaymentClick(isWholesale ? 999 : 799, 'Monthly Pro')} className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">Select Monthly</button>
                </div>

                {/* Yearly Plan - Best Value */}
                <div className={`border-2 rounded-2xl p-5 relative flex flex-col shadow-md transform lg:-translate-y-2 h-full z-10 ${isWholesale ? 'border-blue-500 bg-blue-50' : 'border-pharmacy-500 bg-pharmacy-50'}`}>
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm whitespace-nowrap ${isWholesale ? 'bg-blue-600' : 'bg-pharmacy-600'}`}>Best Value</div>
                  <h4 className={`font-semibold text-sm uppercase tracking-wider mb-2 mt-2 ${isWholesale ? 'text-blue-700' : 'text-pharmacy-700'}`}>Yearly Premium</h4>
                  <div className="mb-4">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">{isWholesale ? '₹8,999' : '₹5,999'}</span>
                        <div>
                          <span className="text-3xl font-bold text-slate-900">{isWholesale ? '₹7,499' : '₹5,699'}</span>
                          <span className="text-slate-500 text-sm"> /yr</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-900">{isWholesale ? '₹8,999' : '₹5,999'}</span>
                        <span className="text-slate-500 text-sm"> /yr</span>
                      </div>
                    )}
                    <div className="mt-2"><span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${isWholesale ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-pharmacy-700 bg-pharmacy-100 border-pharmacy-200'}`}>Just {isWholesale ? '₹20' : '₹16'}/day</span></div>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-700">
                    <li className="flex items-start"><Check className={`w-4 h-4 mr-2 shrink-0 mt-0.5 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} /> Everything in Monthly</li>
                    <li className="flex items-start"><Check className={`w-4 h-4 mr-2 shrink-0 mt-0.5 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} /> {isWholesale ? 'AI GSTIN Automation' : 'Smart Inventory (AI)'}</li>
                    <li className="flex items-start"><Check className={`w-4 h-4 mr-2 shrink-0 mt-0.5 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} /> {isWholesale ? 'Smart Inventory & Trends' : '7-Day Advanced Trends'}</li>
                    <li className="flex items-start"><Check className={`w-4 h-4 mr-2 shrink-0 mt-0.5 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} /> Priority Support</li>
                  </ul>
                  <button onClick={() => handlePaymentClick(isWholesale ? 8999 : 5999, 'Yearly Premium')} className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${isWholesale ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-pharmacy-600 hover:bg-pharmacy-700 shadow-pharmacy-500/30'}`}>Upgrade to Yearly</button>
                </div>

                {/* Lifetime Plan */}
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all flex flex-col relative bg-slate-900 text-white overflow-hidden h-full">
                  <div className="absolute -right-4 -top-4 bg-amber-500 w-24 h-24 rounded-full opacity-20 blur-2xl"></div>
                  <h4 className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-2 relative z-10">Founder's Lifetime</h4>
                  <div className="mb-4 relative z-10">
                    {isEarlyAdopter ? (
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 line-through font-medium">{isWholesale ? '₹34,999' : '₹24,999'}</span>
                        <div>
                          <span className="text-3xl font-bold text-white">{isWholesale ? '₹29,999' : '₹23,749'}</span>
                          <span className="text-slate-400 text-sm"> once</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-white">{isWholesale ? '₹34,999' : '₹24,999'}</span>
                        <span className="text-slate-400 text-sm"> once</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300 relative z-10">
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> Lifetime Access</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> No Recurring Fees</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> All Future Updates</li>
                    <li className="flex items-start"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0 mt-0.5" /> VIP {isWholesale ? 'Wholesale ' : ''}Support</li>
                  </ul>
                  <button onClick={() => handlePaymentClick(isWholesale ? 34999 : 24999, 'Founder Lifetime')} className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 relative z-10">Get Lifetime Deal</button>
                </div>

              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center text-xs text-slate-500 bg-slate-50 py-3 px-4 rounded-xl border border-slate-100 text-center sm:text-left">
                <CreditCard className="w-5 h-5 mb-2 sm:mb-0 sm:mr-3 text-slate-400" />
                Payments are securely processed via Razorpay/Stripe. Upgrade anytime, no hidden charges.
              </div>
            </div>
          </div>

          {/* Transparency Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-100 p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6 mr-2 text-indigo-600" />
                Our Transparency Promise
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                We believe in 100% transparency. No hidden fees, no surprise charges. Here is exactly why DavaSetu is the smartest choice for your pharmacy.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Cost Less Than Tea</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  At just <span className="font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{isWholesale ? '₹20/day' : '₹16/day'}</span> (Yearly Plan), DavaSetu costs less than a daily cup of tea, while bringing you completely new online customers.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2">Zero Hidden Costs</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Other softwares charge ₹12,000 upfront + ₹5,000 yearly AMCs. We offer everything in a single, transparent, affordable package.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Store className={`w-4 h-4 mr-2 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} />
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

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Bell className={`w-4 h-4 mr-2 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} />
                Notifications & Alerts
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingRow 
                icon={Bell}
                title="Push Notifications"
                description="Receive alerts in your browser"
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
                title="Sound Alerts"
                description="Play sound for new orders"
                value={settings.soundEnabled}
                onChange={() => toggleSetting('soundEnabled')}
              />
            </div>
          </div>

          {/* Application Preferences */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Printer className={`w-4 h-4 mr-2 ${isWholesale ? 'text-blue-600' : 'text-pharmacy-600'}`} />
                System Preferences
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <SettingRow 
                icon={Printer}
                title="Auto-print Receipts"
                description="Automatically print invoice when order is completed"
                value={settings.autoPrintReceipts}
                onChange={() => toggleSetting('autoPrintReceipts')}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
