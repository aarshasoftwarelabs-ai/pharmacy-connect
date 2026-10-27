import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Receipt, 
  Package, 
  Truck, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Printer, 
  QrCode, 
  Smartphone, 
  Users, 
  Clock, 
  Database, 
  ChevronDown, 
  Star, 
  Store, 
  FileText, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Check, 
  TrendingUp, 
  Laptop, 
  Layers, 
  Crown, 
  AlertTriangle, 
  MessageSquare, 
  HeartPulse, 
  Search, 
  X, 
  Award, 
  CheckCircle, 
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  Send
} from 'lucide-react';

interface MedicineSample {
  id: string;
  name: string;
  category: string;
  batch: string;
  exp: string;
  mrp: number;
  discount: number;
  qty: number;
  gst: number;
}

const SAMPLE_MEDS: MedicineSample[] = [
  { id: '1', name: 'Dolo 650mg Tab', category: 'Micro Labs • Paracetamol', batch: 'BT-9421', exp: '11/27', mrp: 31.50, discount: 10, qty: 1, gst: 12 },
  { id: '2', name: 'Augmentin 625 Duo', category: 'GSK • Amoxycillin + Clav', batch: 'AUG-441', exp: '08/26', mrp: 201.20, discount: 12, qty: 1, gst: 12 },
  { id: '3', name: 'Pantocid DSR Cap', category: 'Sun Pharma • Pantoprazole', batch: 'PAN-109', exp: '05/27', mrp: 189.00, discount: 15, qty: 1, gst: 12 },
  { id: '4', name: 'Azithral 500mg Tab', category: 'Alembic • Azithromycin', batch: 'AZ-772', exp: '12/26', mrp: 119.50, discount: 10, qty: 1, gst: 12 },
  { id: '5', name: 'Montair LC Kid Tab', category: 'Cipla • Montelukast + Lev', batch: 'MN-331', exp: '03/27', mrp: 145.00, discount: 10, qty: 1, gst: 12 },
  { id: '6', name: 'Telma 40mg Tab', category: 'Glenmark • Telmisartan', batch: 'TL-552', exp: '10/27', mrp: 128.00, discount: 10, qty: 1, gst: 12 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<MedicineSample[]>([SAMPLE_MEDS[0], SAMPLE_MEDS[1]]);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT'>('UPI');
  const [receiptSimulated, setReceiptSimulated] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [customerName, setCustomerName] = useState('Rajesh Patel');
  const [activeTab, setActiveTab] = useState<'retail' | 'expiry' | 'purchase' | 'khata'>('retail');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const addSampleMed = (med: MedicineSample) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === med.id);
      if (exists) {
        return prev.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...med, qty: 1 }];
    });
  };

  const removeSampleMed = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.mrp * item.qty), 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((acc, item) => acc + ((item.mrp * (item.discount / 100)) * item.qty), 0);
  };

  const calculateGST = () => {
    const taxable = calculateSubtotal() - calculateDiscount();
    return taxable * 0.12;
  };

  const calculateTotal = () => {
    return (calculateSubtotal() - calculateDiscount() + calculateGST()).toFixed(2);
  };

  const faqs = [
    {
      q: 'જૂના સોફ્ટવેર (Marg, RedCross, Tally) માંથી ડેટા શિફ્ટ થઈ જશે?',
      a: 'હા, બિલકુલ! તમારી જૂની એક્સેલ ફાઈલ કે દવાઓની યાદી સીધી જ ૫ મિનિટમાં DavaSetu માં ઇમ્પોર્ટ (Import) થઈ જાય છે. તમારો એકપણ રેકોર્ડ કે ગ્રાહકનો હિસાબ ખોવાશે નહીં.'
    },
    {
      q: 'દુકાને ન હોવ ત્યારે શું હું ઘરેથી કે બહારથી વેચાણ અને ગલ્લો જોઈ શકું?',
      a: 'હા! DavaSetu ૧૦૦% ક્લાઉડ-બેઝ્ડ છે. તમે તમારા મોબાઇલ કે લેપટોપથી ગમે ત્યાં બેઠા લાઈવ જોઈ શકો છો કે આજે કેટલા બિલ બન્યા, કેશ કેટલા આવ્યા, UPI કેટલા થયા અને સ્ટોક કેટલો બચ્યો છે.'
    },
    {
      q: 'શું મારા હાલના બારકોડ સ્કેનર અને થર્મલ પ્રિન્ટર સાથે ચાલશે?',
      a: 'હા, ૧૦૦%! ટીવીએસ (TVS), એપ્સન (Epson), NGX કે કોઈપણ ૨-ઇંચ/૩-ઇંચ થર્મલ પ્રિન્ટર અને USB/વાયરલેસ બારકોડ સ્કેનર પ્લગ-એન્ડ-પ્લે તરીકે તરત જ કનેક્ટ થઈ જાય છે.'
    },
    {
      q: 'દવાઓ એક્સપાયર (Expiry) થવાથી નુકસાન કેવી રીતે બચશે?',
      a: 'આપણું સ્માર્ટ એક્સપાયરી શિલ્ડ ૩૦, ૬૦ અને ૯૦ દિવસ પહેલા જ તમને કલર-કોડેડ એલર્ટ આપી દે છે, જેથી એક્સપાયરી ડેટ પહેલા જ તમે સપ્લાયર/ડિસ્ટ્રીબ્યુટરને માલ પરત મોકલી ક્રેડિટ નોટ મેળવી શકો.'
    },
    {
      q: 'શું ઇન્ટરનેટ ધીમું હોય કે થોડીવાર બંધ થાય તો બિલિંગ અટકી જશે?',
      a: 'ના! DavaSetu માં ઓફલાઇન બિલિંગ સપોર્ટ છે. નેટ સ્લો હોય તો પણ કાઉન્ટર બિલિંગ અટકતું નથી, અને જેવું નેટ આવે એટલે બધો ડેટા આપોઆપ ક્લાઉડમાં સેવ થઈ જાય છે.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-600 selection:text-white antialiased">
      
      {/* 1. TOP BRAND TRUST BAR */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-black tracking-wide uppercase">
              NEW 3.0
            </span>
            <span className="truncate">
              ⚡ ભારતભરના ૧,૨૦૦+ મેડિકલ સ્ટોર્સનો વિશ્વસનીય ફાર્મસી ક્લાઉડ POS & ERP સોફ્ટવેર
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200">
            <span className="hidden md:inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> હેલ્પલાઇન: +91 98765 43210
            </span>
            <button 
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
              className="text-white font-bold underline hover:text-emerald-100 transition flex items-center gap-1"
            >
              <span>{isLoggedIn ? 'Go to Dashboard →' : 'Launch Free Demo →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STICKY GLASS HEALTHCARE NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 shadow-sm">
              <img 
                src="/davasetu_logo.png" 
                alt="DavaSetu Pharmacy POS" 
                className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="p-2 rounded-xl bg-emerald-600 text-white sm:hidden">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  Dava<span className="text-emerald-600">Setu</span>
                </span>
                <span className="inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Pharmacy Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-tight">Smart Medical Store POS & Billing</p>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#why-davasetu" className="hover:text-emerald-600 transition-colors">શા માટે DavaSetu?</a>
            <a href="#interactive-simulator" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
              <span>લાઈવ કાઉન્ટર ડેમો</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold animate-pulse">Try Live</span>
            </a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">ફીચર્સ</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">પ્લાન & કિંમત</a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors">FAQ</a>
          </nav>

          {/* HEADER ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
              >
                <span>ઓપન POS ડેશબોર્ડ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200"
                >
                  Chemist Login
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Launch Web POS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION - HIGH CONVERTING HEALTHCARE SAAS */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 border-b border-slate-200/70">
        
        {/* Soft Background Radial Rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Pharmacy Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>૧૦૦% ભારતીય ફાર્મસી અને મેડિકલ સ્ટોર માટે ખાસ ડિઝાઈન કરેલું</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.18]">
              જૂના, ધીમા સોફ્ટવેરને કહો અલવિદા!{' '}
              <br className="hidden sm:inline" />
              મેડિકલ બિલિંગ હવે થશે{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                ૩ ગણું ઝડપી & ઝીરો એક્સપાયરી લોસ
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
              સાંજે ગ્રાહકોની ભીડમાં ઝડપી બારકોડ સ્કેનિંગ, ગ્રાહકના વોટ્સએપ પર સીધું જીએસટી બિલ, ડિસ્ટ્રીબ્યુટર પર્ચેઝ ઈન્વર્ડ અને મોબાઈલ પર લાઈવ સેલ્સ ટ્રેકિંગ—બધું જ ૧ ક્લિકમાં.
            </p>

            {/* Hero CTAs */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-base shadow-xl shadow-emerald-700/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <Zap className="w-5 h-5 text-yellow-300" />
                <span>{isLoggedIn ? 'ઓપન POS ટર્મિનલ' : 'ફ્રી ડેમો શરૂ કરો (Launch Web POS)'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <a
                href="#interactive-simulator"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-200 hover:border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>નીચે લાઈવ બિલ બનાવી જુઓ</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </a>
            </div>

            {/* Quick Benefits Bullet Strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ૧૫ દિવસ ફ્રી ટ્રાયલ</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> કોઈ ક્રેડિટ કાર્ડની જરૂર નથી</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> જૂના સોફ્ટવેરથી ફ્રી ડેટા ટ્રાન્સફર</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ૨૪/૭ ગુજરાતી & હિન્દી સપોર્ટ</span>
            </div>
          </div>

          {/* 4. REALISTIC LIVE POS INTERFACE MOCKUP (HERO VISUAL SHOWCASE) */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            
            {/* Glowing Backdrop Frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-20 transform -rotate-1" />

            <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 overflow-hidden">
              
              {/* Fake Browser/OS Chrome Header */}
              <div className="bg-slate-100/90 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-600 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">https://</span>davasetu.com/billing
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    લાઈવ કાઉન્ટર ૦૧
                  </span>
                </div>
              </div>

              {/* Realistic POS Screen Mock Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
                
                {/* Left Side: Medicine Cart & Billing */}
                <div className="md:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    {/* Patient / Customer Bar */}
                    <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ગ્રાહક (Customer)</span>
                        <p className="font-bold text-slate-800 text-sm">Rajeshbhai Patel • Mob: +91 98251-XXXXX</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
                        Dr. N. K. Shah (Civil Hospital)
                      </span>
                    </div>

                    {/* Table of Medicines in Bill */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase pb-1 px-2">
                        <span className="col-span-5">દવાનું નામ (Medicine)</span>
                        <span className="col-span-2 text-center">બેચ / એક્સપાયરી</span>
                        <span className="col-span-2 text-center">જથ્થો (Qty)</span>
                        <span className="col-span-3 text-right">રકમ (MRP)</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 grid grid-cols-12 items-center text-xs">
                        <div className="col-span-5">
                          <p className="font-bold text-slate-800">Augmentin 625 Duo Tab</p>
                          <span className="text-[10px] text-slate-500">GSK • Amoxycillin + Clav</span>
                        </div>
                        <span className="col-span-2 text-center font-mono text-[11px] text-slate-600">AUG-41 (08/26)</span>
                        <span className="col-span-2 text-center font-bold text-slate-800">2 Strips</span>
                        <span className="col-span-3 text-right font-extrabold text-slate-900">₹402.40</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 grid grid-cols-12 items-center text-xs">
                        <div className="col-span-5">
                          <p className="font-bold text-slate-800">Pan-D Capsule</p>
                          <span className="text-[10px] text-slate-500">Alkem • Pantoprazole + Dom</span>
                        </div>
                        <span className="col-span-2 text-center font-mono text-[11px] text-slate-600">PND-90 (05/27)</span>
                        <span className="col-span-2 text-center font-bold text-slate-800">1 Strip</span>
                        <span className="col-span-3 text-right font-extrabold text-slate-900">₹189.00</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 grid grid-cols-12 items-center text-xs">
                        <div className="col-span-5">
                          <p className="font-bold text-slate-800">Dolo 650mg Tab</p>
                          <span className="text-[10px] text-slate-500">Micro Labs • Paracetamol</span>
                        </div>
                        <span className="col-span-2 text-center font-mono text-[11px] text-slate-600">DL-221 (11/27)</span>
                        <span className="col-span-2 text-center font-bold text-slate-800">1 Strip</span>
                        <span className="col-span-3 text-right font-extrabold text-slate-900">₹31.50</span>
                      </div>
                    </div>
                  </div>

                  {/* Hotkeys strip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">કીબોર્ડ શોર્ટકટ્સ:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">F1 દવા શોધો</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">F2 પ્રિન્ટ બિલ</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono">F4 ડિસ્કાઉન્ટ</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono font-bold">F8 વોટ્સએપ બિલ</span>
                  </div>
                </div>

                {/* Right Side: Totals & Instant Pay Summary */}
                <div className="md:col-span-4 bg-gradient-to-b from-emerald-900 to-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
                      <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider">ઇનવોઇસ સમરી</span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">#DS-10842</span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>કુલ રકમ (Gross MRP):</span>
                        <span>₹622.90</span>
                      </div>
                      <div className="flex justify-between text-emerald-300">
                        <span>ડિસ્કાઉન્ટ (૧૨% બચત):</span>
                        <span>- ₹74.75</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>જીએસટી (CGST+SGST 12%):</span>
                        <span>+ ₹65.78</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-emerald-800 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white">નેટ બિલ રકમ:</span>
                      <span className="text-2xl font-black text-emerald-400">₹613.93</span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="mt-6 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <span className="py-2 text-center bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                        <QrCode className="w-3.5 h-3.5" /> UPI QR પે
                      </span>
                      <span className="py-2 text-center bg-slate-800 text-slate-200 border border-slate-700 rounded-xl">
                        રોકડા (Cash)
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Printer className="w-4 h-4 text-emerald-700" />
                      <span>૩ સેકન્ડમાં બિલ પ્રિન્ટ કરો</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Floating KPI Pill 1 (Top Right) */}
            <div className="absolute -top-5 -right-2 sm:-right-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/50 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">આજનું કાઉન્ટર વેચાણ</p>
                <p className="font-extrabold text-slate-900 text-base">₹48,250 <span className="text-xs text-emerald-600 font-bold">(142 બિલ્સ)</span></p>
              </div>
            </div>

            {/* Floating KPI Pill 2 (Bottom Left) */}
            <div className="hidden sm:flex absolute -bottom-5 -left-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/50 items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">બારકોડ સ્કેનિંગ સ્પીડ</p>
                <p className="font-extrabold text-slate-900 text-base">૦.૮ સેકન્ડ <span className="text-xs text-teal-600 font-bold">Fastest</span></p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PAIN VS SOLUTION: WHY PHARMACY OWNERS SWITCH TO DAVALETU */}
      <section id="why-davasetu" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            વાસ્તવિક સમસ્યાઓ vs સ્માર્ટ સોલ્યુશન
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            તમારા જૂના સોફ્ટવેર અને DavaSetu માં શું ફરક છે?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            જો તમે વર્ષો જૂના ડેસ્કટોપ સોફ્ટવેરથી કંટાળી ગયા હોવ, તો આ સરખામણી ખાસ જુઓ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* OLD SOFTWARE (PAIN) */}
          <div className="p-8 rounded-3xl bg-rose-50/60 border-2 border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center text-sm">✕</span>
                <h3 className="font-black text-xl text-rose-950">જૂના ડેસ્કટોપ સોફ્ટવેર (Marg / Tally / Offline)</h3>
              </div>
              
              <ul className="space-y-4 text-sm text-rose-900">
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>હાર્ડડિસ્ક ક્રેશ તો બધો ડેટા ખતમ:</strong> કોમ્પ્યુટર બગડે એટલે વર્ષોનો સેલ્સ અને ગ્રાહકોનો હિસાબ જતો રહે છે.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>નવા સ્ટાફને શીખવતા ૨ મહિના લાગે:</strong> એટલા બધા જટિલ શોર્ટકટ્સ કે નવો છોકરો કાઉન્ટર પર બેસી જ ન શકે.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>દુકાન બહાર હોવ ત્યારે અંધારામાં:</strong> ઘરે કે બહારગામ હોવ તો ખબર જ ન પડે કે દુકાને શું વેચાયું અને ગલ્લામાં કેટલા પૈસા છે.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>હજારો રૂપિયાની દવા એક્સપાયર થઈ જાય:</strong> સમયસર જાણ ન થવાથી ડિસ્ટ્રીબ્યુટર એક્સપાયરી પરત લેવાની ના પાડી દે છે.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-rose-200 text-xs font-bold text-rose-800">
              પરિણામ: માથાનો દુખાવો, સમયનો બગાડ અને દર મહિને ₹૧૫,૦૦૦+ નું એક્સપાયરી નુકસાન.
            </div>
          </div>

          {/* DAVALETU (SOLUTION) */}
          <div className="p-8 rounded-3xl bg-emerald-50/70 border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm">✓</span>
                <h3 className="font-black text-xl text-emerald-950">DavaSetu સ્માર્ટ ક્લાઉડ POS</h3>
              </div>
              
              <ul className="space-y-4 text-sm text-emerald-900">
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>૧૦૦% ઓટો ક્લાઉડ બેકઅપ:</strong> PC બગડે કે નવું લેપટોપ લાવો, માત્ર લોગિન કરો અને ૧ સેકન્ડમાં બધો ડેટા હાજર!</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>કોઈપણ વ્યક્તિ ૫ મિનિટમાં બિલિંગ શીખી જાય:</strong> સ્માર્ટ સર્ચ અને સિમ્પલ ટચ/બારકોડ જેથી સ્ટાફ પર નિર્ભર ન રહેવું પડે.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>મોબાઈલમાં લાઈવ સેલ્સ & સ્ટોક:</strong> તમે દુનિયામાં ગમે ત્યાં હોવ, તમારા ફોન પર લાઈવ કાઉન્ટર ગલ્લો દેખાશે.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>૯૦ દિવસ પહેલા એક્સપાયરી એલર્ટ:</strong> દવા એક્સપાયર થાય એ પહેલાં જ સપ્લાયરને રિટર્ન આપીને પૂરા પૈસા વસૂલ કરો!</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-300 text-xs font-bold text-emerald-800">
              પરિણામ: શાંતિપૂર્ણ વેપાર, ૩ ગણી સ્પીડ અને ૧૦૦% સેવિંગ્સ.
            </div>
          </div>

        </div>
      </section>

      {/* 6. INTERACTIVE LIVE COUNTER SIMULATOR SECTION */}
      <section id="interactive-simulator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl my-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>લાઈવ ટેસ્ટ ડ્રાઈવ (Live Interactive Simulator)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            અહીં જાતે દવા ઉમેરીને બિલિંગની સ્પીડ ચેક કરો
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            નીચે આપેલી દવાઓ પર ક્લિક કરો અને જુઓ કે કેવી રીતે ૧ સેકન્ડમાં બારકોડ સ્કેન થાય છે અને ગણતરી થાય છે!
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900 text-slate-100 shadow-2xl overflow-hidden border border-slate-800">
          
          {/* Simulator Bar */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                DavaSetu POS 3.0 • Counter Terminal Simulator
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Barcode Scanner & Thermal Printer Ready</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Quick Item Adder */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>ક્લિક કરીને દવા બિલમાં ઉમેરો (Simulate Scan):</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">૬ દવા ઉપલબ્ધ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_MEDS.map((med) => {
                    const isInCart = cart.some(c => c.id === med.id);
                    return (
                      <button
                        key={med.id}
                        onClick={() => addSampleMed(med)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                          isInCart 
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm shadow-emerald-500/10' 
                            : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                              {med.name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{med.category}</p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-700">
                            Exp: {med.exp}
                          </span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                          <span className="font-black text-emerald-400 text-sm">₹{med.mrp.toFixed(2)}</span>
                          <span className="text-[11px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded font-bold">
                            + {med.discount}% Disc
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient info input in simulator */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">વોટ્સએપ બિલ ગ્રાહક:</span>
                    <p className="font-bold text-xs text-white">{customerName} ({customerPhone})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ટેસ્ટ WhatsApp મોકલો</span>
                </button>
              </div>
            </div>

            {/* Right: Cart & Calculation */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>કાઉન્ટર ઇનવોઇસ સમરી</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{cart.length} દવા ઉમેરી</span>
                </div>

                <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      ડાબી બાજુની કોઈપણ દવા પર ક્લિક કરો!
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Qty: {item.qty} × ₹{item.mrp.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-emerald-400">₹{(item.mrp * item.qty).toFixed(2)}</span>
                          <button
                            onClick={() => removeSampleMed(item.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals & Quick Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>કુલ રકમ (Subtotal):</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-teal-400">
                  <span>ડિસ્કાઉન્ટ બચત:</span>
                  <span>- ₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>જીએસટી ટેક્સ (GST 12%):</span>
                  <span>+ ₹{calculateGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>નેટ ચૂકવવાપાત્ર:</span>
                  <span className="text-emerald-400 text-xl font-black">₹{calculateTotal()}</span>
                </div>

                {/* Payment Selector */}
                <div className="pt-2 grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'CREDIT'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        paymentMode === mode 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI QR' : mode === 'CASH' ? '💵 રોકડા' : '📒 ખાતું (Udhar)'}
                    </button>
                  ))}
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    setReceiptSimulated(true);
                    setTimeout(() => setReceiptSimulated(false), 4000);
                  }}
                  className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{receiptSimulated ? '✓ પ્રિન્ટ થઈ ગયું & WhatsApp મોકલાઈ ગયું!' : 'બિલ પ્રિન્ટ કરો (Test Print)'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* WhatsApp Preview Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">WhatsApp Invoicing</h4>
                  <p className="text-xs text-slate-500">સીધું ગ્રાહકના ફોનમાં બિલ પહોંચશે</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 space-y-2 font-mono">
                <p className="font-bold text-emerald-900">🏥 શ્રીજી મેડિકલ સ્ટોર</p>
                <p>નમસ્તે {customerName}જી,</p>
                <p>તમારું બિલ #{Math.floor(Math.random() * 9000 + 1000)} જનરેટ થઈ ગયું છે.</p>
                <p>કુલ રકમ: <strong>₹{calculateTotal()}</strong></p>
                <p className="text-emerald-700 underline">👉 ક્લિક કરી PDF ડાઉનલોડ કરો</p>
                <p className="text-[10px] text-slate-500 pt-2 border-t border-emerald-200">DavaSetu Cloud POS દ્વારા મોકલેલ</p>
              </div>

              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full mt-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
              >
                સમજાઈ ગયું (Close)
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. PHARMACY FEATURES (TABBED & INTUITIVE FOR CHEMISTS) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            બધા જ ફીચર્સ ૧ સોફ્ટવેરમાં
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            તમારા મેડિકલ સ્ટોર માટે જરૂરી દરેક સુવિધા
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            કાઉન્ટર બિલિંગથી લઈને ડિસ્ટ્રીબ્યુટર હિસાબ અને જીએસટી રીપોર્ટ સુધી.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. FAST BILLING */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                ૩ સેકન્ડ સુપરફાસ્ટ બિલિંગ
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                દવાના માત્ર ૨ અક્ષર ટાઈપ કરો અથવા બારકોડ સ્કેન કરો. બેચ નંબર, એક્સપાયરી ડેટ, એમઆરપી અને રેક લોકેશન તરત જ સ્ક્રીન પર આવી જશે.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ફાસ્ટ કીબોર્ડ શોર્ટકટ્સ (F1-F12)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> છૂટક ગોળીઓ (Loose strip) બિલિંગ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> સ્પ્લિટ પેમેન્ટ (રોકડા + UPI QR)</li>
            </ul>
          </div>

          {/* 2. EXPIRY SHIELD */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                સ્માર્ટ બેચ & એક્સપાયરી શિલ્ડ
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                દવા એક્સપાયર થઈને ફેંકવી ન પડે તે માટે FIFO (પહેલા આવેલો માલ પહેલા વેચો) સિસ્ટમ. એક્સપાયરી પહેલા ડિસ્ટ્રીબ્યુટરને રિટર્ન મોકલવાની યાદી આપોઆપ બને છે.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" /> ૩૦, ૬૦, ૯૦ દિવસ પહેલા કલર એલર્ટ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" /> ડિસ્ટ્રીબ્યુટર એક્સપાયરી રિટર્ન વાઉચર</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" /> લો-સ્ટોક રીઓર્ડર વોર્નિંગ</li>
            </ul>
          </div>

          {/* 3. PURCHASES & SUPPLIER */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">
                ડિસ્ટ્રીબ્યુટર પર્ચેઝ & લેજર
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                સપ્લાયર્સ પાસેથી આવેલી પર્ચેઝ બીલની સીધી એન્ટ્રી. સ્કીમ (10+1, 10+2 ફ્રી), ક્રેડિટ પિરિયડની મુદત અને પેમેન્ટ બાકી હોય તેની કમ્પ્લીટ ખાતાવહી.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" /> ફાસ્ટ પર્ચેઝ ઇન્વર્ડ (Free scheme સહિત)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" /> સપ્લાયર પેમેન્ટ ડ્યુ એલર્ટ્સ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" /> ખરીદી પર ઇનપુટ ટેક્સ ક્રેડિટ (ITC) ટ્રેકિંગ</li>
            </ul>
          </div>

          {/* 4. PATIENT KHATA */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                પેશન્ટ ડિજિટલ ખાતાવહી (Udhar Khata)
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                નિયમિત ગ્રાહકોનું ઉધાર ખાતું ડિજિટલી સાચવો. પેમેન્ટ રીમાઇન્ડર વોટ્સએપ પર ૧-ક્લિકમાં મોકલો. બીપી, ડાયાબિટીસના દર્દીઓની દવા પૂરી થવા આવે ત્યારે ઓટો એલર્ટ.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> વોટ્સએપ પેમેન્ટ પે લિંક સાથે રીમાઇન્ડર</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> ક્રોનિક પેશન્ટ માસિક દવા રીફિલ લિસ્ટ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> પ્રિસ્ક્રિપ્શન ફોટો સ્ટોરેજ</li>
            </ul>
          </div>

          {/* 5. GST REPORTS */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">
                ૧-ક્લિક GSTR-1 & નફાનો હિસાબ
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                તમારા CA ને જીએસટી ફાઈલિંગ માટે એક્સેલ ફાઈલ ૧ સેકન્ડમાં એક્સપોર્ટ કરી આપો. દરરોજ સાંજે કેટલો ચોખ્ખો નફો થયો તેની સાચી ગણતરી.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> GSTR-1 અને GSTR-3B રેડી રિપોર્ટ્સ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> ડેઇલી કાઉન્ટર કેશ & UPI રિકન્સિલેશન</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" /> કંપની વાઇઝ નફાનું માર્જિન એનાલિટિક્સ</li>
            </ul>
          </div>

          {/* 6. MULTI-DEVICE & STAFF PERMISSIONS */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                મોબાઈલ એપ & સ્ટાફ લોગિન સિક્યોરિટી
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                દુકાનમાં છોકરાઓ હોય તો પણ સુરક્ષિત! સ્ટાફ જૂનું બિલ ડિલીટ કે એડિટ ન કરી શકે અને તમારી ખરીદીની કિંમત કે નફો માત્ર તમારા જ ફોનમાં દેખાય.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 font-semibold border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> સ્ટાફ માટે કેશિયર લિમિટેડ એક્સેસ</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> માલિક માટે ઓનર પાસવર્ડ સિક્યોરિટી</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> એન્ડ્રોઇડ ફોનથી બારકોડ સ્કેનિંગ</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 8. OFFICIAL POS SUBSCRIPTION PRICING SECTION (EXACT TO SETTINGS) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-slate-100/80 to-white rounded-3xl border border-slate-200/90 shadow-sm my-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-300">
            <Crown className="w-4 h-4 text-amber-600" />
            <span>DavaSetu POS સત્તાવાર લાયસન્સ પ્લાન્સ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
            તમારા મેડિકલ સ્ટોર માટે શ્રેષ્ઠ પ્લાન પસંદ કરો
          </h2>
          <p className="mt-3 text-slate-600 text-base">
            કોઈ છૂપી ફી નહીં. અનલિમિટેડ દવાઓ, ગ્રાહક રેકોર્ડ અને ૨૪/૭ પ્રાયોરિટી સપોર્ટ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* PLAN 1: MONTHLY PRO */}
          <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">માસિક પ્લાન</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Monthly Pro</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">સ્વતંત્ર રિટેલ કાઉન્ટર્સ માટે બેઝિક ક્લાઉડ POS પ્લાન.</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">₹799</span>
                <span className="text-sm font-bold text-slate-500">/ મહિનો</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>અનલિમિટેડ કાઉન્ટર બિલિંગ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>થર્મલ પ્રિન્ટર સપોર્ટ (2" & 3" ESC/POS)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>બેઝિક સેલ્સ & ડેઇલી કેશ રિપોર્ટ્સ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>મોબાઇલ એપ એક્સેસ (૧ ફોન ટર્મિનલ)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ક્લાઉડ ઓટો સિંક & સુરક્ષિત બેકઅપ</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 transition"
            >
              મંથલી પ્લાન પસંદ કરો
            </button>
          </div>

          {/* PLAN 2: YEARLY PREMIUM (BEST VALUE) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 border-2 border-emerald-600 shadow-2xl shadow-emerald-600/15 flex flex-col justify-between relative scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>સૌથી લોકપ્રિય • માત્ર ₹16/દિવસ</span>
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">વાર્ષિક પ્લાન (Best Value)</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Yearly Premium</h3>
              <p className="text-xs text-slate-600 mt-2 font-medium">સંપૂર્ણ AI-પાવર્ડ ફાર્મસી ERP વ્યસ્ત મેડિકલ સ્ટોર માટે.</p>
              
              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-800">₹5,999</span>
                  <span className="text-sm font-bold text-slate-500">/ વર્ષ</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                    માત્ર ₹16/દિવસ • વાર્ષિક ₹3,500+ ની બચત!
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-800 font-bold">
                <li className="flex items-center gap-2.5 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Monthly Pro ના તમામ ફીચર્સ શામેલ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>સ્માર્ટ ઇન્વેન્ટરી (AI) & ૩૦-૬૦-૯૦ દિવસ એક્સપાયરી શિલ્ડ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>૭-દિવસ એડવાન્સ્ડ સેલ્સ ટ્રેન્ડ્સ & એનાલિટિક્સ</span>
                </li>
                <li className="flex items-center gap-2.5 text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>મોબાઇલ એપ + મલ્ટી-ડિવાઇસ રીઅલ-ટાઇમ ક્લાઉડ સિંક</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>સ્ટાફ ફોન બારકોડ સ્કેનર સપોર્ટ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ડિસ્ટ્રીબ્યુટર પર્ચેઝ ઈન્વર્ડ & લેજર</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>૨૪/૭ ફોન & વોટ્સએપ પ્રાયોરિટી સપોર્ટ</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition"
            >
              વાર્ષિક પ્લાન પર અપગ્રેડ કરો
            </button>
          </div>

          {/* PLAN 3: FOUNDER'S LIFETIME */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 bg-amber-400/10 w-32 h-32 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">આજીવન પ્લાન (Lifetime)</span>
              <h3 className="text-2xl font-black text-white mt-1">Founder's Lifetime</h3>
              <p className="text-xs text-slate-300 mt-2 font-medium">એક જ વાર ચૂકવો, આજીવન ચલાવો. ક્યારેય કોઈ રિન્યુઅલ નહીં.</p>
              
              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹24,999</span>
                  <span className="text-sm text-amber-400 font-bold"> એક જ વાર</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                    👑 ઝીરો રિન્યુઅલ ફી — લાઈફટાઈમ ફ્રી
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-200 font-medium">
                <li className="flex items-center gap-2.5 font-bold text-amber-300">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>આજીવન સંપૂર્ણ સોફ્ટવેર & ક્લાઉડ એક્સેસ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>કોઈ માસિક કે વાર્ષિક રિન્યુઅલ ચાર્જ નહીં</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>લાઈફટાઈમ મોબાઈલ એપ & રીઅલ-ટાઇમ સિંક</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>અનલિમિટેડ સ્ટાફ મોબાઈલ સ્કેનર સીટ્સ</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ભવિષ્યના તમામ AI & ERP અપડેટ્સ ફ્રી</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>VIP ૨૪/૭ ડેડિકેટેડ એકાઉન્ટ મેનેજર</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition relative z-10"
            >
              લાઈફટાઈમ ડીલ મેળવો
            </button>
          </div>

        </div>

        {/* MOBILE-ONLY PASS COMPANION BANNER */}
        <div className="mt-10 max-w-6xl mx-auto p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-200 text-amber-900 shrink-0 border border-amber-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-base text-amber-950">Mobile-Only Pro Pass — ₹1,499 / વર્ષ</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  📱 Mobile Phone Only
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed font-medium">
                ખાસ એવા કેમિસ્ટ મિત્રો માટે જેમના સ્ટોર પર PC કે લેપટોપ નથી અને માત્ર એન્ડ્રોઇડ સ્માર્ટફોન કે ટેબ્લેટથી દુકાન ચલાવે છે. Full Mobile Billing, Barcode Camera Scan, Inventory & WhatsApp Invoicing.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition shrink-0 shadow-sm"
          >
            મોબાઈલ પાસ જુઓ
          </button>
        </div>

        {/* Razorpay badge */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>પેમેન્ટ ૧૦૦% સુરક્ષિત Razorpay દ્વારા પ્રોસેસ થાય છે. ત્વરિત એક્ટિવેશન, કોઈ એક્સ્ટ્રા ચાર્જ નહીં.</span>
        </div>
      </section>

      {/* 9. CHEMIST TESTIMONIALS (REAL GUJARAT & INDIA PHARMACY STORIES) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            કેમિસ્ટ મિત્રોનો અનુભવ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            મેડિકલ સ્ટોર ઓનર્સ શું કહે છે?
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            ગુજરાતના ૫૦૦+ સફળ કેમિસ્ટ સ્ટોર્સ DavaSetu થી પોતાનો વેપાર વધારી રહ્યા છે.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "પહેલા સાંજે ગ્રાહકોની લાંબી લાઇન લાગતી અને જૂના સોફ્ટવેરમાં બિલ બનતા ૩ મિનિટ થતી. DavaSetu થી હવે ૩ સેકન્ડમાં બારકોડ સ્કેન થઈને બિલ નીકળી જાય છે!"
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                JP
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">જયેશભાઈ પટેલ</p>
                <p className="text-xs text-slate-500">શ્રીજી મેડિકલ, અમદાવાદ</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "મારા સ્ટોર પર દર મહિને ₹૧૫,૦૦૦ થી ૨૦,૦૦૦ ની દવા એક્સપાયર થઈને ફેંકી દેવી પડતી. DavaSetu ના એક્સપાયરી એલર્ટથી ૯૦ દિવસ પહેલા જ ડિસ્ટ્રીબ્યુટરને માલ પાછો આપી દીધો. આખો પ્લાન પહેલા મહિને જ વસૂલ થઈ ગયો!"
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                BS
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">ભાવિન શાહ</p>
                <p className="text-xs text-slate-500">લાઈફકેર કેમિસ્ટ, સુરત</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "હું બહારગામ હોઉં તો પણ મારા ફોનમાં લાઈવ દેખાય છે કે સ્ટોર પર કેટલો ગલ્લો થયો. જૂના સોફ્ટવેર કરતા ઘણું આસાન છે, નવો સ્ટાફ પણ ૨ જ દિવસમાં શીખી ગયો."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-sm">
                RM
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">રાહુલ મહેતા</p>
                <p className="text-xs text-slate-500">મહેતા ફાર્મા, વડોદરા</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">વારંવાર પૂછાતા પ્રશ્નો (FAQ)</h2>
          <p className="mt-2 text-slate-600 text-sm">DavaSetu સ્વીચ કરતા પહેલા તમારા મનમાં થતા પ્રશ્નોના જવાબો.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left font-bold text-slate-900 text-base sm:text-lg flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. BOTTOM HIGH-CONVERSION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
              ૧૫ દિવસ ફ્રી ટ્રાયલ • ઝીરો રિસ્ક
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
              આજે જ તમારા ફાર્મસી સ્ટોરને સ્માર્ટ બનાવો
            </h2>
            <p className="mt-4 text-emerald-100 text-sm sm:text-base leading-relaxed">
              હમણાં જ શરૂ કરો. માત્ર ૨ મિનિટમાં તમારું એકાઉન્ટ સેટઅપ થઈ જશે અને તમે કાઉન્ટર બિલિંગ શરૂ કરી શકશો.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{isLoggedIn ? 'Go to POS Dashboard' : 'Open Web POS (ફ્રી ટ્રાયલ)'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-700" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/60 text-white font-bold text-sm border border-emerald-400/30 transition"
              >
                કેમિસ્ટ લોગિન
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-xl text-slate-900">
                Dava<span className="text-emerald-600">Setu</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">POS</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              ભારતભરના રિટેલ કેમિસ્ટ અને ફાર્મા ડિસ્ટ્રીબ્યુટર્સ માટે આધુનિક ક્લાઉડ બિલિંગ, ઇન્વેન્ટરી અને જીએસટી મેનેજમેન્ટ સોફ્ટવેર.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">POS મોડ્યુલ્સ</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate(isLoggedIn ? '/billing' : '/login')} className="hover:text-emerald-600">કાઉન્ટર બિલિંગ (POS)</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} className="hover:text-emerald-600">સ્માર્ટ બેચ & એક્સપાયરી</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/purchases' : '/login')} className="hover:text-emerald-600">ડિસ્ટ્રીબ્યુટર પર્ચેઝ ઈન્વર્ડ</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/customers' : '/login')} className="hover:text-emerald-600">ગ્રાહક ખાતાવહી (Khata)</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">હાર્ડવેર સપોર્ટ</h4>
            <ul className="space-y-2">
              <li>TVS & NGX બારકોડ સ્કેનર્સ</li>
              <li>2" & 3" થર્મલ પ્રિન્ટર્સ (Epson, TVS)</li>
              <li>લેસર જીએસટી A4/A5 ઇનવોઇસ</li>
              <li>એન્ડ્રોઇડ સ્માર્ટફોન & ટેબ્લેટ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">સપોર્ટ & હેલ્પલાઇન</h4>
            <ul className="space-y-2 font-medium">
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-600" /> હેલ્પલાઇન: +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-600" /> support@davasetu.com</li>
              <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-emerald-600" /> સુરક્ષિત ક્લાઉડ ડેટાબેઝ</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
          <p>© {new Date().getFullYear()} DavaSetu Pharmacy Cloud POS. સર્વાધિકાર સુરક્ષિત.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="hover:text-emerald-600">Chemist Login</button>
            <span>•</span>
            <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="hover:text-emerald-600">Launch POS</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
