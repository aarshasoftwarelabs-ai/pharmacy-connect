import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, IndianRupee, ShoppingBag, 
  Users, Stethoscope, FileText, Activity 
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { getPharmacyId } from '../config/development';
import { ReportService, ReportDateRange } from '../services/reportService';
import SalesTab from '../components/reports/SalesTab';
import BillingTab from '../components/reports/BillingTab';
import MedicineSalesTab from '../components/reports/MedicineSalesTab';
import MedicineRequestsTab from '../components/reports/MedicineRequestsTab';
import CustomersTab from '../components/reports/CustomersTab';
import GstReportTab from '../components/reports/GstReportTab';

export type ReportTab = 'sales' | 'billing' | 'medicine-sales' | 'medicine-requests' | 'customers' | 'gst';

export const getDateRange = (rangeType: string): ReportDateRange => {
  const now = new Date();
  
  // Format YYYY-MM-DD
  const format = (d: Date) => {
    const tzOffset = 5.5 * 60 * 60 * 1000; // IST
    const istDate = new Date(d.getTime() + tzOffset);
    return istDate.toISOString().split('T')[0];
  };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  switch (rangeType) {
    case 'today':
      return { from: format(today), to: format(today) };
    case 'yesterday':
      return { from: format(yesterday), to: format(yesterday) };
    case 'this-week':
      return { from: format(thisWeekStart), to: format(today) };
    case 'this-month':
      return { from: format(thisMonthStart), to: format(today) };
    case 'custom':
    default:
      return {};
  }
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRangeType, setDateRangeType] = useState('this-month');
  const [customRange, setCustomRange] = useState<ReportDateRange>({ from: '', to: '' });
  
  const [summary, setSummary] = useState({
    sales: 0,
    bills: 0,
    customers: 0,
    requests: 0
  });

  const currentRange = dateRangeType === 'custom' ? customRange : getDateRange(dateRangeType);

  useEffect(() => {
    // Fetch summary data across different services for the cards
    const fetchSummary = async () => {
      try {
        const [salesData, custData, reqData] = await Promise.all([
          ReportService.getSalesReport(getPharmacyId(), currentRange).catch(() => null),
          ReportService.getCustomerReport(getPharmacyId(), currentRange).catch(() => null),
          ReportService.getMedicineRequestReport(getPharmacyId(), currentRange).catch(() => null)
        ]);

        setSummary({
          sales: salesData ? salesData.netSales : 0,
          bills: salesData ? salesData.totalBills : 0,
          customers: custData ? custData.summary.newCustomers + custData.summary.returningCustomers : 0,
          requests: reqData ? reqData.totalRequests : 0
        });
      } catch (e) {
        console.error('Failed to load summary', e);
      }
    };
    fetchSummary();
  }, [dateRangeType, customRange.from, customRange.to]);

  const tabs = [
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'medicine-sales', label: 'Medicine Sales', icon: ShoppingBag },
    { id: 'medicine-requests', label: 'Medicine Requests', icon: Stethoscope },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'gst', label: 'GST Report', icon: FileText },
  ] as const;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
            Reports Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">View real-time metrics and detailed reports.</p>
        </motion.div>
        
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-slate-200/60 shadow-sm"
        >
          <Calendar className="w-5 h-5 text-indigo-500 ml-2" />
          <select 
            value={dateRangeType}
            onChange={(e) => setDateRangeType(e.target.value)}
            className="border-0 bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRangeType === 'custom' && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              className="flex items-center space-x-2 pl-3 border-l border-slate-200 overflow-hidden"
            >
              <input 
                type="date" 
                value={customRange.from || ''}
                onChange={e => setCustomRange(p => ({ ...p, from: e.target.value }))}
                className="text-sm border-slate-200 rounded-xl py-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input 
                type="date" 
                value={customRange.to || ''}
                onChange={e => setCustomRange(p => ({ ...p, to: e.target.value }))}
                className="text-sm border-slate-200 rounded-xl py-1.5 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Net Sales</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">₹{summary.sales.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Bills</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{summary.bills}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Active Customers</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{summary.customers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide">Medicine Requests</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{summary.requests}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/60 overflow-hidden"
      >
        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
          <div className="flex space-x-2 overflow-x-auto custom-scrollbar p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ReportTab)}
                  className={`relative flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap z-10 ${
                    isActive
                      ? 'text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="active-tab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10 border border-slate-200/50"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 mr-2 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'sales' && <SalesTab dateRange={currentRange} />}
              {activeTab === 'billing' && <BillingTab dateRange={currentRange} />}
              {activeTab === 'medicine-sales' && <MedicineSalesTab dateRange={currentRange} />}
              {activeTab === 'medicine-requests' && <MedicineRequestsTab dateRange={currentRange} />}
              {activeTab === 'customers' && <CustomersTab dateRange={currentRange} />}
              {activeTab === 'gst' && <GstReportTab dateRange={currentRange} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
