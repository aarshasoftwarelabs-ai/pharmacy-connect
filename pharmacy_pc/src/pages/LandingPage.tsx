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
  ChevronRight, 
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
  ShoppingBag,
  ExternalLink,
  Laptop,
  Layers,
  Crown
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
}

const SAMPLE_MEDS: MedicineSample[] = [
  { id: '1', name: 'Dolo 650mg Tab', category: 'Antipyretic', batch: 'BT-9021', exp: '11/27', mrp: 30.50, discount: 10, qty: 1 },
  { id: '2', name: 'Augmentin 625 Duo', category: 'Antibiotic', batch: 'AUG-441', exp: '08/26', mrp: 201.20, discount: 12, qty: 1 },
  { id: '3', name: 'Pantocid DSR Cap', category: 'Antacid', batch: 'PAN-109', exp: '05/27', mrp: 189.00, discount: 15, qty: 1 },
  { id: '4', name: 'Azithral 500mg Tab', category: 'Antibiotic', batch: 'AZ-772', exp: '12/26', mrp: 119.50, discount: 10, qty: 1 },
  { id: '5', name: 'Montair LC Kid Tab', category: 'Allergy', batch: 'MN-331', exp: '03/27', mrp: 145.00, discount: 10, qty: 1 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cart, setCart] = useState<MedicineSample[]>([SAMPLE_MEDS[0], SAMPLE_MEDS[1]]);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'billing' | 'inventory' | 'purchases' | 'gst'>('billing');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [receiptSimulated, setReceiptSimulated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Simulator helper functions
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
    return taxable * 0.12; // 12% Avg GST
  };

  const calculateTotal = () => {
    return (calculateSubtotal() - calculateDiscount() + calculateGST()).toFixed(2);
  };

  const faqs = [
    {
      q: 'Does DavaSetu Pharmacy POS work on my existing desktop or laptop?',
      a: 'Yes, absolutely! DavaSetu is 100% cloud-powered and works directly on Google Chrome, Edge, and modern browsers on Windows 10/11, macOS, and Linux without requiring expensive server hardware.'
    },
    {
      q: 'Can I connect my USB barcode scanner and thermal receipt printer?',
      a: 'Yes! It seamlessly integrates with all standard 1D/2D USB & Bluetooth barcode scanners and thermal receipt printers (2-inch 58mm and 3-inch 80mm ESC/POS) as well as regular A4/A5 laser printers.'
    },
    {
      q: 'How does it protect my pharmacy from expired medicine losses?',
      a: 'Our Smart Expiry Shield highlights stock nearing expiry (30, 60, and 90-day intervals) with intelligent visual badges, allowing you to return them to your distributors before expiry deadlines.'
    },
    {
      q: 'Can multiple counters or cashiers use it simultaneously?',
      a: 'Yes! DavaSetu supports multi-counter, multi-staff role permissions (Cashier, Pharmacist, Admin) so your sales operations can run smoothly during peak rush hours with real-time stock sync.'
    },
    {
      q: 'Is my pharmacy patient and financial data backed up safely?',
      a: 'All transactions, inventory changes, and customer records are secured with bank-grade encryption and auto-backed up to resilient cloud infrastructure, protecting you from hard disk crashes.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* BACKGROUND GLOW ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animation-delay-2000 animate-blob" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animation-delay-4000 animate-blob" />
      </div>

      {/* TOP NOTIFICATION BANNER */}
      <div className="relative z-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">NEW</span>
        <span>Version 3.0 Live: Ultra-Fast GST Billing, Supplier PO Inward & Live WhatsApp Invoicing!</span>
        <button 
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
          className="underline hover:text-emerald-100 font-semibold ml-2 transition inline-flex items-center gap-1"
        >
          {isLoggedIn ? 'Go to POS →' : 'Try POS →'}
        </button>
      </div>

      {/* STICKY GLASS NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center">
              <img 
                src="/davasetu_logo.png" 
                alt="DavaSetu" 
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback icon if logo image not found
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 sm:hidden">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  Dava<span className="text-emerald-400">Setu</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud POS
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium">Smart Pharmacy ERP & Billing Platform</p>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#interactive-pos" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>Interactive Simulator</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-md font-bold">Try Live</span>
            </a>
            <a href="#modules" className="hover:text-emerald-400 transition-colors">Modules</a>
            <a href="#hardware" className="hover:text-emerald-400 transition-colors">Hardware</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>Open POS Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition border border-transparent hover:border-slate-700"
                >
                  Chemist Login
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Web POS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* PILL BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>India's Leading Next-Gen Cloud Pharmacy & Medical Store POS</span>
        </div>

        {/* MAIN HEADLINE */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
          Supercharge Your Pharmacy With{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Lightning-Fast Billing
          </span>{' '}
          & Smart Stock Intelligence
        </h1>

        {/* SUBTITLE */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Say goodbye to sluggish desktop software. Experience seamless barcode scanning, automated GST invoices, batch & near-expiry shields, supplier purchase orders, and patient Khata ledger—all in one smart cloud app.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-base shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5 text-yellow-300" />
            <span>{isLoggedIn ? 'Go to POS Terminal' : 'Launch Free Web POS'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <a
            href="#interactive-pos"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-base border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <span>Try Interactive Demo</span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        {/* KEY HIGHLIGHTS STRIP */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm sm:text-base">3-Sec Billing</p>
              <p className="text-xs text-slate-400">Barcode & Hotkeys</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm sm:text-base">Expiry Shield</p>
              <p className="text-xs text-slate-400">Zero Stock Loss</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm sm:text-base">100% GST Ready</p>
              <p className="text-xs text-slate-400">HSN & Auto Tax</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm sm:text-base">Cloud Auto-Sync</p>
              <p className="text-xs text-slate-400">Never Lose Data</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MINI POS SIMULATOR SECTION */}
      <section id="interactive-pos" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-3 border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Live Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Experience Our Rapid Counter Billing Right Now
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Click on medicines below to simulate barcode scan and checkout just like a real medical store counter!
          </p>
        </div>

        {/* SIMULATOR WINDOW CONTAINER */}
        <div className="rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl overflow-hidden max-w-5xl mx-auto">
          {/* SIMULATOR WINDOW HEADER */}
          <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-medium text-slate-400 pl-2 border-l border-slate-700">
                DavaSetu POS Terminal 3.0 • Counter 01 (Live Test Mode)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Barcode Scanner Ready</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MEDICINE CATALOG CLICKER */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Click to add item to counter cart:</span>
                </h3>
                <span className="text-xs text-slate-400">Clicking simulates barcode scan</span>
              </div>

              {/* MEDICINE PILLS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_MEDS.map((med) => {
                  const isInCart = cart.some(c => c.id === med.id);
                  return (
                    <button
                      key={med.id}
                      onClick={() => addSampleMed(med)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                        isInCart 
                          ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500' 
                          : 'bg-slate-900/60 border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {med.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{med.category} • Batch: {med.batch}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Exp: {med.exp}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="font-extrabold text-emerald-400 text-sm">₹{med.mrp.toFixed(2)}</span>
                        <span className="text-[11px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded font-medium">
                          +{med.discount}% Disc
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* QUICK HOTKEY HELPER STRIP */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Fast Keyboard Shortcuts:</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px] border border-slate-700">F1: Search</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px] border border-slate-700">F2: Checkout</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px] border border-slate-700">F8: Print</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px] border border-slate-700">ESC: Clear</span>
              </div>
            </div>

            {/* LIVE CART & BILL SUMMARY */}
            <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-700/80 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">Invoice #DS-9042</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{cart.length} item(s)</span>
                </div>

                {/* CART ITEMS LIST */}
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No medicines in cart. Click on items on the left to add!
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-750 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">Qty: {item.qty} × ₹{item.mrp.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400">
                            ₹{(item.mrp * item.qty).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeSampleMed(item.id)}
                            className="text-rose-400 hover:text-rose-300 text-sm font-bold px-1"
                            title="Remove item"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TOTALS & PAYMENT */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-teal-400">
                  <span>Discount Savings:</span>
                  <span>-₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>GST (12%):</span>
                  <span>+₹{calculateGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Net Payable:</span>
                  <span className="text-emerald-400 text-lg">₹{calculateTotal()}</span>
                </div>

                {/* PAYMENT SELECTOR */}
                <div className="pt-2 grid grid-cols-3 gap-1.5 text-xs">
                  {(['UPI', 'CASH', 'CARD'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 rounded-lg font-bold border transition-all ${
                        paymentMode === mode 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' 
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI QR' : mode === 'CASH' ? '💵 Cash' : '💳 Card'}
                    </button>
                  ))}
                </div>

                {/* SIMULATE CHECKOUT BUTTON */}
                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    setReceiptSimulated(true);
                    setTimeout(() => setReceiptSimulated(false), 4000);
                  }}
                  className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{receiptSimulated ? '✓ Bill Printed & WhatsApp Sent!' : 'Generate Print & WhatsApp Bill'}</span>
                </button>

                {receiptSimulated && (
                  <p className="text-[11px] text-center text-emerald-400 font-semibold animate-pulse">
                    ⚡ Simulation Complete! Thermal print triggered & WhatsApp invoice queued.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* JUMP TO FULL POS CTA */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm underline transition"
          >
            <span>Ready for the real deal? Open Full Pharmacy-POS Terminal with your medicines inventory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* MODULES BENTO GRID SECTION */}
      <section id="modules" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-3 border border-cyan-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Complete Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Built for Every Corner of Your Pharmacy
          </h2>
          <p className="mt-4 text-slate-400 text-base sm:text-lg">
            From counter billing to supplier procurement and government tax filings, everything is tightly integrated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: BILLING */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Rapid Counter Billing & POS
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Type 2 letters of a medicine name or scan the barcode to pull batch, MRP, expiry, and rack location instantly. Handles multi-item discounts and fractional strips.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Fast Barcode & Keyboard Hotkeys</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> WhatsApp Bill Sharing directly to patient</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Split Tender (Cash + UPI + Credit)</li>
            </ul>
          </div>

          {/* CARD 2: SMART INVENTORY & EXPIRY */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-teal-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                Smart Batch & Expiry Shield
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Automated FIFO (First-In, First-Out) stock tracking prevents expired stock from sitting on your racks. Get color-coded warnings 30, 60, and 90 days before expiry.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Batch-wise inventory & stock reconciliation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Low-stock re-order alerts to avoid stockouts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Expiry return generator for distributors</li>
            </ul>
          </div>

          {/* CARD 3: SUPPLIERS & PURCHASES */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-cyan-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Supplier PO & Purchase Inward
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Directly inward purchase bills from your pharma distributors. Track payment dues, credit period deadlines, supplier ledgers, and return debit notes.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Fast Purchase Inward with Free Schemes & Tax</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Supplier balance ledger & payment tracking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" /> Expiry and breakage return vouchers</li>
            </ul>
          </div>

          {/* CARD 4: CUSTOMERS & KHATA */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-indigo-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                Patient History & Digital Khata
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Maintain patient medication histories, chronic disease refill cycles (BP, Diabetes), doctor reference commissions, and outstanding credit books.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Digital customer credit (Khata) with SMS reminders</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Chronic patient monthly medicine refills</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> Prescription attachment & doctor directory</li>
            </ul>
          </div>

          {/* CARD 5: REPORTS & GST COMPLIANCE */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-rose-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
                GSTR-1, GSTR-3B & Profit Intelligence
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                One-click export for CA filing. Generate HSN-wise sales summaries, margin analysis by pharmaceutical company, and daily counter cash reconciliation.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" /> GSTR-1 and GSTR-3B ready Excel/JSON sheets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" /> Daily cash, card, and UPI register closure</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" /> Real net profit & gross margin analytics</li>
            </ul>
          </div>

          {/* CARD 6: MULTI-STAFF & SECURITY */}
          <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/80 hover:border-amber-500/50 transition-all group backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                Multi-User Staff Permissions
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Prevent theft or unauthorized bill deletion. Assign granular permissions to junior operators, pharmacists, and store managers.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-700/60 pt-4">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Cashier bill editing restrictions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Owner-only purchase price & profit visibility</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Detailed audit trails of stock modifications</li>
            </ul>
          </div>
        </div>
      </section>

      {/* HARDWARE COMPATIBILITY STRIP */}
      <section id="hardware" className="relative z-10 py-16 bg-slate-950/60 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Universal Hardware Compatibility</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Works Seamlessly with All Your Existing Equipment
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              No need to replace your hardware. Plug in your current scanner and printer, open DavaSetu in your browser, and start billing in seconds.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <QrCode className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="font-bold text-white text-xs">Barcode Scanners</span>
              <span className="text-[11px] text-slate-400">1D, 2D, USB, Wireless</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <Printer className="w-8 h-8 text-teal-400 mb-2" />
              <span className="font-bold text-white text-xs">Thermal Printers</span>
              <span className="text-[11px] text-slate-400">2-inch (58mm) & 3-inch (80mm)</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <FileText className="w-8 h-8 text-cyan-400 mb-2" />
              <span className="font-bold text-white text-xs">Laser & Inkjet</span>
              <span className="text-[11px] text-slate-400">Full A4 & Half A5 Invoices</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <Laptop className="w-8 h-8 text-indigo-400 mb-2" />
              <span className="font-bold text-white text-xs">Any Device</span>
              <span className="text-[11px] text-slate-400">PC, Laptop, Tablet, Phone</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION - REAL POS SOFTWARE PLANS */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Official POS Subscription & Licensing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Choose the Plan that Fits Your Pharmacy
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Upgrade to unlock Smart Inventory, Unlimited Billing, Expiry Shield & Real-Time Cloud Sync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* PLAN 1: MONTHLY PRO */}
          <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between backdrop-blur-sm">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Monthly Pass</span>
              <h3 className="text-2xl font-bold text-white mt-1">Monthly Pro</h3>
              <p className="text-xs text-slate-400 mt-2">Essential cloud POS billing for independent retail counters.</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">₹799</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Counter Billing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Thermal Printer Support (2" & 3" ESC/POS)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Basic Sales & Daily Register Reports</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mobile App Access (1 Phone Terminal)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cloud Auto Sync & Secure Data Backup</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm border border-slate-600 transition"
            >
              Select Monthly
            </button>
          </div>

          {/* PLAN 2: YEARLY PREMIUM (BEST VALUE) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-800/90 via-slate-800/95 to-emerald-950/40 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/25 flex flex-col justify-between relative scale-105 z-10 backdrop-blur-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs shadow-md uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>Best Value • Just ₹16/Day</span>
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Annual Pass</span>
              <h3 className="text-2xl font-bold text-white mt-1">Yearly Premium</h3>
              <p className="text-xs text-slate-300 mt-2">Complete AI-powered pharmacy ERP for busy medical stores.</p>
              
              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹5,999</span>
                  <span className="text-sm text-slate-400">/yr</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Just ₹16/day • Save over ₹3,500/yr
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-200">
                <li className="flex items-center gap-2.5 font-semibold text-white">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Everything in Monthly Pro</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Smart Inventory (AI) & Expiry Shield (30-60-90 days)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>7-Day Advanced Trends & Sales Analytics</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mobile App + Multi-Device Real-Time Cloud Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Staff Phone Barcode Scanners</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Supplier Purchases & Inward Ledgers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority 24/7 Phone & WhatsApp Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition"
            >
              Upgrade to Yearly
            </button>
          </div>

          {/* PLAN 3: FOUNDER'S LIFETIME */}
          <div className="p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/50 hover:border-amber-400 shadow-xl shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 bg-amber-500/20 w-32 h-32 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Lifetime Deal</span>
              <h3 className="text-2xl font-bold text-white mt-1">Founder's Lifetime</h3>
              <p className="text-xs text-slate-400 mt-2">Pay once, own forever. No monthly or yearly renewals.</p>
              
              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹24,999</span>
                  <span className="text-sm text-amber-400 font-bold"> once</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    👑 Zero Recurring Renewal Fees
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
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
              className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition relative z-10"
            >
              Get Lifetime Deal
            </button>
          </div>

        </div>

        {/* MOBILE-ONLY PASS COMPANION BANNER */}
        <div className="mt-10 max-w-6xl mx-auto p-5 sm:p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-100 flex flex-col sm:flex-row items-center justify-between gap-5 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base text-white">Mobile-Only Pro Pass — ₹1,499 / Year</span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  📱 Mobile Phone Only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                ખાસ એવા કેમિસ્ટ મિત્રો માટે જેમના સ્ટોર પર PC કે લેપટોપ નથી અને માત્ર એન્ડ્રોઇડ સ્માર્ટફોન કે ટેબ્લેટથી દુકાન ચલાવે છે. Full Mobile Billing, Barcode Camera Scan, Inventory & WhatsApp Invoicing.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/settings' : '/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition shrink-0"
          >
            Explore Mobile Pass
          </button>
        </div>

        {/* SECURE PAYMENT NOTE */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Payments are securely processed via Razorpay. Instant activation, no setup fees.</span>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-slate-400 text-sm">Everything you need to know about switching to DavaSetu Cloud POS.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-800/60 border border-slate-700/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left font-bold text-white text-base sm:text-lg flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-slate-700/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* HIGH CONVERSION BOTTOM CTA BANNER */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-950/60">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your Pharmacy Counter Today?
            </h2>
            <p className="mt-4 text-emerald-100 text-sm sm:text-base leading-relaxed">
              Launch your POS in seconds. Fast barcode billing, automated GST reports, and zero stock loss from expiry.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-extrabold text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoggedIn ? 'Go to POS Dashboard' : 'Open Web POS Now'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/60 text-white font-semibold text-sm border border-emerald-400/40 transition"
              >
                Chemist Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-extrabold text-xl text-white">
                Dava<span className="text-emerald-400">Setu</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">POS</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Next-generation cloud pharmacy management, barcode counter billing, batch tracking, and pharmaceutical inventory software.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">POS Modules</h4>
            <ul className="space-y-2">
              <li><button onClick={() => navigate(isLoggedIn ? '/billing' : '/login')} className="hover:text-emerald-400">Counter Billing (POS)</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/inventory' : '/login')} className="hover:text-emerald-400">Smart Batch & Expiry</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/purchases' : '/login')} className="hover:text-emerald-400">Supplier Inward & Orders</button></li>
              <li><button onClick={() => navigate(isLoggedIn ? '/customers' : '/login')} className="hover:text-emerald-400">Patient Khata Ledger</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Compatibility</h4>
            <ul className="space-y-2">
              <li>USB & Wireless Barcode Scanners</li>
              <li>2-inch & 3-inch Thermal Printers</li>
              <li>A4/A5 Laser GST Invoices</li>
              <li>Chrome, Edge & Android Tablets</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Support & Help</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-400" /> Support: +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-400" /> help@davasetu.com</li>
              <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-emerald-400" /> 100% Hosted in Secure Cloud</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DavaSetu Cloud POS. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="hover:text-emerald-400">Chemist Login</button>
            <span>•</span>
            <button onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')} className="hover:text-emerald-400">Launch POS</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
