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
  ArrowLeft,
  Download,
  Plus,
  Minus,
  Filter
} from 'lucide-react';

interface MedicineSample {
  id: string;
  name: string;
  genericSalt: string;
  category: string;
  batch: string;
  exp: string;
  mrp: number;
  costPrice: number;
  stock: number;
  discount: number;
  qty: number;
  gst: number;
  isScheduleH1?: boolean;
}

const SAMPLE_MEDS: MedicineSample[] = [
  { id: '1', name: 'Dolo 650mg Tab', genericSalt: 'Paracetamol (650mg)', category: 'Micro Labs', batch: 'BT-9421', exp: '11/27', mrp: 31.50, costPrice: 22.10, stock: 84, discount: 10, qty: 1, gst: 12 },
  { id: '2', name: 'Augmentin 625 Duo', genericSalt: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', category: 'GSK', batch: 'AUG-441', exp: '08/26', mrp: 201.20, costPrice: 155.00, stock: 18, discount: 12, qty: 1, gst: 12 },
  { id: '3', name: 'Pantocid DSR Cap', genericSalt: 'Pantoprazole (40mg) + Domperidone (30mg)', category: 'Sun Pharma', batch: 'PAN-109', exp: '05/27', mrp: 189.00, costPrice: 132.50, stock: 42, discount: 15, qty: 1, gst: 12 },
  { id: '4', name: 'Azithral 500mg Tab', genericSalt: 'Azithromycin (500mg)', category: 'Alembic', batch: 'AZ-772', exp: '12/26', mrp: 119.50, costPrice: 84.00, stock: 26, discount: 10, qty: 1, gst: 12 },
  { id: '5', name: 'Montair LC Kid Tab', genericSalt: 'Montelukast (4mg) + Levocetirizine (2.5mg)', category: 'Cipla', batch: 'MN-331', exp: '03/27', mrp: 145.00, costPrice: 102.00, stock: 35, discount: 10, qty: 1, gst: 12 },
  { id: '6', name: 'Telma 40mg Tab', genericSalt: 'Telmisartan (40mg)', category: 'Glenmark', batch: 'TL-552', exp: '10/27', mrp: 128.00, costPrice: 89.00, stock: 50, discount: 10, qty: 1, gst: 12 },
  { id: '7', name: 'Alprazolam 0.5mg Tab', genericSalt: 'Alprazolam (0.5mg)', category: 'Torrent Pharma', batch: 'AL-902', exp: '09/26', mrp: 42.00, costPrice: 28.00, stock: 60, discount: 5, qty: 1, gst: 12, isScheduleH1: true },
  { id: '8', name: 'Moxikind-CV 625 Tab', genericSalt: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)', category: 'Mankind', batch: 'MK-102', exp: '01/28', mrp: 178.50, costPrice: 108.00, stock: 45, discount: 15, qty: 1, gst: 12 }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // UNIFIED PLATFORM VIEW STATE:
  // 'website': Full SaaS Marketing & Showcase Website
  // 'pos_terminal': In-Built Live Working Counter Billing Software
  // 'inventory': In-Built Smart Batch & Expiry Radar
  // 'reports': In-Built Real-Time Analytics & GST Hub
  const [activeView, setActiveView] = useState<'website' | 'pos_terminal' | 'inventory' | 'reports'>('website');

  // Interactive Counter Simulator & Terminal State
  const [cart, setCart] = useState<MedicineSample[]>([SAMPLE_MEDS[0], SAMPLE_MEDS[1]]);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [receiptSimulated, setReceiptSimulated] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [customerName, setCustomerName] = useState('Rajesh Patel');
  const [doctorName, setDoctorName] = useState('Dr. N. K. Shah');
  const [activeStudioTab, setActiveStudioTab] = useState<'billing' | 'generic' | 'expiry' | 'purchases' | 'compliance' | 'mobile'>('billing');
  
  // Terminal Search & Quick Add
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'expiring' | 'low_stock' | 'schedule_h1'>('all');

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

  const updateItemQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const removeSampleMed = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
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

  const filteredMeds = SAMPLE_MEDS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.genericSalt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInventory = SAMPLE_MEDS.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          m.genericSalt.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          m.batch.toLowerCase().includes(inventorySearch.toLowerCase());
    if (!matchesSearch) return false;
    if (inventoryFilter === 'expiring') return m.exp.includes('26');
    if (inventoryFilter === 'low_stock') return m.stock < 25;
    if (inventoryFilter === 'schedule_h1') return m.isScheduleH1 === true;
    return true;
  });

  const faqs = [
    {
      q: 'Can I easily import my existing medicine inventory from Marg or Excel?',
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
      
      {/* =========================================================================
          MASTER UNIFIED PLATFORM HEADER (SEAMLESS SWITCHER FOR WEBSITE + POS)
          ========================================================================= */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <Link to="/" onClick={() => setActiveView('website')} className="flex items-center gap-2 group">
              <div className="p-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  Dava<span className="text-emerald-400">Setu</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Unified POS 3.0
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* MASTER SEGMENTED SWITCHER (MERGES WEBSITE & POS INTO ONE) */}
          <div className="flex items-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setActiveView('website')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'website' 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Website & Overview</span>
            </button>

            <button
              onClick={() => setActiveView('pos_terminal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === 'pos_terminal' 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>In-Built POS Terminal</span>
              <span className={`px-1.5 py-0.2 text-[9px] rounded font-black ${activeView === 'pos_terminal' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                LIVE
              </span>
            </button>

            <button
              onClick={() => setActiveView('inventory')}
              className={`hidden sm:flex px-3.5 py-1.5 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                activeView === 'inventory' 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Smart Inventory</span>
            </button>

            <button
              onClick={() => setActiveView('reports')}
              className={`hidden md:flex px-3.5 py-1.5 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                activeView === 'reports' 
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Live Analytics</span>
            </button>
          </div>

          {/* Right Action: Sign In or Dashboard Link */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5"
              >
                <span>My Pharmacy POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition"
              >
                Chemist Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: IN-BUILT POS TERMINAL (AUTHENTIC FULL WORKING TERMINAL)
          ========================================================================= */}
      {activeView === 'pos_terminal' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
          
          {/* Terminal Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base text-white">In-Built Rapid POS Terminal</h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                    Interactive Counter 01
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Full working medical counter: Scan barcodes, search medicines, manage discounts, and print bills instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setActiveView('website')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Website</span>
              </button>

              <button
                onClick={clearCart}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 transition"
              >
                Clear Bill (Esc)
              </button>
            </div>
          </div>

          {/* Terminal Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (7 cols): Medicine Catalog & Scanner */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Patient & Doctor Header Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Name & Mobile (F3)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-emerald-500" 
                      placeholder="Customer Name"
                    />
                    <input 
                      type="text" 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:outline-emerald-500" 
                      placeholder="WhatsApp Mobile"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Prescribing Doctor
                  </label>
                  <input 
                    type="text" 
                    value={doctorName} 
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-emerald-500" 
                    placeholder="Doctor Name (e.g. Dr. N. K. Shah)"
                  />
                </div>
              </div>

              {/* Barcode & Search Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type medicine name, brand, or barcode to scan (F1)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-emerald-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
                  )}
                </div>

                {/* Quick Add Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span>Click any item to scan & add to counter bill:</span>
                    <span>{filteredMeds.length} items available</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {filteredMeds.map((med) => (
                      <button
                        key={med.id}
                        onClick={() => addSampleMed(med)}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 text-left transition flex flex-col justify-between group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-black text-slate-900 text-sm group-hover:text-emerald-700 transition">
                              {med.name}
                            </p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{med.genericSalt}</p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-mono border">
                            Exp: {med.exp}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900">₹{med.mrp.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Stock: {med.stock} ({med.discount}% Disc)
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generic Substitute Recommendation Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 text-xs">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Smart Generic Salt Substitution Active</p>
                  <p className="text-slate-600 mt-0.5">
                    Selling <strong>Moxikind-CV 625</strong> instead of Augmentin yields <strong>38% gross margin (+22% higher profit)</strong> while saving the patient ₹22.70 per strip.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column (5 cols): Bill Details & Payment */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <span className="font-black text-base text-slate-900">Invoice #DS-10842</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{cart.length} line items</span>
                </div>

                {/* Items in Cart */}
                <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Counter cart is empty. Click any medicine on the left to add!
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="pr-2">
                          <p className="font-black text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Batch: {item.batch} • ₹{item.mrp.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Qty increment / decrement */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                            <button onClick={() => updateItemQty(item.id, -1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold">-</button>
                            <span className="px-2.5 font-bold text-slate-900">{item.qty}</span>
                            <button onClick={() => updateItemQty(item.id, 1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold">+</button>
                          </div>

                          <span className="font-black text-slate-900 w-16 text-right">
                            ₹{(item.mrp * item.qty).toFixed(2)}
                          </span>

                          <button onClick={() => removeSampleMed(item.id)} className="text-rose-500 hover:text-rose-700 font-bold px-1">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals & Tenders */}
              <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Special Patient Discount:</span>
                  <span>- ₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST Tax (CGST+SGST 12%):</span>
                  <span>+ ₹{calculateGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Net Payable:</span>
                  <span className="text-emerald-600 text-2xl font-black">₹{calculateTotal()}</span>
                </div>

                {/* Payment Mode Selector */}
                <div className="pt-2 grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'CARD'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        paymentMode === mode 
                          ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-sm' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI QR' : mode === 'CASH' ? '💵 Cash' : '💳 Card'}
                    </button>
                  ))}
                </div>

                {/* Print & WhatsApp Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    disabled={cart.length === 0}
                    onClick={() => {
                      setReceiptSimulated(true);
                      setTimeout(() => setReceiptSimulated(false), 4000);
                    }}
                    className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{receiptSimulated ? '✓ Bill Printed!' : 'Print Bill (F2)'}</span>
                  </button>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setShowWhatsAppModal(true)}
                    className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp Bill</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SMART INVENTORY & BATCH RADAR
          ========================================================================= */}
      {activeView === 'inventory' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-emerald-600" />
                <h2 className="font-black text-xl text-slate-900">Smart Batch & Expiry Radar</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  Live Stock Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time batch tracking, automated 30-60-90 day expiry protection, and gross profit margins.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('pos_terminal')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Counter Terminal</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search medicine, salt, or batch..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {[
                { id: 'all', label: 'All Stock (8)' },
                { id: 'expiring', label: '⚠️ Near Expiry 60 Days (2)' },
                { id: 'low_stock', label: '📦 Low Stock < 25 (2)' },
                { id: 'schedule_h1', label: '📋 Schedule H1 Drugs (1)' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setInventoryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    inventoryFilter === f.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Medicine & Manufacturer</th>
                    <th className="py-3.5 px-4">Active Generic Salt</th>
                    <th className="py-3.5 px-4">Batch No</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">MRP / Cost</th>
                    <th className="py-3.5 px-4">Margin %</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInventory.map(med => {
                    const margin = (((med.mrp - med.costPrice) / med.mrp) * 100).toFixed(1);
                    const isExpiringSoon = med.exp.includes('26');
                    return (
                      <tr key={med.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <p className="font-black text-slate-900">{med.name}</p>
                          <span className="text-[10px] text-slate-400">{med.category}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs">{med.genericSalt}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{med.batch}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            isExpiringSoon ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {med.exp} {isExpiringSoon && '⚠️'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-black ${med.stock < 25 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {med.stock} Strips
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900">₹{med.mrp.toFixed(2)}</span>
                          <span className="text-slate-400 text-[10px] block">Cost: ₹{med.costPrice.toFixed(2)}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          +{margin}%
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              addSampleMed(med);
                              setActiveView('pos_terminal');
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition"
                          >
                            + Bill Item
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 3: REAL-TIME ANALYTICS & GST SUMMARY
          ========================================================================= */}
      {activeView === 'reports' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <h2 className="font-black text-xl text-slate-900">Live Counter Sales & GST Intelligence</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  Today's Register
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time cash reconciliation, UPI collections, and GSTR-1 ready export sheets.
              </p>
            </div>

            <button
              onClick={() => setActiveView('pos_terminal')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Back to POS Counter</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase">Today's Gross Sales</span>
              <p className="text-3xl font-black text-slate-900 mt-1">₹48,250.00</p>
              <span className="text-emerald-600 font-bold text-xs mt-1 block">↑ 18.4% vs Yesterday</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase">Total Invoices</span>
              <p className="text-3xl font-black text-slate-900 mt-1">142 Bills</p>
              <span className="text-slate-500 font-bold text-xs mt-1 block">Avg. Ticket: ₹339.78</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase">UPI Collections</span>
              <p className="text-3xl font-black text-teal-600 mt-1">₹29,850.00</p>
              <span className="text-slate-500 font-bold text-xs mt-1 block">Cash: ₹18,400.00</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-slate-400 text-xs font-bold uppercase">Gross Profit Margin</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">31.8%</p>
              <span className="text-emerald-700 font-bold text-xs mt-1 block">₹15,340 Net Profit</span>
            </div>
          </div>

          {/* GSTR-1 Compliance Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-base text-slate-900">GSTR-1 Tax Summary (HSN-wise Breakdown)</h3>
                <p className="text-xs text-slate-500">Auto-calculated tax report ready to export for your chartered accountant.</p>
              </div>

              <button
                onClick={() => alert("GSTR-1 Excel sheet generated and downloaded successfully!")}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel (CA Ready)</span>
              </button>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">HSN Code</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Taxable Value</th>
                    <th className="py-2.5 px-3">CGST (6%)</th>
                    <th className="py-2.5 px-3">SGST (6%)</th>
                    <th className="py-2.5 px-3 text-right">Total Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold">3004</td>
                    <td className="py-3 px-3">Formulated Pharmaceuticals</td>
                    <td className="py-3 px-3 font-mono">₹38,200.00</td>
                    <td className="py-3 px-3 font-mono text-slate-500">₹2,292.00</td>
                    <td className="py-3 px-3 font-mono text-slate-500">₹2,292.00</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹42,784.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold">3006</td>
                    <td className="py-3 px-3">First Aid & Bandages</td>
                    <td className="py-3 px-3 font-mono">₹4,880.00</td>
                    <td className="py-3 px-3 font-mono text-slate-500">₹292.80</td>
                    <td className="py-3 px-3 font-mono text-slate-500">₹292.80</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">₹5,465.60</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 4: FULL SAAS WEBSITE (DEFAULT HOME VIEW)
          ========================================================================= */}
      {activeView === 'website' && (
        <>
          {/* HERO SECTION - 2-COLUMN SPLIT */}
          <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/20 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                
                {/* Left Column: Copy & Actions */}
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black mb-6 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Next-Gen Pharmacy Cloud ERP & In-Built POS</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                    The Modern POS Built Exclusively for{' '}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                      Retail Pharmacies.
                    </span>
                  </h1>

                  <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed font-medium">
                    Speed up checkouts during evening rush, eliminate expired medicine losses with automated return alerts, and track daily sales from your phone anywhere.
                  </p>

                  <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xl">
                        <Zap className="w-4 h-4" /> 3 Sec
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Counter Checkout</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-teal-600 font-black text-xl">
                        <ShieldCheck className="w-4 h-4" /> 0%
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Expiry Deadstock</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 text-cyan-600 font-black text-xl">
                        <CheckCircle className="w-4 h-4" /> 100%
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">GST & Cloud Auto-Sync</p>
                    </div>
                  </div>

                  <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                      onClick={() => setActiveView('pos_terminal')}
                      className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-700/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3"
                    >
                      <Zap className="w-5 h-5 text-yellow-300" />
                      <span>Launch In-Built POS (Live Demo)</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setActiveView('inventory')}
                      className="px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>Inspect Inventory Radar</span>
                    </button>
                  </div>

                  <div className="mt-8 flex items-center gap-4 text-xs font-bold text-slate-500">
                    <div className="flex -space-x-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">JP</span>
                      <span className="w-7 h-7 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">BS</span>
                      <span className="w-7 h-7 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">RM</span>
                    </div>
                    <span>Rated 4.9/5 by 1,200+ Pharmacists • No Credit Card Required</span>
                  </div>
                </div>

                {/* Right Column: Hero Visual Terminal */}
                <div className="lg:col-span-5 relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-20 transform rotate-1" />

                  <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 p-6 flex flex-col justify-between">
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

                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Customer</span>
                        <p className="font-bold text-slate-800">Rajesh Patel (+91 98251-XXXXX)</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white text-slate-600 font-mono text-[11px] border">
                        Dr. N. K. Shah
                      </span>
                    </div>

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
                          <p className="text-[10px] text-slate-500 font-mono">Batch: PAN-109 • Exp: 05/27 • Sun</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-sm">₹189.00</span>
                          <span className="block text-[10px] text-emerald-600 font-bold">Qty: 1 (15% Disc)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Subtotal: ₹390.20</span>
                        <span className="text-emerald-400 font-bold">Savings: -₹52.49</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                        <div>
                          <span className="text-xs text-slate-300 font-bold block">Net Invoice Total:</span>
                          <span className="text-[10px] text-slate-400">Incl. CGST + SGST (12%)</span>
                        </div>
                        <span className="text-2xl font-black text-emerald-400">₹378.23</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <button 
                          onClick={() => setActiveView('pos_terminal')}
                          className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Open Full Terminal</span>
                        </button>
                        <button 
                          onClick={() => setShowWhatsAppModal(true)}
                          className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>WhatsApp Bill</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* HARDWARE TRUST STRIP */}
          <section className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-400">Universal Compatibility:</span>
                <span className="flex items-center gap-2"><QrCode className="w-4 h-4 text-emerald-600" /> All Barcode Scanners</span>
                <span className="flex items-center gap-2"><Printer className="w-4 h-4 text-emerald-600" /> 2" & 3" Thermal Receipt Printers</span>
                <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> A4 & A5 Laser GST Invoices</span>
                <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-600" /> Android Smartphones & Tablets</span>
                <span className="flex items-center gap-2"><Database className="w-4 h-4 text-emerald-600" /> Auto Cloud Backup</span>
              </div>
            </div>
          </section>

          {/* WORKFLOW STUDIO TABS */}
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
                    className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
                      isActive 
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

          {/* PRICING SECTION */}
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
                Unlock Smart Inventory, Unlimited Counter Billing, Expiry Shield & Real-Time Cloud Sync.
              </p>
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
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Unlimited Counter Billing</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Thermal Printer Support (2" & 3" ESC/POS)</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Basic Sales & Daily Register Reports</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Mobile App Access (1 Phone Terminal)</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Cloud Auto Sync & Secure Data Backup</span></li>
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
                    <li className="flex items-center gap-2.5 text-emerald-900"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Everything in Monthly Pro</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Smart Inventory (AI) & 30-60-90 Day Expiry Shield</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Smart Generic & Salt Composition Finder</span></li>
                    <li className="flex items-center gap-2.5 text-emerald-700"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Mobile App + Multi-Device Real-Time Cloud Sync</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Staff Phone Barcode Scanners</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Supplier Purchases & Schedule H1 Register</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-600 shrink-0" /><span>Priority 24/7 Phone & WhatsApp Support</span></li>
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
                    <li className="flex items-center gap-2.5 font-bold text-amber-300"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>Lifetime Full Software & Cloud Access</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>No Recurring Subscription Fees</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>Lifetime Mobile App & Real-Time Sync</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>Unlimited Staff Mobile Scanner Seats</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>All Future AI & ERP Updates Included</span></li>
                    <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-amber-400 shrink-0" /><span>VIP 24/7 Dedicated Support</span></li>
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

            {/* MOBILE-ONLY PASS BANNER */}
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
          </section>

          {/* TESTIMONIALS */}
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
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">JP</div>
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
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">BS</div>
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
                  <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-sm">RM</div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Rahul Mehta</p>
                    <p className="text-xs text-slate-500">Mehta Pharma, Vadodara</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
              <p className="mt-2 text-slate-600 text-sm font-medium">Common questions answered before switching to DavaSetu.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm transition-all">
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

          {/* BOTTOM CTA */}
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
                    onClick={() => setActiveView('pos_terminal')}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <span>Launch In-Built POS (Free Trial)</span>
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

          {/* FOOTER */}
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
                  Next-generation cloud pharmacy management, barcode counter billing, batch tracking, and pharmaceutical inventory software.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3">POS Modules</h4>
                <ul className="space-y-2">
                  <li><button onClick={() => setActiveView('pos_terminal')} className="hover:text-emerald-600 font-semibold text-emerald-700">⚡ In-Built POS Terminal</button></li>
                  <li><button onClick={() => setActiveView('inventory')} className="hover:text-emerald-600">Smart Batch & Expiry Radar</button></li>
                  <li><button onClick={() => setActiveView('reports')} className="hover:text-emerald-600">Live GST & Sales Analytics</button></li>
                  <li><button onClick={() => navigate(isLoggedIn ? '/purchases' : '/login')} className="hover:text-emerald-600">Supplier Purchases (PO)</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3">Hardware Compatibility</h4>
                <ul className="space-y-2">
                  <li>TVS & NGX Barcode Scanners</li>
                  <li>2" & 3" Thermal Printers (Epson, TVS)</li>
                  <li>Laser GST A4/A5 Invoices</li>
                  <li>Android Smartphones & Tablets</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3">Support & Helpline</h4>
                <ul className="space-y-2 font-medium">
                  <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-emerald-600" /> Helpline: +91 98765 43210</li>
                  <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-emerald-600" /> support@davasetu.com</li>
                  <li className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-emerald-600" /> 100% Hosted in Secure Cloud</li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
              <p>© {new Date().getFullYear()} DavaSetu Cloud POS. All rights reserved.</p>
              <div className="flex gap-4">
                <button onClick={() => navigate('/login')} className="hover:text-emerald-600">Chemist Login</button>
                <span>•</span>
                <button onClick={() => setActiveView('pos_terminal')} className="hover:text-emerald-600 font-bold text-emerald-700">In-Built Terminal</button>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* WHATSAPP MODAL PREVIEW */}
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
              <p>Your medicine invoice #10842 is ready.</p>
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

    </div>
  );
}
