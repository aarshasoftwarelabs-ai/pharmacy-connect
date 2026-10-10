import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  IndianRupee, FileText, Inbox, CheckCircle, Clock, 
  PlusCircle, Users, Activity, Bell, FileBox, 
  ActivitySquare, Pill, FileSignature, 
  ArrowRight, Package, Loader2, AlertCircle, RefreshCw, 
  User, TrendingUp, UserCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { MedicineRequestService } from '../services/medicineRequestService';
import { BillingService } from '../services/billingService';
import { CustomerService, CustomerProfile } from '../services/customerService';
import { getPharmacyId } from '../config/development';
import { MedicineRequest } from '../types/medicineRequest';
import { Bill } from '../types/billing';

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

  // Generate last 7 days chart data
  const chartData = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayBills = bills.filter(b => new Date(b.createdAt).toDateString() === dayStr);
    const daySales = dayBills.reduce((s, b) => s + Number(b.total), 0);
    return { 
      day: d.toLocaleDateString('en-US', { weekday: 'short' }), 
      sales: daySales 
    };
  });
  
  const maxSales = Math.max(100, ...chartData.map(d => d.sales));
  
  const generateAreaPath = () => {
    if (chartData.length === 0) return '';
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - (d.sales / maxSales) * 80;
      return `${x},${y}`;
    });
    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  };

  const generateLinePath = () => {
    if (chartData.length === 0) return '';
    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - (d.sales / maxSales) * 80;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 space-y-6 px-4 xl:px-8 pt-4">
      
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
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100/50 text-emerald-600 rounded-2xl">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Today</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Today's Sales</p>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">₹<AnimatedNumber value={todaysSalesValue} /></h2>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100/50 text-blue-600 rounded-2xl">
              <FileSignature className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Today</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Today's Bills</p>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={todaysBills.length} /></h2>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-100/50 text-amber-600 rounded-2xl">
              <ActivitySquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Action</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Pending Requests</p>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={pendingRequestsCount} /></h2>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-100/50 text-indigo-600 rounded-2xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Ready</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Confirmed to Bill</p>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight"><AnimatedNumber value={confirmedRequestsCount} /></h2>
        </motion.div>


        {/* ROW 2: SALES OVERVIEW (8) & MEDICINE REQUEST STATUS (4) */}
        
        {/* 4. SALES OVERVIEW */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-8 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col group hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> 
                Sales Overview
              </h3>
              <p className="text-sm text-slate-500 mt-1">Past 7 days performance</p>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-600">
              Last 7 Days
            </div>
          </div>
          
          <div className="flex-1 relative mt-4 h-48 md:h-56">
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="w-full h-px bg-slate-100"></div>
             </div>
             
             <div className="absolute inset-0 pb-6 w-full h-full">
               <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                 <defs>
                   <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                     <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 
                 <motion.path 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 1 }}
                   d={generateAreaPath()} 
                   fill="url(#areaGradient)" 
                   vectorEffect="non-scaling-stroke"
                 />
                 
                 <motion.path 
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   d={generateLinePath()} 
                   fill="none" 
                   stroke="#10b981" 
                   strokeWidth="2" 
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   vectorEffect="non-scaling-stroke"
                 />
                 
                 {chartData.map((d, i) => {
                   const x = (i / (chartData.length - 1)) * 100;
                   const y = 100 - (d.sales / maxSales) * 80;
                   return (
                     <motion.circle 
                       key={i}
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: 1 + i * 0.1 }}
                       cx={x} cy={y} r="1.5" 
                       fill="#fff" stroke="#10b981" strokeWidth="1" 
                       vectorEffect="non-scaling-stroke"
                       className="hover:r-3 cursor-pointer transition-all"
                     />
                   );
                 })}
               </svg>
             </div>
             
             <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
               {chartData.map((d, i) => (
                 <span key={i} className="text-[10px] font-semibold text-slate-400">{d.day}</span>
               ))}
             </div>
          </div>
        </motion.div>

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
