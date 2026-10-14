import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  IndianRupee, FileText, Inbox, CheckCircle, Clock, 
  PlusCircle, Users, Activity, Bell, FileBox, 
  ActivitySquare, Pill, FileSignature, 
  ArrowRight, Package, Loader2, AlertCircle, RefreshCw, 
  User, TrendingUp, UserCircle, CheckCircle2, Receipt, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { MedicineRequestService } from '../services/medicineRequestService';
import { BillingService } from '../services/billingService';
import { CustomerService, CustomerProfile } from '../services/customerService';
import { getPharmacyId } from '../config/development';
import { MedicineRequest } from '../types/medicineRequest';
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

  const [requests, setRequests] = useState<MedicineRequest[]>([]);
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
      const [reqData, billsData, custData] = await Promise.all([
        MedicineRequestService.getPharmacyRequests(pharmacyId),
        BillingService.getPharmacyBills(pharmacyId),
        CustomerService.getCustomers()
      ]);
      
      setRequests(reqData);
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
  
  const waitingRequests = requests.filter(r => r.status === 'WAITING');
  const availableRequests = requests.filter(r => r.status === 'AVAILABLE');
  const canArrangeRequests = requests.filter(r => r.status === 'CAN_ARRANGE');
  
  const pendingRequestsCount = waitingRequests.length;
  const confirmedRequestsCount = requests.filter(r => r.customerConfirmation === 'CONFIRMED').length;

  const newCustomersCount = customers.filter(c => new Date(c.created_at).toDateString() === todayStr).length;
  const activeCustomersCount = customers.filter(c => c.is_active !== false).length;

  const recentTimeline = [...requests, ...bills]
    .sort((a, b) => {
      const timeA = 'requestedAt' in a ? new Date(a.requestedAt).getTime() : new Date((a as Bill).createdAt).getTime();
      const timeB = 'requestedAt' in b ? new Date(b.requestedAt).getTime() : new Date((b as Bill).createdAt).getTime();
      return timeB - timeA;
    })
    .slice(0, 5);

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
        {/* 2. PRIMARY BENTO METRICS - ULTRA CREATIVE, ANIMATED & INTERACTIVE */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 1: TODAY'S SALES */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/billing')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            {/* Ambient Animated Blob */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              {/* Header: Icon + Live Badge */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live POS
                </span>
              </div>

              {/* Title & Big Amount */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Today's Sales</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10 flex items-baseline">
                ₹<AnimatedNumber value={todaysSalesValue} />
              </h2>
            </div>

            {/* Bottom Action / Sub-metric */}
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
            {/* Ambient Animated Blob */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm">
                  Invoices
                </span>
              </div>

              {/* Title & Count */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Today's Invoices</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={todaysBills.length} />
              </h2>
            </div>

            {/* Bottom Action / Sub-metric */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                ₹{todaysBills.length > 0 ? Math.round(todaysSalesValue / todaysBills.length).toLocaleString('en-IN') : 0} avg / bill
              </span>
              <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View History <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* CARD 3: PENDING REQUESTS */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/medicine-requests')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            {/* Ambient Animated Blob */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <ActivitySquare className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm">
                  {pendingRequestsCount > 0 ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Needs Action
                    </>
                  ) : (
                    'All Clear'
                  )}
                </span>
              </div>

              {/* Title & Count */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Customer Requests</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={pendingRequestsCount} />
              </h2>
            </div>

            {/* Bottom Action / Sub-metric */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                {waitingRequests.length} waiting • {canArrangeRequests.length} arrange
              </span>
              <span className="font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Respond Now <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>

          {/* CARD 4: CONFIRMED TO BILL */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/orders')}
            className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/90 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
          >
            {/* Ambient Animated Blob */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div>
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm">
                  Ready to Dispense
                </span>
              </div>

              {/* Title & Count */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 relative z-10">Confirmed Orders</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
                <AnimatedNumber value={confirmedRequestsCount} />
              </h2>
            </div>

            {/* Bottom Action / Sub-metric */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-semibold text-slate-500">
                Patient Accepted
              </span>
              <span className="font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Create Bill <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </div>


        {/* ROW 2: SALES OVERVIEW (8) & MEDICINE REQUEST STATUS (4) */}
        
        {/* 4. SALES OVERVIEW - HIGH END ANIMATED & CREATIVE CHART */}
        <SalesOverviewChart bills={bills} className="col-span-1 lg:col-span-8" />

        {/* 3. MEDICINE REQUEST STATUS CARD */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Inbox className="w-5 h-5 mr-2 text-indigo-500" /> 
              Request Status
            </h3>
            <Link to="/medicine-requests" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <ArrowRight className="w-4 h-4 -rotate-45" />
            </Link>
          </div>
          
          <div className="flex-1 space-y-4 flex flex-col justify-center">
            <div className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer" onClick={() => navigate('/medicine-requests')}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-900">Waiting</h4>
                  <p className="text-xs text-slate-500">Needs review</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-amber-600">{waitingRequests.length}</span>
            </div>

            <div className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer" onClick={() => navigate('/medicine-requests')}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-900">Available</h4>
                  <p className="text-xs text-slate-500">In stock</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-emerald-600">{availableRequests.length}</span>
            </div>

            <div className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => navigate('/medicine-requests')}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-900">Can Arrange</h4>
                  <p className="text-xs text-slate-500">From supplier</p>
                </div>
              </div>
              <span className="text-lg font-extrabold text-blue-600">{canArrangeRequests.length}</span>
            </div>
          </div>
        </motion.div>


        {/* ROW 3: CUSTOMER OVERVIEW (4), BILLING OVERVIEW (4), RECENT ACTIVITY (4) */}
        
        {/* 6. CUSTOMER OVERVIEW */}
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

        {/* 5. BILLING OVERVIEW */}
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

        {/* 9. RECENT ACTIVITY */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" /> 
              Recent Events
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentTimeline.length === 0 ? (
              <div className="h-full min-h-[150px] flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                No recent activity today.
              </div>
            ) : (
              <div className="space-y-4">
                {recentTimeline.map((item, i) => {
                  const isBill = 'billNumber' in item || 'paymentStatus' in item;
                  
                  if (isBill) {
                    const bill = item as Bill;
                    return (
                      <div key={`bill-${bill.id}-${i}`} className="flex items-start group">
                        <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center shrink-0 mr-3 group-hover:bg-violet-100 transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm text-slate-800 font-semibold line-clamp-1">
                            Bill {bill.billNumber}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>₹{bill.total} • {bill.paymentStatus}</span>
                            <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    const req = item as MedicineRequest;
                    return (
                      <div key={`req-${req.id}-${i}`} className="flex items-start group">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 mr-3 group-hover:bg-indigo-100 transition-colors">
                          <Inbox className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="text-sm text-slate-800 font-semibold line-clamp-1">
                            Request from {req.customerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                            <span className="text-indigo-600 font-medium">{req.status}</span>
                            <span>{new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </motion.div>


        {/* ROW 4: QUICK ACTIONS (8) & STAFF ACTIVITY (4) */}
        
        {/* 8. QUICK ACTIONS */}
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
            <Link to="/medicine-requests" className="bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-indigo-600 transition-all">
                <Inbox className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Requests</span>
            </Link>
            <Link to="/inventory" className="bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-blue-600 transition-all">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Add Medicine</span>
            </Link>
            <Link to="/customers" className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center group transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:shadow text-slate-400 group-hover:text-amber-600 transition-all">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700">Add Customer</span>
            </Link>
          </div>
        </motion.div>

        {/* 7. STAFF ACTIVITY (EMPTY STATE) */}
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
