import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  IndianRupee, FileText, CheckCircle, Clock, 
  PlusCircle, Users, Activity, FileBox, 
  ActivitySquare, Pill, 
  ArrowRight, Package, Loader2, AlertCircle, RefreshCw, 
  UserCircle, CheckCircle2, Receipt, AlertTriangle,
  Calendar, Wallet, TrendingUp, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { fetchMedicines } from '../services/medicineService';
import { BillingService } from '../services/billingService';
import { CustomerService, CustomerProfile } from '../services/customerService';
import { getPharmacyId } from '../config/development';
import { Medicine } from '../types/medicine';
import { Bill } from '../types/billing';
import SalesOverviewChart from '../components/dashboard/SalesOverviewChart';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
  return <span>{prefix}{value.toLocaleString('en-IN')}{suffix}</span>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [activeHubTab, setActiveHubTab] = useState<'alerts' | 'counter'>('alerts');
  const [pharmacyName, setPharmacyName] = useState('K.Y Pharmacy');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setRefreshing(true);

      const pharmacyId = getPharmacyId();
      const [medsData, billsData, custData] = await Promise.all([
        fetchMedicines().catch(() => []),
        BillingService.getPharmacyBills(pharmacyId).catch(() => []),
        CustomerService.getCustomers().catch(() => [])
      ]);
      
      setMedicines(medsData);
      setBills(billsData);
      setCustomers(custData);
      if (!isBackgroundRefresh) setError(null);
    } catch (err: any) {
      if (!isBackgroundRefresh) {
        if (err.message === 'Failed to fetch' || err.message === 'Load failed') {
          setError('Cannot connect to the backend server. Please make sure the backend is running.');
        } else {
          setError(err.message || 'Unable to load dashboard data');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 6000);

    const handleFocus = () => fetchDashboardData(true);
    window.addEventListener('focus', handleFocus);

    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const p = JSON.parse(localData);
        if (p.name) setPharmacyName(p.name);
      }
    } catch (_) {}

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Compute stats
  const todayStr = new Date().toDateString();
  const todaysBills = bills.filter(b => new Date(b.createdAt).toDateString() === todayStr);
  const todaysSalesValue = todaysBills.reduce((sum, b) => sum + Number(b.total), 0);
  
  // Inventory stats
  const lowStockMedicines = medicines.filter(m => Number(m.currentStock || 0) <= (m.minimumStock || 10) && Number(m.currentStock || 0) > 0);
  const outOfStockMedicines = medicines.filter(m => Number(m.currentStock || 0) <= 0);
  const totalStockUnits = medicines.reduce((sum, m) => sum + Number(m.currentStock || 0), 0);

  const newCustomersCount = customers.filter(c => new Date(c.created_at).toDateString() === todayStr).length;
  const activeCustomersCount = customers.filter(c => c.is_active !== false).length;

  const recentTimeline = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const pendingBillsAmount = bills
    .filter(b => b.paymentStatus === 'UNPAID')
    .reduce((sum, b) => sum + Number(b.total), 0);

  // --- All-in-One Smart Hub Calculations ---
  const nearExpiryMeds = medicines
    .map(m => {
      const expStr = m.expiryDate || (m.batches && m.batches[0]?.expiryDate);
      if (!expStr) return null;
      const expDate = new Date(expStr);
      if (isNaN(expDate.getTime())) return null;
      const days = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return { 
        ...m, 
        daysUntilExpiry: days, 
        expDateFormatted: expDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) 
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null && m.daysUntilExpiry <= 90)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const criticalStockList = [
    ...outOfStockMedicines.map(m => ({ ...m, shortageType: 'OUT_OF_STOCK' as const, daysUntilExpiry: null, expDateFormatted: null })),
    ...lowStockMedicines.map(m => ({ ...m, shortageType: 'LOW_STOCK' as const, daysUntilExpiry: null, expDateFormatted: null })),
    ...nearExpiryMeds.map(m => ({ ...m, shortageType: 'NEAR_EXPIRY' as const }))
  ];

  const todaysCash = todaysBills
    .filter(b => b.paymentMode === 'CASH' || (!b.paymentMode && b.paymentStatus === 'PAID'))
    .reduce((sum, b) => sum + Number(b.total), 0);

  const todaysUPI = todaysBills
    .filter(b => b.paymentMode === 'UPI' || b.paymentMode === 'ONLINE' || b.paymentMode === 'CARD')
    .reduce((sum, b) => sum + Number(b.total), 0);

  const todaysEstProfit = Math.round(todaysSalesValue * 0.18);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Unable to load dashboard data</h2>
        <p className="text-slate-500 mb-8 max-w-md">{error}</p>
        <button onClick={() => fetchDashboardData(false)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-sm shadow-emerald-200">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 space-y-6">
      
      {/* 1. TOP HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight w-fit">
            Good morning, Pharmacy Owner
          </h1>
          <p className="text-slate-500 font-medium flex items-center mt-1">
            <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
            {todayDate}
            {refreshing && <RefreshCw className="w-3.5 h-3.5 ml-3 text-emerald-500 animate-spin" />}
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* 2. PRIMARY BENTO METRICS */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 1: TODAY'S SALES */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/billing')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live POS
                </span>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Today's Sales</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10 flex items-baseline">
                ₹<AnimatedNumber value={todaysSalesValue} />
              </h2>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                {todaysBills.length} {todaysBills.length === 1 ? 'Bill' : 'Bills'} today
              </span>
              <span className="font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                New Bill <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* CARD 2: TODAY'S BILLS */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/billing')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
                  Invoices
                </span>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Today's Invoices</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={todaysBills.length} />
              </h2>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                ₹{todaysBills.length > 0 ? Math.round(todaysSalesValue / todaysBills.length).toLocaleString('en-IN') : 0} avg / bill
              </span>
              <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View History <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* CARD 3: LOW STOCK ALERTS (Replaced Customer Requests) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/inventory')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
                  {lowStockMedicines.length > 0 ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Stock Alert
                    </>
                  ) : (
                    'Sufficient'
                  )}
                </span>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Low Stock Medicines</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={lowStockMedicines.length + outOfStockMedicines.length} />
              </h2>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                {outOfStockMedicines.length} Out of Stock • {lowStockMedicines.length} Low
              </span>
              <span className="font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Reorder Stock <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* CARD 4: TOTAL INVENTORY (Replaced Confirmed Orders) */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/inventory')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm">
                  Active Catalog
                </span>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Total Medicines</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={medicines.length} />
              </h2>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                {totalStockUnits.toLocaleString('en-IN')} units in stock
              </span>
              <span className="font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Inventory <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: SALES ANALYTICS (8 cols) & RECENT INVOICES (4 cols) */}
        
        {/* SALES OVERVIEW CHART */}
        <SalesOverviewChart bills={bills} className="col-span-1 lg:col-span-8" />

        {/* RECENT INVOICES (Live POS Transaction Feed) */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Recent Invoices
                  </h3>
                  <p className="text-xs text-slate-400">Live POS transactions feed</p>
                </div>
              </div>
              <Link 
                to="/billing" 
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Invoices List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {recentTimeline.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                  <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">No invoices generated yet today.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click below to start counter billing</p>
                </div>
              ) : (
                recentTimeline.map((bill, i) => (
                  <div 
                    key={`bill-${bill.id}-${i}`} 
                    onClick={() => navigate('/billing')}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/60 border border-slate-100/80 hover:border-indigo-200/70 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                        <Receipt className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                          #{bill.billNumber || String(bill.id).slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-500">
                            {bill.customerName ? bill.customerName : 'Walk-in'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">
                        ₹{Number(bill.total).toLocaleString('en-IN')}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        bill.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bill.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Footer Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
            <span className="font-semibold text-slate-500">
              {todaysBills.length} Invoices Today
            </span>
            <Link 
              to="/billing" 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Bill</span>
            </Link>
          </div>
        </motion.div>


        {/* ROW 3: ALL-IN-ONE SMART OPERATIONS HUB (Full Width 12 cols) */}
        
        <motion.div variants={itemVariants} className="col-span-12 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          {/* Header & Segmented Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Smart Operations Hub</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Daily Priority
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Critical expiry alerts, shortage restock & daily counter cash
              </p>
            </div>

            {/* Segmented Pill Tabs */}
            <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-stretch sm:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveHubTab('alerts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'alerts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${activeHubTab === 'alerts' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Expiry & Stock</span>
                {criticalStockList.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeHubTab === 'alerts' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {criticalStockList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveHubTab('counter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeHubTab === 'counter'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wallet className={`w-3.5 h-3.5 ${activeHubTab === 'counter' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>Counter Register</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          </div>

          {/* TAB 1: EXPIRY & CRITICAL STOCK RADAR */}
          {activeHubTab === 'alerts' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              {/* Quick Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Near Expiry (&lt;90d)</span>
                    <h5 className="text-lg font-black text-amber-900">{nearExpiryMeds.length} Items</h5>
                  </div>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Out of Stock</span>
                    <h5 className="text-lg font-black text-rose-900">{outOfStockMedicines.length} Items</h5>
                  </div>
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Low Threshold</span>
                    <h5 className="text-lg font-black text-slate-900">{lowStockMedicines.length} Items</h5>
                  </div>
                  <Package className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Items List (Responsive 2-column grid for spacious layout) */}
              <div className="max-h-[260px] overflow-y-auto pr-1">
                {criticalStockList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {criticalStockList.slice(0, 6).map((med, idx) => (
                      <div
                        key={med.id || idx}
                        onClick={() => navigate('/inventory')}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 hover:shadow-xs transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            med.shortageType === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-600'
                              : med.shortageType === 'NEAR_EXPIRY'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            <Pill className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                {med.name}
                              </h5>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {med.strength || med.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {med.shortageType === 'NEAR_EXPIRY' && med.daysUntilExpiry !== null ? (
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                  med.daysUntilExpiry <= 30
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {med.daysUntilExpiry <= 0 ? 'Expired' : `Expires in ${med.daysUntilExpiry}d (${med.expDateFormatted})`}
                                </span>
                              ) : med.shortageType === 'OUT_OF_STOCK' ? (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                                  0 Units in Stock
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Low: {med.currentStock} left (Min: {med.minimumStock || 10})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 ml-2">
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-800">₹{Number(med.sellingPrice || 0).toFixed(2)}</p>
                            <p className="text-[9px] text-slate-400 font-medium">Selling MRP</p>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 text-white hover:bg-emerald-600 transition-colors">
                            Restock <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <h5 className="text-sm font-bold text-emerald-900">All Stock is 100% Healthy!</h5>
                    <p className="text-xs text-emerald-700 mt-0.5">Zero medicines expiring in the next 90 days and all critical medicines are well stocked.</p>
                  </div>
                )}
              </div>

              {/* Bottom Direct Jump */}
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100">
                <span>Total Catalog: <strong>{medicines.length} Products</strong> ({totalStockUnits.toLocaleString('en-IN')} units)</span>
                <Link to="/inventory" className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1">
                  Open Smart Inventory <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: TODAY'S CASHIER & REGISTER */}
          {activeHubTab === 'counter' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              {/* 4 Register Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Cash Drawer</span>
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-black text-emerald-900">₹{todaysCash.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Physical Cash In Hand</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">UPI / QR Code</span>
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-black text-blue-900">₹{todaysUPI.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-blue-700 font-medium mt-0.5">Direct Bank Credit</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Avg Bill Value</span>
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">
                    ₹{todaysBills.length > 0 ? (todaysSalesValue / todaysBills.length).toFixed(0) : '0'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Per Walk-in Patient</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-violet-800 uppercase tracking-wider">Est. Gross Profit</span>
                    <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <h4 className="text-xl font-black text-violet-900">₹{todaysEstProfit.toLocaleString('en-IN')}</h4>
                  <p className="text-[10px] text-violet-700 font-medium mt-0.5">~18% Retail Margin</p>
                </div>
              </div>

              {/* Fast POS Shortcuts Bar */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    POS
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">
                      Counter Status: {todaysBills.length} Receipts Generated Today
                    </h5>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Avg Basket Size: ₹{todaysBills.length > 0 ? (todaysSalesValue / todaysBills.length).toFixed(1) : '0'} per patient
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to="/billing"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Bill</span>
                  </Link>
                  <Link
                    to="/reports"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Daybook</span>
                  </Link>
                </div>
              </div>

              {/* Bottom Direct Jump */}
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100">
                <span>Today's Net Total: <strong className="text-slate-900">₹{todaysSalesValue.toLocaleString('en-IN')}</strong></span>
                <Link to="/reports" className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1">
                  View Full Accounting Reports <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>


        {/* ROW 4: CUSTOMERS (4 cols), BILLING SUMMARY (4 cols), STATION AUDIT (4 cols) */}
        
        {/* CUSTOMER BASE */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Customer Base</h3>
                  <p className="text-xs text-slate-400">Directory & engagement</p>
                </div>
              </div>
              <Link to="/customers" className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors">
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl p-4 border border-blue-100 flex items-center mb-4">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-xs">
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-700 text-xs font-bold uppercase tracking-wider">Total Registered</p>
                <h4 className="text-2xl font-black text-blue-950 mt-0.5">{customers.length}</h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex flex-col justify-center">
                <p className="text-slate-500 text-xs font-bold mb-0.5">New Today</p>
                <h4 className="text-lg font-black text-slate-800">{newCustomersCount}</h4>
                <span className="text-[10px] text-slate-400 font-medium">Added to database</span>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex flex-col justify-center">
                <p className="text-slate-500 text-xs font-bold mb-0.5">Active</p>
                <h4 className="text-lg font-black text-slate-800">{activeCustomersCount}</h4>
                <span className="text-[10px] text-emerald-600 font-bold">In good standing</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Patient Directory</span>
            <Link to="/customers" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
              View All Customers <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* BILLING SUMMARY */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl">
                  <FileBox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Billing Summary</h3>
                  <p className="text-xs text-slate-400">Total revenue & collection</p>
                </div>
              </div>
              <Link to="/billing" className="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-xl transition-colors">
                <span>Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-slate-400 mr-2.5" />
                  <span className="text-xs font-bold text-slate-700">Total Lifetime Bills</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{bills.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2.5" />
                  <span className="text-xs font-bold text-emerald-800">Total Paid Amount</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-700">₹{bills.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + Number(b.total), 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rose-50/70 rounded-2xl border border-rose-100">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-rose-400 mr-2.5" />
                  <span className="text-xs font-bold text-rose-800">Pending Amount</span>
                </div>
                <span className="text-sm font-extrabold text-rose-700">₹{pendingBillsAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">POS Receipts</span>
            <Link to="/reports" className="font-bold text-violet-600 hover:underline flex items-center gap-1">
              Financial Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* STATION & SECURITY AUDIT */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-2xl">
                  <ActivitySquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Station & Security</h3>
                  <p className="text-xs text-slate-400">Terminal & session audit</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged In Role</span>
                  <span className="text-xs font-bold text-slate-800">Pharmacy Administrator</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  Primary POS
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Location</span>
                  <span className="text-xs font-bold text-slate-800">{pharmacyName || 'Main Counter'}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 font-mono">
                  v1.0.0
                </span>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-800">Offline Sync & DB Active</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">Healthy</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">System Logs</span>
            <Link to="/settings" className="font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              Settings & Config <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
