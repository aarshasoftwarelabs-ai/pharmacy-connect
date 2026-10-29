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
  Send,
  Play,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Cpu,
  BadgeCheck,
  Pill,
  FileCheck,
  LogIn,
  FolderSync
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
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [receiptSimulated, setReceiptSimulated] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customerPhone] = useState('9876543210');
  const [customerName] = useState('Rajesh Patel');
  const [activeStudioTab, setActiveStudioTab] = useState<'billing' | 'generic' | 'expiry' | 'purchases' | 'compliance' | 'mobile'>('billing');

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
      q: 'Can I easily import my existing medicine inventory from my old software or Excel?',
      a: 'Yes, absolutely! DavaSetu includes an instant 1-click Excel/CSV inventory migration tool. Upload your existing medicine catalog, batches, purchase rates, and supplier lists in under 5 minutes without interrupting your daily counter sales.'
    },
    {
      q: 'Can I monitor store sales and inventory from home on my mobile phone?',
      a: 'Yes! DavaSetu is 100% cloud-powered. Whether you are at home, travelling, or managing multiple medical stores, you can view live real-time counter sales, cash registers, low-stock warnings, and staff activity directly on your smartphone.'
    },
    {
      q: 'Does it work with my existing USB barcode scanner and thermal receipt printer?',
      a: 'Yes, 100%! DavaSetu supports all standard 1D/2D USB, Bluetooth, and wireless barcode scanners, as well as 2-inch (58mm) and 3-inch (80mm) thermal printers (TVS, Epson, NGX, Posiflex) and regular A4/A5 laser invoice printers.'
    },
    {
      q: 'How does the Smart Expiry Shield save me money?',
      a: 'Our automated FIFO tracking flags medicines nearing expiration at 30, 60, and 90-day intervals with intelligent color-coded badges. It automatically generates supplier debit return notes so you can return medicines before expiry and claim full credit.'
    },
    {
      q: 'What happens if our internet connection is temporarily slow or down?',
      a: 'DavaSetu has built-in offline resiliency. Counter billing continues uninterrupted even during internet fluctuations. Once your connection restores, all bills, receipts, and inventory deductions automatically sync to the secure cloud.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white antialiased">

      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-white text-xs sm:text-sm font-medium py-2.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="w-full max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase">
              VERSION 1.0 LIVE
            </span>
            <span className="text-slate-300">
              Trusted by 1,200+ Retail Chemists & Pharmacies across India
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              15-Day Free Trial • Instant POS Access
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-slate-300 text-xs whitespace-nowrap">
            <a
              href="tel:+919664781007"
              className="hidden lg:inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" /> Support: +91 96647 81007
            </a>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition text-xs shadow-xs"
                >
                  <span>Go to POS Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  {/* CHEMIST SIGN IN */}
                  <button
                    onClick={() => navigate('/login?mode=login')}
                    className="px-2.5 py-1 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 hover:bg-slate-800 rounded-lg transition text-xs"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Chemist Sign In</span>
                  </button>

                  <span className="text-slate-700">|</span>

                  {/* CHEMIST SIGN UP */}
                  <button
                    onClick={() => navigate('/login?mode=signup')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Chemist Sign Up</span>
                    <span className="hidden sm:inline-flex text-[9px] bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded font-black">
                      15 Days Free
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-950" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODERN FLOATING GLASS HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">

          {/* BRAND LOGO */}
          <Link to="/" className="flex items-center gap-3 shrink-0 select-none">
            <img
              src="/davasetu_logo.png"
              alt="DavaSetu Pharmacy POS"
              className="h-9 sm:h-10 w-auto object-contain"
            />
            <div className="hidden 2xl:flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                POS 3.0 Cloud ERP
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION PILLS - CLEAN & SPACIOUS */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 xl:gap-8 text-xs sm:text-sm font-bold text-slate-600 whitespace-nowrap">
            <a href="#solutions" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Solutions</a>
            <a href="#interactive-simulator" className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>Live Demo</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded-full font-black uppercase tracking-wide leading-none shrink-0">Try</span>
            </a>
            <a href="#comparison" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Why DavaSetu?</a>
            <a href="#migration" className="hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>Smart Migration</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-200 leading-none shrink-0">2 Min</span>
            </a>
            <a href="#features" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Modules</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors whitespace-nowrap">Pricing</a>
            <a href="#faq" className="hover:text-emerald-600 transition-colors whitespace-nowrap">FAQ</a>
          </nav>
        </div>
      </header>

      {/* 3. HERO SECTION - ASYMMETRIC 2-COLUMN SPLIT LAYOUT (NOT CENTERED TEXT!) */}
      <section className="relative pt-6 pb-14 lg:pt-8 lg:pb-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/20 border-b border-slate-200">

        {/* Subtle decorative background mesh */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/60 via-teal-100/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            {/* LEFT COLUMN: PUNCHY COPY & VALUE PROPS (7 COLS) */}
            <div className="lg:col-span-7 pt-1 lg:pt-2">

              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black mb-4 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Next-Gen Pharmacy Cloud ERP & Counter POS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                The Modern POS Built Exclusively for{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                  Retail Pharmacies.
                </span>
              </h1>

              {/* Subtext */}
              <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl leading-relaxed font-medium">
                Speed up checkouts during evening rush, eliminate expired medicine losses with automated return alerts, and track daily sales from your phone anywhere.
              </p>

              {/* Metric Highlights Strip */}
              <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-lg sm:text-xl">
                    <Zap className="w-4 h-4" /> 3 Sec
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Counter Checkout</p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-teal-600 font-black text-lg sm:text-xl">
                    <ShieldCheck className="w-4 h-4" /> 0%
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Expiry Deadstock</p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5 text-cyan-600 font-black text-lg sm:text-xl">
                    <CheckCircle className="w-4 h-4" /> 100%
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">GST & Cloud Auto-Sync</p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <button
                  onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                  className="px-7 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-700/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3"
                >
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span>{isLoggedIn ? 'Go to POS Terminal' : 'Start 15-Day Free Trial'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <a
                  href="#interactive-simulator"
                  className="px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Try Interactive Demo</span>
                </a>
              </div>

              {/* Trust Badges Footer */}
              <div className="mt-6 flex items-center gap-3 sm:gap-4 text-xs font-bold text-slate-500">
                <div className="flex -space-x-2">
                  <span className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">JP</span>
                  <span className="w-7 h-7 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">BS</span>
                  <span className="w-7 h-7 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">RM</span>
                </div>
                <span>Rated 4.9/5 by 1,200+ Pharmacists • No Credit Card Required</span>
              </div>

            </div>

            {/* RIGHT COLUMN: LIVE INTERACTIVE WORKSTATION WIDGET (5 COLS) */}
            <div className="lg:col-span-5 relative">

              {/* Decorative Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-20 transform rotate-1" />

              <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 p-6 flex flex-col justify-between">

                {/* Header Strip */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <span className="font-black text-sm text-slate-900 block">Live Counter POS Terminal</span>
                      <span className="text-[11px] text-slate-400 font-medium">Counter 01 • Instant Billing</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    Active Session
                  </span>
                </div>

                {/* Patient / Doctor Tag */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                    <p className="font-bold text-slate-800">Rajesh Patel (+91 98251-XXXXX)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white text-slate-600 font-mono text-[11px] border">
                    Dr. N. K. Shah
                  </span>
                </div>

                {/* Scanned Items Mock List */}
                <div className="mt-4 space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-900">Augmentin 625 Duo Tab</p>
                      <p className="text-[10px] text-slate-500 font-mono">Batch: AUG-41 • Exp: 08/26 • GSK</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">₹201.20</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">Qty: 1 (12% Disc)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-900">Pantocid DSR Capsule</p>
                      <p className="text-[10px] text-slate-500 font-mono">Batch: PAN-109 • Exp: 05/27 • Sun Pharma</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">₹189.00</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">Qty: 1 (15% Disc)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-900">Dolo 650mg Paracetamol</p>
                      <p className="text-[10px] text-slate-500 font-mono">Batch: DL-221 • Exp: 11/27 • Micro</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">₹31.50</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">Qty: 1 (10% Disc)</span>
                    </div>
                  </div>
                </div>

                {/* Live Checkout Summary Box */}
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Subtotal: ₹421.70</span>
                    <span className="text-emerald-400 font-bold">Savings: -₹55.70</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-xs text-slate-300 font-bold block">Net Invoice Total:</span>
                      <span className="text-[10px] text-slate-400">Incl. CGST + SGST (12%)</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">₹409.92</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => navigate('/login')}
                      className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Thermal Bill</span>
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>WhatsApp Bill</span>
                    </button>
                  </div>
                </div>

                {/* Floating Revenue Pill */}
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Today's Store Total: ₹48,250
                  </span>
                  <span className="font-bold text-emerald-700">142 Invoices</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. HARDWARE & COMPATIBILITY TRUST STRIP */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-400">Seamless Integration:</span>
            <span className="flex items-center gap-2"><QrCode className="w-4 h-4 text-emerald-600" /> All USB & Wireless Barcode Scanners</span>
            <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-emerald-600" /> 2" & 3" Thermal Receipt Printers</span>
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> A4 & A5 Laser GST Invoices</span>
            <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-600" /> Android Tablet & Mobile Phones</span>
            <span className="flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" /> Auto Cloud Backup</span>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FEATURE STUDIO (TABBED WORKFLOW LAYOUT) */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Interactive Workflow Studio
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            Engineered for Every Corner of Your Pharmacy
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Click on any module below to inspect how DavaSetu automates your daily medical store routine.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: 'billing', label: '1. Ultra-Fast Billing', icon: Receipt },
            { id: 'generic', label: '2. Smart Generic & Salt Finder', icon: Pill },
            { id: 'expiry', label: '3. Smart Expiry Shield', icon: ShieldCheck },
            { id: 'purchases', label: '4. Supplier Inward & PO', icon: Truck },
            { id: 'compliance', label: '5. Schedule H1 & Drug Register', icon: FileCheck },
            { id: 'mobile', label: '6. Mobile Phone Live Sync', icon: Smartphone }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeStudioTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStudioTab(tab.id as any)}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-105'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Showcase Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl max-w-5xl mx-auto">
          {activeStudioTab === 'billing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Checkout Automation</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">3-Second Barcode & Hotkey Counter Billing</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Type just 2 letters of any medicine name or zap with your barcode scanner. Pull batch number, expiry date, MRP, and shelf location instantly. Handles loose strips, cut blister packs, and multi-mode payment splits with zero lag.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fast hotkeys (F1 Search, F2 Tender, F8 Print)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant GST calculation with HSN auto-fill</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> WhatsApp invoice dispatch directly to customer mobile</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-2">SCANNER FEED: ACTIVE</div>
                <p>➔ Scanned: 8901117254012 (Dolo 650)</p>
                <p>➔ Batch: BT-9421 • Exp: 11/27 • Rack: A-04</p>
                <p>➔ In Stock: 84 Strips • MRP: ₹31.50</p>
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  Bill #10842 generated in 2.1 seconds.
                </div>
              </div>
            </div>
          )}

          {activeStudioTab === 'generic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">High-Margin Substitution</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Smart Generic & Salt Composition Finder</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  When a customer requests an expensive branded medicine or when an item is out of stock, DavaSetu instantly reveals equivalent generic alternatives with the exact same chemical salt composition (e.g. Amoxicillin + Clavulanic Acid). Pass on savings to your patients while boosting your pharmacy's gross profit margin by 30% to 45%!
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant 1-second salt & chemical molecule database matching</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Compare live stock, packaging, and manufacturer quality</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Earn 30%–45% higher retail margin on equivalent ethical generics</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-950 text-white text-xs space-y-3 shadow-lg">
                <div className="font-bold text-emerald-400 border-b border-emerald-800/80 pb-2 flex justify-between items-center">
                  <span>SMART SALT COMPOSITION RADAR</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">MATCH: 100%</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">Active Salt: Amoxicillin (500mg) + Clavulanic Acid (125mg)</p>

                <div className="space-y-2 pt-1 font-mono">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Augmentin 625 Duo (GSK)</p>
                      <span className="text-[10px] text-slate-400">Branded • Margin: 16%</span>
                    </div>
                    <span className="font-bold text-slate-300">₹201.20</span>
                  </div>

                  <div className="p-2.5 bg-emerald-900/70 rounded-xl border-2 border-emerald-400 flex justify-between items-center text-white">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-emerald-200">Moxikind-CV 625 (Mankind)</p>
                        <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">RECOMMENDED</span>
                      </div>
                      <span className="text-[10px] text-emerald-300">Generic Substitute • Margin: 38% (+22% Profit)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-300">₹178.50</span>
                      <span className="block text-[9px] text-emerald-400 font-bold">Patient saves ₹22.70</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Novamox-CV 625 (Cipla)</p>
                      <span className="text-[10px] text-slate-400">Ethical Generic • Margin: 32%</span>
                    </div>
                    <span className="font-bold text-slate-300">₹182.00</span>
                  </div>
                </div>

                <div className="p-2 bg-emerald-900/40 rounded-lg border border-emerald-500/30 text-[11px] text-emerald-300 text-center font-bold">
                  💡 Suggesting Moxikind-CV saves patient money & increases chemist profit by +22%!
                </div>
              </div>
            </div>
          )}

          {activeStudioTab === 'expiry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Zero Stock Loss</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Automated 30-60-90 Day Expiry Shield</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Stop throwing away thousands of rupees in expired medicines every month. DavaSetu automatically groups near-expiry medicines by distributor and generates ready-to-dispatch debit return notes before return deadlines close.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Color-coded expiry alerts right during counter billing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> FIFO (First-In First-Out) stock rotation algorithm</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> 1-Click distributor return voucher generation</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-3">
                <div className="font-bold flex items-center justify-between border-b border-amber-200 pb-2">
                  <span>EXPIRY ACTION LIST</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px]">60 DAYS WARNING</span>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200 flex justify-between font-bold">
                  <span>Augmentin 625 Duo (AUG-441)</span>
                  <span className="text-rose-600">12 Strips • Return to Apex Pharma</span>
                </div>
                <div className="p-2 bg-white rounded border border-amber-200 flex justify-between font-bold">
                  <span>Azithral 500mg (AZ-772)</span>
                  <span className="text-amber-700">8 Strips • Return to Sun Dist.</span>
                </div>
                <p className="text-[11px] text-amber-800 font-semibold">Total Recoverable Supplier Credit: ₹4,180.00</p>
              </div>
            </div>
          )}

          {activeStudioTab === 'purchases' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Procurement & Schemes</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Supplier Purchase Orders & Free Schemes</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Fast inward entries for complex pharma distributor purchase invoices. Automatically applies free schemes (10+1, 10+2, 20+3), tracks trade discounts, and reconciles input tax credit (ITC) for stress-free GST compliance.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Supplier ledger with payment due date alerts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Automatic cost price & selling MRP margin calculation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-600" /> Purchase return debit note tracking</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-950 text-xs space-y-3 font-mono">
                <div className="font-bold border-b border-cyan-200 pb-2">PURCHASE INWARD: #PO-9402</div>
                <p>Distributor: Apex Pharma Distributors</p>
                <p>Scheme: 10 Boxes + 1 Free Box Applied</p>
                <p>Trade Discount: 4.5% • Margin: 28.4%</p>
                <div className="p-2 bg-white rounded border border-cyan-300 font-bold text-cyan-900">
                  Stock quantity updated in inventory automatically.
                </div>
              </div>
            </div>
          )}

          {activeStudioTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Drug Inspector Ready</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Schedule H, H1 & Narcotic Compliance Register</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Never stress about surprise FDA Drug Inspector audits. DavaSetu automatically logs doctor registration numbers, patient contact details, batch numbers, and dispensed dates during counter checkout. Generates government-mandated Schedule H1 & Narcotic registers in 1 click.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Mandatory Schedule H1 antibiotic & narcotic auto-logging</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Doctor registration number & patient address auto-linking</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Instant 1-click export for FDA & Drug Inspector audits</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 text-xs space-y-3 font-mono shadow-sm">
                <div className="font-bold border-b border-rose-200 pb-2 flex justify-between items-center text-rose-900">
                  <span>SCHEDULE H1 DRUG AUDIT REGISTER</span>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">100% FDA COMPLIANT</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Patient: Rajesh Patel (+91 98251-XXXXX)</span>
                    <span className="text-rose-700">Bill #10842</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Doctor: Dr. N. K. Shah (Reg No: G-39420 • Civil Hospital)</p>
                  <p className="text-slate-800 font-bold">Dispensed: Alprazolam 0.5mg Tab (Batch: AL-902)</p>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[10px] text-emerald-700 font-bold">
                    <span>Qty: 10 Tablets</span>
                    <span>✓ Auto-Logged to H1 Register</span>
                  </div>
                </div>

                <div className="p-2.5 bg-rose-100/70 rounded-lg border border-rose-300 text-[11px] text-rose-900 text-center font-bold">
                  🛡️ Zero penalty risk: Ready-to-print inspection log for Drug Inspectors!
                </div>
              </div>
            </div>
          )}

          {activeStudioTab === 'mobile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Remote Store Freedom</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Live Sales & Stock on Your Smartphone</h3>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                  Never remain in the dark when away from the counter. Check real-time gross revenue, cash drawer balances, stock availability, and employee activities on your phone without installing bulky software or remote desktop tools.
                </p>
                <ul className="mt-6 space-y-2.5 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time mobile dashboard synced with counter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Staff security locks (cashiers cannot edit purchase rates)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Camera barcode scan for instant stock checking on phone</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900 text-white text-xs space-y-3">
                <div className="font-bold text-emerald-400 border-b border-slate-800 pb-2 flex justify-between">
                  <span>MOBILE APP LIVE RADAR</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">SYNCED</span>
                </div>
                <p>🏪 Today's Gross Revenue: ₹48,250.00</p>
                <p>💵 Cash in Drawer: ₹18,400.00 • UPI: ₹29,850.00</p>
                <p>📦 Current Low Stock Alerts: 4 Items</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. COMPARISON MATRIX: LEGACY DESKTOP SOFTWARE VS DAVASETU */}
      <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-100/70 rounded-3xl my-10 border border-slate-200">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Real Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            Why Hundreds of Chemists Are Replacing Legacy Software
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            See the difference between old desktop software and DavaSetu Cloud POS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* LEGACY SOFTWARE */}
          <div className="p-8 rounded-3xl bg-white border-2 border-rose-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center text-sm shrink-0">✕</span>
                <h3 className="font-black text-xl text-slate-900">Legacy Offline Pharmacy Software</h3>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Hard drive crash = All data lost:</strong> If the shop computer crashes or gets infected with a virus, months of sales records and customer ledgers vanish forever.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Painful manual re-entry to switch:</strong> Moving away from old software requires typing thousands of medicines, batches, and purchase rates one by one.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Hours wasted on purchase entries:</strong> Manually typing 10-page distributor bills every evening causes fatigue, batch typos, and delayed shop closing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Takes 2 months to train staff:</strong> Complex F-key shortcuts and DOS-style menus mean you cannot leave a new operator alone at the billing counter.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Zero remote access from mobile:</strong> When away from the store, you have zero visibility into daily cash collections, sales, or staff activities.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Expensive expired medicine deadstock:</strong> Without automated expiry alerts, expired medicines sit on shelves until distributors refuse returns.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Paper slips lost, no WhatsApp bills:</strong> Customers lose printed thermal slips; no digital prescription history or patient contact logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Heavy annual AMC charges:</strong> Forced to pay ₹5,000–₹10,000 every year for basic renewal, paid version updates, and technician visits.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-rose-100 text-xs font-bold text-rose-700">
              Result: Hardware crashes, manual purchase fatigue, heavy AMC fees, and ₹15,000+ monthly loss from expired stock.
            </div>
          </div>

          {/* DAVASETU */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-white to-emerald-50/50 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0">✓</span>
                <h3 className="font-black text-xl text-slate-900">DavaSetu Cloud POS</h3>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-800 font-semibold">
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>100% Automated Cloud Backup:</strong> Never worry about hardware crashes. Login from any laptop, tablet, or PC and resume billing in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1-Click Instant Data Migration:</strong> Upload your existing software backup or Excel file (or send on WhatsApp); your entire stock is live in 2 minutes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>10-Second Distributor CSV/Invoice Import:</strong> Directly import distributor purchase files with automated batch creation, expiry matching, and GST sync.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Anyone learns in 5 minutes:</strong> Intuitive touchscreen, instant generic salt finder, and barcode scanning empower any junior staff member immediately.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Live mobile store tracking:</strong> Monitor real-time counter sales, cash registers, low-stock warnings, and profit margins from anywhere on your phone.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Automated 30-60-90 Day Expiry Alerts:</strong> Return near-expiry medicines to distributors on time with auto-generated debit notes to recover 100% credit.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1-Click WhatsApp Invoices & Patient Ledger:</strong> Send elegant GST digital bills directly to customer's WhatsApp; maintain full patient credit logs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero AMC & Lifetime Free Cloud Updates:</strong> Continuous new features, GST compliance updates, and unlimited cloud storage with zero renewal fees.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-200 text-xs font-bold text-emerald-800">
              Result: 3-second counter billing, 1-click migration, WhatsApp invoices, zero expiry waste, and 100% peace of mind.
            </div>
          </div>

        </div>
      </section>

      {/* 6.5 SMART MIGRATION SECTION: SHIFT FROM OLD SOFTWARE / EXCEL */}
      <section id="migration" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 border border-emerald-500/30 shadow-2xl relative overflow-hidden">

          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left Column: Value Prop & Explanation */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-4">
                <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Downtime Data Migration</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Switch from <span className="text-emerald-400">Any Old Software or Excel</span> in Under 2 Minutes.
              </h2>

              <p className="mt-4 text-slate-300 text-base leading-relaxed font-medium">
                Already using an older desktop software? Don't type a single medicine manually. DavaSetu automatically imports your entire catalog, live batches, expiry dates, purchase rates, and MRPs with 100% data fidelity.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">1-Click Universal Stock Import</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Auto-matches Excel/CSV stock columns and batch date formats seamlessly.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Zero Counter Downtime</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Shift your store in minutes without stopping a single customer bill.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Auto Generic Enrichment</h4>
                    <p className="text-xs text-slate-400 mt-0.5">50,000+ medicine master automatically links salt compositions.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">100% Data Integrity</h4>
                    <p className="text-xs text-slate-400 mt-0.5">All batch numbers, expiry months, and purchase rates preserved.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Migration Action Box */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-7 shadow-2xl flex flex-col justify-between">

                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                      <FolderSync className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">Migration Options</span>
                      <span className="text-[11px] text-emerald-300 font-semibold">Self-Serve or Assisted</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30">
                    Free Forever
                  </span>
                </div>

                <div className="my-6 space-y-4">
                  {/* Option 1: In-App Wizard */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">Method 1: 1-Click Self Import</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">Fastest</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Upload your exported stock or inventory Excel/CSV file directly inside the DavaSetu software inventory wizard.
                    </p>
                    <button
                      onClick={() => navigate(isLoggedIn ? '/inventory' : '/login?mode=signup')}
                      className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2"
                    >
                      <span>Launch In-App Migration Wizard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Option 2: WhatsApp Assisted */}
                  <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-200 text-sm">Method 2: Free WhatsApp Migration</span>
                      </div>
                      <span className="text-[10px] uppercase font-black text-slate-900 bg-emerald-400 px-2 py-0.5 rounded">VIP Support</span>
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-1">
                      Don't want to upload files yourself? Send your backup Excel/CSV or software export to our WhatsApp. Our team loads your stock in 15 minutes!
                    </p>
                    <a
                      href="https://wa.me/919664781007?text=Hello%20DavaSetu%20Team%2C%20I%20want%20to%20migrate%20my%20pharmacy%20stock%20to%20DavaSetu.%20Here%20is%20my%20backup%20file."
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Send Backup on WhatsApp (+91 96647 81007)</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Your pharmacy inventory data remains 100% confidential & encrypted.</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE LIVE COUNTER SIMULATOR */}
      <section id="interactive-simulator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl my-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-3 border border-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Live Counter Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Test Counter Billing Speed Right Now
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base font-medium">
            Click on medicines below to simulate barcode scan, automated discounts, and instant receipt generation!
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
                    <span>Click any medicine to simulate barcode scan:</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">6 Demo Items</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_MEDS.map((med) => {
                    const isInCart = cart.some(c => c.id === med.id);
                    return (
                      <button
                        key={med.id}
                        onClick={() => addSampleMed(med)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between group ${isInCart
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

              {/* Patient info in simulator */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Customer WhatsApp:</span>
                    <p className="font-bold text-xs text-white">{customerName} ({customerPhone})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Preview WhatsApp Receipt</span>
                </button>
              </div>
            </div>

            {/* Right: Cart & Calculation */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Counter Bill Summary</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{cart.length} item(s)</span>
                </div>

                <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Click any medicine on the left to add to bill!
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
                  <span>Gross MRP Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-teal-400">
                  <span>Discount Savings:</span>
                  <span>- ₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST Tax (CGST+SGST 12%):</span>
                  <span>+ ₹{calculateGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>Net Payable Amount:</span>
                  <span className="text-emerald-400 text-xl font-black">₹{calculateTotal()}</span>
                </div>

                {/* Payment Selector */}
                <div className="pt-2 grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'CARD'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${paymentMode === mode
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI QR' : mode === 'CASH' ? '💵 Cash' : '💳 Card'}
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
                  <span>{receiptSimulated ? '✓ Bill Printed & WhatsApp Receipt Dispatched!' : 'Simulate 3-Sec Print & WhatsApp Bill'}</span>
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
                  <p className="text-xs text-slate-500">Delivered directly to patient's mobile</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 space-y-2 font-mono">
                <p className="font-bold text-emerald-900">🏥 DavaSetu Pharmacy</p>
                <p>Hello {customerName},</p>
                <p>Your medicine invoice #{Math.floor(Math.random() * 9000 + 1000)} is ready.</p>
                <p>Net Total: <strong>₹{calculateTotal()}</strong></p>
                <p className="text-emerald-700 underline">👉 Click here to download your GST PDF Bill</p>
                <p className="text-[10px] text-slate-500 pt-2 border-t border-emerald-200">Sent via DavaSetu Cloud POS</p>
              </div>

              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full mt-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 8. OFFICIAL POS SUBSCRIPTION PLANS (EXACT TO SETTINGS - 100% ENGLISH) */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-slate-100/90 via-white to-slate-50 rounded-3xl border border-slate-200 shadow-sm my-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-3 border border-emerald-300">
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Official POS Subscription & Licensing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
            Choose the Right Plan for Your Pharmacy
          </h2>
          <p className="mt-3 text-slate-600 text-base font-medium">
            Start with our <strong>15-Day Free Trial</strong> (no credit card required). Continue seamlessly by choosing the subscription plan that best fits your pharmacy.
          </p>
        </div>

        {/* 15-DAY FREE TRIAL HIGHLIGHT BANNER */}
        <div className="max-w-4xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-emerald-950">
                15-Day Risk-Free Full Access Trial
              </h4>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                Test unlimited counter billing, thermal printing, generic finder & expiry alerts 100% free. When you want to continue after 15 days, choose any plan below to keep using without interruption.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login?mode=signup')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-sm transition shrink-0"
          >
            Start Free 15-Day Trial →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">

          {/* PLAN 1: MONTHLY PRO */}
          <div className="p-8 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Monthly Pass</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Monthly Pro</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Essential cloud POS billing for independent retail counters.</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">₹799</span>
                <span className="text-sm font-bold text-slate-500">/ month</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Counter Billing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Thermal Printer Support (2" & 3" ESC/POS)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Basic Sales & Daily Register Reports</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mobile App Access (1 Phone Terminal)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cloud Auto Sync & Secure Data Backup</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 transition"
            >
              Select Monthly
            </button>
          </div>

          {/* PLAN 2: YEARLY PREMIUM (BEST VALUE) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-emerald-50/50 border-2 border-emerald-600 shadow-2xl shadow-emerald-600/15 flex flex-col justify-between relative scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>Best Value • Just ₹16/Day</span>
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">Annual Pass</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Yearly Premium</h3>
              <p className="text-xs text-slate-600 mt-2 font-medium">Complete AI-powered pharmacy ERP for high-volume stores.</p>

              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-800">₹5,999</span>
                  <span className="text-sm font-bold text-slate-500">/ year</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                    Just ₹16/day • Save over ₹3,500/year!
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-800 font-bold">
                <li className="flex items-center gap-2.5 text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Everything in Monthly Pro</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Smart Inventory (AI) & 30-60-90 Day Expiry Shield</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>7-Day Advanced Sales Trends & Analytics</span>
                </li>
                <li className="flex items-center gap-2.5 text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Mobile App + Multi-Device Real-Time Cloud Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Staff Phone Barcode Scanners</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Supplier Purchases & Inward Ledgers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority 24/7 Phone & WhatsApp Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition"
            >
              Upgrade to Yearly
            </button>
          </div>

          {/* PLAN 3: FOUNDER'S LIFETIME */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white border-2 border-amber-400 shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 bg-amber-400/10 w-32 h-32 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">Lifetime Deal</span>
              <h3 className="text-2xl font-black text-white mt-1">Founder's Lifetime</h3>
              <p className="text-xs text-slate-300 mt-2 font-medium">Pay once, own forever. Zero recurring monthly or yearly fees.</p>

              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹24,999</span>
                  <span className="text-sm text-amber-400 font-bold"> one-time</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-block">
                    👑 Zero Renewal Fees Forever
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-200 font-medium">
                <li className="flex items-center gap-2.5 font-bold text-amber-300">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Lifetime Full Software & Cloud Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>No Recurring Subscription Fees</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Lifetime Mobile App & Real-Time Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited Staff Mobile Scanner Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>All Future AI & ERP Updates Included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>VIP 24/7 Dedicated Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition relative z-10"
            >
              Get Lifetime Deal
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
                <span className="font-black text-base text-amber-950">Mobile-Only Pro Pass — ₹1,499 / Year</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  📱 Mobile Phone Only
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 max-w-2xl leading-relaxed font-medium">
                Designed for retail chemists who operate purely on Android smartphones or tablets without a PC. Includes full mobile billing, camera barcode scanning, inventory, and WhatsApp invoicing.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition shrink-0 shadow-sm"
          >
            Explore Mobile Pass
          </button>
        </div>

        {/* Razorpay badge */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Payments are securely processed via Razorpay. Instant activation, no hidden setup fees.</span>
        </div>
      </section>

      {/* 9. TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Customer Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            What Medical Store Owners Say About DavaSetu
          </h2>
          <p className="mt-2 text-slate-600 text-sm font-medium">
            Join hundreds of thriving retail chemists modernizing their counter operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "Our evening counter rush used to cause long patient queues with our old desktop software. With DavaSetu, barcode scanning takes 2 seconds and receipts print instantly. Huge relief!"
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                JP
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Jayesh Patel</p>
                <p className="text-xs text-slate-500">Shreeji Medical, Ahmedabad</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "We used to lose ₹15,000–20,000 every month in expired medicines. DavaSetu's 90-day expiry shield allows us to return stock to distributors on time. The software paid for itself in month one!"
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                BS
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Bhavin Shah</p>
                <p className="text-xs text-slate-500">Lifecare Chemists, Surat</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-amber-400" />))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "I can monitor my daily cash registers and inventory from my phone even when I am travelling. My junior staff learned billing in just 2 days. Truly fantastic cloud POS."
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-sm">
                RM
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Rahul Mehta</p>
                <p className="text-xs text-slate-500">Mehta Pharma, Vadodara</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="mt-2 text-slate-600 text-sm font-medium">Common questions answered before switching to DavaSetu.</p>
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

      {/* 11. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-wider">
              15-Day Free Trial • Zero Risk
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
              Upgrade Your Pharmacy Counter Today
            </h2>
            <p className="mt-4 text-emerald-100 text-sm sm:text-base leading-relaxed">
              Experience fast barcode checkouts, zero expiry stock loss, and cloud inventory in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>{isLoggedIn ? 'Go to POS Dashboard' : 'Open Web POS (Free Trial)'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-700" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/60 text-white font-bold text-sm border border-emerald-400/30 transition"
              >
                Chemist Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. COMPACT PREMIUM ENTERPRISE FOOTER */}
      <footer className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-slate-400 border-t border-slate-800/80 pt-8 pb-6 sm:pt-10 sm:pb-7 relative overflow-hidden text-xs">

        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[200px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[300px] h-[150px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Top Trust & Value Pre-Footer Strip - Compact */}
          <div className="pb-4 mb-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] sm:text-xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>100% 256-Bit Encrypted Backups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>3-Sec Counter Billing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>GST & Schedule H1 Ready</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Live Phone Sales Tracking</span>
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>All Systems Operational • 99.98% Uptime</span>
            </div>
          </div>

          {/* Main 4-Column Grid - Compact Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 mb-6">

            {/* Column 1: Brand & Pharmacy Mission (5 cols) */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <img
                  src="/davasetu_logo.png"
                  alt="DavaSetu Pharmacy POS"
                  className="h-8 w-auto bg-white rounded-lg p-1 shadow-sm"
                />
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                  Cloud POS 3.0
                </span>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed font-medium max-w-sm">
                India's next-generation cloud pharmacy platform built exclusively for retail chemists, medical counters, and pharmacy chains. Eliminates expired medicine deadstock, accelerates evening rush checkouts, and delivers real-time phone tracking.
              </p>

              {/* Chemist Trust Rating Card - Compact */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-white/5 border border-white/10 max-w-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black border border-slate-900">1.2k+</span>
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-[9px] font-black border border-slate-900">★</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                      <span>Rated 4.9/5 by Indian Chemists</span>
                      <div className="flex text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">Gujarat • Maharashtra • Rajasthan • Pan India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: POS Modules (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>POS Modules</span>
              </h4>
              <ul className="space-y-1.5 text-xs font-semibold">
                <li><button onClick={() => navigate(isLoggedIn ? '/billing' : '/login')} className="hover:text-emerald-400 transition text-left">Counter Billing (POS)</button></li>
                <li><button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} className="hover:text-emerald-400 transition text-left">50k+ Generic Finder</button></li>
                <li><button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} className="hover:text-emerald-400 transition text-left">Smart Expiry Shield</button></li>
                <li><button onClick={() => navigate(isLoggedIn ? '/purchases' : '/login')} className="hover:text-emerald-400 transition text-left">Supplier Purchases (PO)</button></li>
                <li><button onClick={() => navigate(isLoggedIn ? '/reports' : '/login')} className="hover:text-emerald-400 transition text-left">Schedule H1 Log</button></li>
                <li>
                  <button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} className="hover:text-emerald-400 transition text-left flex items-center gap-1 text-emerald-300 font-bold">
                    <span>Smart Migration</span>
                    <span className="text-[8px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-black">2 Min</span>
                  </button>
                </li>
                <li><button onClick={() => navigate(isLoggedIn ? '/billing' : '/login')} className="hover:text-emerald-400 transition text-left">WhatsApp Receipts</button></li>
              </ul>
            </div>

            {/* Column 3: Hardware & Device Support (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>Hardware</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
                <li className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>2" & 3" Thermal Printers</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>1D & 2D Scanners</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Laser GST A4/A5 Bills</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Windows PC & Laptops</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Phones & Tablets</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Offline Billing Cache</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Dedicated VIP Chemist Helpdesk Card (3 cols) - Compact */}
            <div className="lg:col-span-3">
              <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Chemist Helpline</span>
              </h4>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                <a
                  href="tel:+919664781007"
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 transition group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-500 text-slate-950 shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">Call Chemist Support</span>
                    <span className="text-xs font-black text-white group-hover:text-emerald-300">+91 96647 81007</span>
                  </div>
                </a>

                <a
                  href="https://wa.me/919664781007?text=Hello%20DavaSetu%20Team%2C%20I%20need%20assistance%20with%20my%20pharmacy%20software."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/30 text-teal-200 transition group"
                >
                  <div className="p-1.5 rounded-md bg-teal-500 text-slate-950 shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-teal-300 font-bold uppercase tracking-wider block">WhatsApp VIP Desk</span>
                    <span className="text-xs font-black text-white group-hover:text-teal-300">+91 96647 81007</span>
                  </div>
                </a>

                <a
                  href="mailto:davasetu.otp@gmail.com"
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-emerald-300 transition px-0.5"
                >
                  <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold text-[11px]">davasetu.otp@gmail.com</span>
                </a>

                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-white/5 px-0.5 font-medium">
                  <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Mon – Sat: 9 AM – 9 PM • Sunday Emergency</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright, Host Info, & Quick Actions - Compact */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-medium text-slate-500">
            <p>© {new Date().getFullYear()} DavaSetu Cloud POS (Aarsha Software Labs). All rights reserved.</p>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hosted on AWS & Cloudflare Secure Edge (Mumbai, India)</span>
            </div>

            <div className="flex items-center gap-3 text-slate-300 font-semibold">
              <button onClick={() => navigate('/login?mode=login')} className="hover:text-emerald-400 transition">Chemist Login</button>
              <span>•</span>
              <button onClick={() => navigate('/login?mode=signup')} className="hover:text-emerald-400 transition">Sign Up Free</button>
              <span>•</span>
              <a href="#interactive-simulator" className="hover:text-emerald-400 transition">Live Demo</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
