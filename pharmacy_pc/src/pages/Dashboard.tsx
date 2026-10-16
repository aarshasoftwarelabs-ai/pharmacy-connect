import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  IndianRupee, FileText, CheckCircle, Clock, 
  PlusCircle, Users, Activity, FileBox, 
  ActivitySquare, Pill, 
  ArrowRight, Package, Loader2, AlertCircle, RefreshCw, 
  UserCircle, CheckCircle2, Receipt, AlertTriangle, Boxes
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
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Compute stats
  const todayStr = new Date().toDateString();
  const todaysBills = bills.filter(b => new Date(b.createdAt).toDateString() === todayStr);
  const todaysSalesValue = todaysBills.reduce((sum, b) => sum + Number(b.total), 0);
  
  // Inventory stats
  const lowStockMedicines = medicines.filter(m => Number(m.currentStock || 0) <= (m.minimumStock || 10) && Number(m.currentStock || 0) > 0);
  const outOfStockMedicines = medicines.filter(m => Number(m.currentStock || 0) <= 0);
  const healthyStockMedicines = medicines.filter(m => Number(m.currentStock || 0) > (m.minimumStock || 10));
  const totalStockUnits = medicines.reduce((sum, m) => sum + Number(m.currentStock || 0), 0);
  const totalInventoryValue = medicines.reduce((sum, m) => sum + (Number(m.sellingPrice || 0) * Number(m.currentStock || 0)), 0);
  const inStockPercent = medicines.length > 0 ? Math.round((healthyStockMedicines.length / medicines.length) * 100) : 100;
  const lowStockPercent = medicines.length > 0 ? Math.round((lowStockMedicines.length / medicines.length) * 100) : 0;
  const outOfStockPercent = medicines.length > 0 ? Math.round((outOfStockMedicines.length / medicines.length) * 100) : 0;

  const newCustomersCount = customers.filter(c => new Date(c.created_at).toDateString() === todayStr).length;
  const activeCustomersCount = customers.filter(c => c.is_active !== false).length;

  const recentTimeline = [...bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const pendingBillsAmount = bills.filter(b => b.paymentStatus === 'UNPAID').reduce((sum, b) => sum + Number(b.total), 0);

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


        {/* ROW 2: SALES OVERVIEW (8) & INVENTORY STOCK HEALTH (4) */}
        
        {/* SALES OVERVIEW CHART */}
        <SalesOverviewChart bills={bills} className="col-span-1 lg:col-span-8" />

        {/* INVENTORY HEALTH WIDGET (Executive Stock & Health Insight) */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            {/* Header with Status Pill and Quick Link */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Inventory Health
                  </h3>
                  <p className="text-xs text-slate-400">Stock availability & valuation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  outOfStockMedicines.length === 0 && lowStockMedicines.length === 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : outOfStockMedicines.length > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    outOfStockMedicines.length === 0 && lowStockMedicines.length === 0
                      ? 'bg-emerald-500 animate-pulse'
                      : outOfStockMedicines.length > 0
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`} />
                  {inStockPercent}% Optimal
                </span>
                <Link to="/inventory" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="View Full Inventory">
                  <ArrowRight className="w-4 h-4 -rotate-45" />
                </Link>
              </div>
            </div>

            {/* Segmented Visual Health Meter */}
            <div className="mb-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
                <span>Health Distribution</span>
                <span className="font-bold text-slate-800">{medicines.length} Products</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${inStockPercent}%` }} 
                  className="bg-emerald-500 transition-all duration-500" 
                  title={`In Stock: ${healthyStockMedicines.length} (${inStockPercent}%)`}
                />
                <div 
                  style={{ width: `${lowStockPercent}%` }} 
                  className="bg-amber-400 transition-all duration-500" 
                  title={`Low Stock: ${lowStockMedicines.length} (${lowStockPercent}%)`}
                />
                <div 
                  style={{ width: `${outOfStockPercent}%` }} 
                  className="bg-rose-500 transition-all duration-500" 
                  title={`Out of Stock: ${outOfStockMedicines.length} (${outOfStockPercent}%)`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-medium mt-1.5 px-0.5">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock ({inStockPercent}%)
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Low ({lowStockPercent}%)
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out ({outOfStockPercent}%)
                </span>
              </div>
            </div>

            {/* Status Breakdown Items (Clickable) */}
            <div className="space-y-2 mb-4">
              {/* Healthy Stock */}
              <div 
                className="group flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-emerald-50/80 rounded-2xl border border-slate-100/80 hover:border-emerald-200 transition-all cursor-pointer" 
                onClick={() => navigate('/inventory')}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2.5 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">In Stock</h4>
                    <p className="text-[10px] text-slate-400">Sufficient quantity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100/70 text-emerald-800 rounded-lg text-[10px] font-bold">
                    {inStockPercent}%
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600 min-w-[20px] text-right">
                    {healthyStockMedicines.length}
                  </span>
                </div>
              </div>

              {/* Low Stock */}
              <div 
                className="group flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-amber-50/80 rounded-2xl border border-slate-100/80 hover:border-amber-200 transition-all cursor-pointer" 
                onClick={() => navigate('/inventory')}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mr-2.5 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-900">Low Stock</h4>
                    <p className="text-[10px] text-slate-400">Needs purchase order</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lowStockMedicines.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold">
                      Reorder
                    </span>
                  )}
                  <span className="text-sm font-extrabold text-amber-600 min-w-[20px] text-right">
                    {lowStockMedicines.length}
                  </span>
                </div>
              </div>

              {/* Out of Stock */}
              <div 
                className="group flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-rose-50/80 rounded-2xl border border-slate-100/80 hover:border-rose-200 transition-all cursor-pointer" 
                onClick={() => navigate('/inventory')}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mr-2.5 group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-rose-900">Out of Stock</h4>
                    <p className="text-[10px] text-slate-400">Zero inventory</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {outOfStockMedicines.length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold">
                      Critical
                    </span>
                  )}
                  <span className="text-sm font-extrabold text-rose-600 min-w-[20px] text-right">
                    {outOfStockMedicines.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stock Insights: Units & Valuation & Quick Link */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock</span>
                <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                  {totalStockUnits.toLocaleString('en-IN')} <span className="text-[10px] font-medium text-slate-400">Units</span>
                </span>
              </div>
              <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Value</span>
                <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <Link
              to="/inventory"
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 group"
            >
              <span>Manage Stock & Reorders</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>


        {/* ROW 3: CUSTOMER OVERVIEW (4), BILLING OVERVIEW (4), RECENT INVOICES (4) */}
        
        {/* CUSTOMER OVERVIEW */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" /> 
              Customers
            </h3>
          </div>
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex items-center mb-4">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
               <UserCircle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-blue-800 text-sm font-semibold">Total Base</p>
               <h4 className="text-2xl font-bold text-blue-900">{customers.length}</h4>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
               <p className="text-slate-500 text-xs font-semibold mb-1">New Today</p>
               <h4 className="text-xl font-bold text-slate-800">{newCustomersCount}</h4>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
               <p className="text-slate-500 text-xs font-semibold mb-1">Active</p>
               <h4 className="text-xl font-bold text-slate-800">{activeCustomersCount}</h4>
             </div>
          </div>
        </motion.div>

        {/* BILLING OVERVIEW */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FileBox className="w-5 h-5 mr-2 text-violet-500" /> 
              Billing Summary
            </h3>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-slate-400 mr-3" />
                <span className="font-semibold text-slate-700">Total Bills</span>
              </div>
              <span className="font-bold text-slate-800">{bills.length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-500 mr-3" />
                <span className="font-semibold text-emerald-800">Paid Amount</span>
              </div>
              <span className="font-bold text-emerald-700">₹{bills.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + Number(b.total), 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-red-400 mr-3" />
                <span className="font-semibold text-red-800">Pending Amount</span>
              </div>
              <span className="font-bold text-red-700">₹{pendingBillsAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </motion.div>

        {/* RECENT INVOICES (Replaced Mixed Activity with Pure POS Transactions) */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" /> 
              Recent Invoices
            </h3>
            <Link to="/billing" className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentTimeline.length === 0 ? (
              <div className="h-full min-h-[150px] flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                No invoices created yet today.
              </div>
            ) : (
              <div className="space-y-4">
                {recentTimeline.map((bill, i) => (
                  <div key={`bill-${bill.id}-${i}`} className="flex items-start group">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mr-3 group-hover:bg-emerald-100 transition-colors">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-slate-800 font-semibold line-clamp-1">
                        Invoice #{bill.billNumber || String(bill.id).slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                        <span className="font-bold text-slate-700">₹{Number(bill.total).toLocaleString('en-IN')} • {bill.paymentStatus}</span>
                        <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>


        {/* ROW 4: QUICK ACTIONS (8) & STAFF AUDIT (4) */}
        
        {/* QUICK ACTIONS */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-8 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
           <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/billing" className="bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-emerald-600 transition-all">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">New Bill</span>
            </Link>
            <Link to="/inventory" className="bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-blue-600 transition-all">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Inventory</span>
            </Link>
            <Link to="/customers" className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-amber-600 transition-all">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Customers</span>
            </Link>
            <Link to="/reports" className="bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-purple-600 transition-all">
                <FileBox className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Reports</span>
            </Link>
          </div>
        </motion.div>

        {/* STAFF AUDIT */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <UserCircle className="w-5 h-5 mr-2 text-slate-400" /> 
              Staff Audit
            </h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400 shadow-inner">
               <ActivitySquare className="w-6 h-6" />
             </div>
             <p className="text-sm font-bold text-slate-700 mb-1">No Recent Activity</p>
             <p className="text-xs text-slate-500">Staff actions and audit events will appear here.</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
