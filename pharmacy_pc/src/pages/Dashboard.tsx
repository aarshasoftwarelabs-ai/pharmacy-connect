import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, IndianRupee, Clock, PlusCircle, FileText, Inbox, Eye, Loader2, AlertCircle, RefreshCw, Users, Activity, Bell, FileBox, UserCircle, ChevronRight, ActivitySquare, Pill, FileSignature, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { MedicineRequestService } from '../services/medicineRequestService';
import { BillingService } from '../services/billingService';
import { CustomerService, CustomerProfile } from '../services/customerService';
import { getPharmacyId } from '../config/development';
import { MedicineRequest } from '../types/medicineRequest';
import { Bill } from '../types/billing';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 400, damping: 30 } 
  }
};

const AnimatedNumber = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
  return <span>{prefix}{value.toLocaleString('en-IN')}{suffix}</span>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
        setError(err.message || 'Unable to load dashboard data');
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
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  // Compute stats
  const todayStr = new Date().toDateString();
  const todaysBills = bills.filter(b => new Date(b.createdAt).toDateString() === todayStr);
  const todaysSalesValue = todaysBills.reduce((sum, b) => sum + Number(b.total), 0);
  
  const waitingRequests = requests.filter(r => r.status === 'WAITING');
  const availableRequests = requests.filter(r => r.status === 'AVAILABLE');
  const canArrangeRequests = requests.filter(r => r.status === 'CAN_ARRANGE');
  const notAvailableRequests = requests.filter(r => r.status === 'NOT_AVAILABLE');
  
  const pendingRequestsCount = waitingRequests.length;
  const confirmedRequestsCount = requests.filter(r => r.customerConfirmation === 'CONFIRMED').length;

  const newCustomersCount = customers.filter(c => new Date(c.created_at).toDateString() === todayStr).length;

  const recentTimeline = [...requests, ...bills]
    .sort((a, b) => {
      const timeA = 'requestedAt' in a ? new Date(a.requestedAt).getTime() : new Date((a as Bill).createdAt).getTime();
      const timeB = 'requestedAt' in b ? new Date(b.requestedAt).getTime() : new Date((b as Bill).createdAt).getTime();
      return timeB - timeA;
    })
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to load data</h2>
        <p className="text-slate-500 mb-8 max-w-md">{error}</p>
        <button onClick={() => fetchDashboardData(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-8 overflow-hidden px-1">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Good morning, K.Y Pharmacy</h1>
          <p className="mt-1.5 text-slate-500 font-medium">Here's what's happening at your pharmacy today.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center text-sm font-semibold text-slate-700">
            <Clock className="w-4 h-4 mr-2 text-indigo-500" />
            {todayDate}
          </div>
          <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition-colors relative">
            <Bell className="w-5 h-5" />
            {pendingRequestsCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
          </div>
        </motion.div>
      </header>

      {/* BENTO GRID */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        
        {/* HERO CARD (Col Span 8) */}
        <motion.div 
          variants={itemVariants} 
          className="col-span-1 md:col-span-12 lg:col-span-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/10 group flex flex-col justify-between"
        >
          {/* Subtle background abstract shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/30 transition-all duration-700"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide border border-white/10">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              LIVE TODAY
            </div>
            {refreshing && <RefreshCw className="w-4 h-4 text-white/50 animate-spin" />}
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-indigo-200 font-medium mb-1 flex items-center"><IndianRupee className="w-4 h-4 mr-1.5" /> Today's Sales</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">₹<AnimatedNumber value={todaysSalesValue} /></h2>
            </div>
            <div>
              <p className="text-indigo-200 font-medium mb-1 flex items-center"><FileSignature className="w-4 h-4 mr-1.5" /> Bills Generated</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight"><AnimatedNumber value={todaysBills.length} /></h2>
            </div>
            <div>
              <p className="text-indigo-200 font-medium mb-1 flex items-center"><ActivitySquare className="w-4 h-4 mr-1.5" /> Pending Actions</p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-yellow-300"><AnimatedNumber value={pendingRequestsCount + confirmedRequestsCount} /></h2>
            </div>
          </div>
        </motion.div>

        {/* LIVE MEDICINE REQUESTS (Col Span 4) */}
        <motion.div 
          variants={itemVariants}
          onClick={() => navigate('/medicine-requests')}
          className="col-span-1 md:col-span-6 lg:col-span-4 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col cursor-pointer group hover:shadow-lg hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="p-2 bg-slate-50 text-slate-400 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
              <ArrowRight className="w-4 h-4 -rotate-45" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Medicine Requests</h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">Live incoming inquiries</p>
          
          <div className="flex-1 flex flex-col justify-end space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
              <span className="text-sm font-semibold text-yellow-700 flex items-center"><Clock className="w-4 h-4 mr-2 text-yellow-500" />Waiting</span>
              <span className="font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-md">{waitingRequests.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
              <span className="text-sm font-semibold text-emerald-700 flex items-center"><Pill className="w-4 h-4 mr-2 text-emerald-500" />Available</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{availableRequests.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <span className="text-sm font-semibold text-blue-700 flex items-center"><Package className="w-4 h-4 mr-2 text-blue-500" />Can Arrange</span>
              <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{canArrangeRequests.length}</span>
            </div>
          </div>
        </motion.div>

        {/* BILLING (Col Span 6) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-6 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <FileBox className="w-5 h-5 mr-2 text-indigo-500" /> Billing Center
            </h3>
            <button onClick={() => navigate('/billing')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
              Open Billing <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-center">
              <p className="text-slate-500 text-sm font-medium mb-1">Bills Today</p>
              <h4 className="text-3xl font-bold text-slate-800">{todaysBills.length}</h4>
            </div>
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-50 flex flex-col justify-center">
              <p className="text-indigo-600 text-sm font-medium mb-1">Confirmed to Bill</p>
              <h4 className="text-3xl font-bold text-indigo-900">{confirmedRequestsCount}</h4>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACTIONS & SALES OVERVIEW (Col Span 6) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 lg:col-span-6 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-slate-400" /> Sales Trend
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">Past 7 Days</span>
          </div>
          
          {/* Simple CSS Bar Chart using real bills data */}
          <div className="flex-1 flex items-end justify-between gap-2 h-32 mb-6 mt-2 relative">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full h-px bg-slate-50"></div>
              <div className="w-full h-px bg-slate-50"></div>
              <div className="w-full h-px bg-slate-100"></div>
            </div>
            
            {/* Generate bars from last 7 days */}
            {[...Array(7)].map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dayStr = d.toDateString();
              const dayBills = bills.filter(b => new Date(b.createdAt).toDateString() === dayStr);
              const daySales = dayBills.reduce((s, b) => s + Number(b.total), 0);
              const maxSales = Math.max(5000, ...bills.map(b => Number(b.total))); // fallback to 5k scale
              const heightPct = Math.max(10, Math.min(100, (daySales / maxSales) * 100));
              const isToday = i === 6;
              
              return (
                <div key={i} className="relative flex flex-col items-center flex-1 h-full justify-end group z-10">
                  <div 
                    className={`w-full max-w-[2.5rem] rounded-t-lg transition-all duration-500 ${isToday ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-200 group-hover:bg-indigo-300'}`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-20">
                    ₹{daySales.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/billing" className="bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center group transition-all">
              <PlusCircle className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span className="text-xs font-semibold text-slate-700">New Bill</span>
            </Link>
            <Link to="/orders" className="bg-slate-50 hover:bg-blue-50 hover:border-blue-100 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center group transition-all">
              <ShoppingCart className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
              <span className="text-xs font-semibold text-slate-700">Orders</span>
            </Link>
            <Link to="/customers" className="bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center group transition-all">
              <Users className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              <span className="text-xs font-semibold text-slate-700">Customers</span>
            </Link>
            <Link to="/reports" className="bg-slate-50 hover:bg-orange-50 hover:border-orange-100 border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center text-center group transition-all">
              <FileText className="w-5 h-5 mb-1.5 text-slate-500 group-hover:text-orange-600 transition-colors" />
              <span className="text-xs font-semibold text-slate-700">Reports</span>
            </Link>
          </div>
        </motion.div>

        {/* CUSTOMERS (Col Span 4) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-4 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
           <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-500" /> Audience
            </h3>
            <Link to="/customers" className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-emerald-50 hover:text-emerald-500 transition-colors">
              <ArrowRight className="w-4 h-4 -rotate-45" />
            </Link>
          </div>
          
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex items-center mb-4">
             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-4">
               <UserCircle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-emerald-800 text-sm font-semibold">Total Customers</p>
               <h4 className="text-2xl font-bold text-emerald-900">{customers.length}</h4>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">New Today</p>
               <h4 className="text-xl font-bold text-slate-800">{newCustomersCount}</h4>
             </div>
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Returning</p>
               <h4 className="text-xl font-bold text-slate-800">{customers.length > 0 ? Math.max(0, customers.length - newCustomersCount) : 0}</h4>
             </div>
          </div>
        </motion.div>

        {/* RECENT ACTIVITY TIMELINE (Col Span 5) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-5 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" /> Recent Activity
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-xl">
                No recent activity today.
              </div>
            ) : (
              <div className="space-y-5">
                {recentTimeline.map((item, i) => {
                  const isBill = 'billNumber' in item || 'paymentStatus' in item;
                  
                  if (isBill) {
                    const bill = item as Bill;
                    return (
                      <div key={`bill-${bill.id}-${i}`} className="flex items-start group">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100 shadow-sm group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          {i !== recentTimeline.length - 1 && <div className="w-px h-full bg-slate-100 my-1 min-h-[1.5rem]"></div>}
                        </div>
                        <div className="flex-1 pt-1 pb-2">
                          <p className="text-sm text-slate-800 font-medium">
                            Bill <span className="font-bold">{bill.billNumber}</span> generated
                          </p>
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" /> {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="mx-2">•</span>
                            <span className="font-semibold text-slate-700">₹{bill.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const req = item as MedicineRequest;
                    return (
                      <div key={`req-${req.id}-${i}`} className="flex items-start group">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                            <Inbox className="w-4 h-4" />
                          </div>
                          {i !== recentTimeline.length - 1 && <div className="w-px h-full bg-slate-100 my-1 min-h-[1.5rem]"></div>}
                        </div>
                        <div className="flex-1 pt-1 pb-2">
                          <p className="text-sm text-slate-800 font-medium">
                            New request from <span className="font-bold">{req.customerName}</span>
                          </p>
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" /> {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <span className="mx-2">•</span>
                            <span className="text-indigo-600 font-medium">{req.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* STAFF ACTIVITY (Col Span 3) */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 lg:col-span-3 bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <UserCircle className="w-5 h-5 mr-2 text-violet-500" /> Staff
            </h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
               <ActivitySquare className="w-6 h-6" />
             </div>
             <p className="text-sm font-semibold text-slate-600 mb-1">No Recent Activity</p>
             <p className="text-xs text-slate-400">Staff audit events will appear here.</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
