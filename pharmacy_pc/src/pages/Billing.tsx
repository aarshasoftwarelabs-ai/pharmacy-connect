import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Clock, CheckCircle, Plus, Smartphone, Store, MessageCircle, Receipt, User, CalendarDays, IndianRupee, RefreshCw, Loader2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { BillingService } from '../services/billingService';
import { BillingQueueItem, Bill } from '../types/billing';
import { getPharmacyId } from '../config/development';
import BillCreationModal from '../components/billing/BillCreationModal';
import OfflineBillForm from '../components/billing/OfflineBillForm';

import { printBill } from '../utils/printUtils';
import { sendWhatsAppBill } from '../utils/whatsappUtils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Billing() {
  const [queue, setQueue] = useState<BillingQueueItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedQueueItem, setSelectedQueueItem] = useState<BillingQueueItem | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'APP_ORDERS' | 'POS'>('APP_ORDERS');

  const [pharmacyName, setPharmacyName] = useState('K.Y Pharmacy');
  const [whatsAppModalBill, setWhatsAppModalBill] = useState<Bill | null>(null);
  const [manualPhone, setManualPhone] = useState('');

  const fetchBillingData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const [queueData, billsData] = await Promise.all([
        BillingService.getBillingQueue(getPharmacyId()),
        BillingService.getPharmacyBills(getPharmacyId())
      ]);

      setQueue(queueData);
      setBills(billsData);
      setError(null);
    } catch (err: any) {
      if (!isBackground) setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      const localData = localStorage.getItem('pharmacy_profile_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.name) setPharmacyName(parsed.name);
      }
    } catch (e) {}

    fetchBillingData();

    const intervalId = setInterval(() => {
      fetchBillingData(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const handleCreateBillClick = (item: BillingQueueItem) => {
    setSelectedQueueItem(item);
    setIsBillModalOpen(true);
  };

  const handleBillCreated = () => {
    setIsBillModalOpen(false);
    setSelectedQueueItem(null);
    fetchBillingData(true); // Refresh quietly
  };

  const handlePrint = (bill: Bill, format: 'A4' | 'THERMAL' = 'THERMAL') => {
    printBill(bill, format, pharmacyName, 'Admin');
  };

  const handleWhatsAppBill = (bill: Bill) => {
    const rawDigits = (bill.customerPhone || '').replace(/\D/g, '');
    if (rawDigits.length >= 10) {
      sendWhatsAppBill(bill, bill.customerPhone, pharmacyName);
    } else {
      setManualPhone('');
      setWhatsAppModalBill(bill);
    }
  };

  const handleSendManualWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppModalBill) return;
    const clean = manualPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    sendWhatsAppBill(whatsAppModalBill, clean, pharmacyName);
    setWhatsAppModalBill(null);
  };

  return (
    <div className="w-full pb-12 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight flex items-center w-fit">
            Billing & Payments
            {refreshing && <RefreshCw className="w-4 h-4 ml-3 text-indigo-500 animate-spin" />}
          </h1>
          <p className="text-slate-500 font-medium flex items-center mt-1">
            Manage billing queue and view finalized bills.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchBillingData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl text-sm font-semibold text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="inline-flex bg-slate-100 p-1.5 rounded-2xl"
      >
        <button
          onClick={() => setActiveTab('APP_ORDERS')}
          className={`flex items-center px-6 py-2.5 font-bold text-sm rounded-xl transition-all ${
            activeTab === 'APP_ORDERS'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          App Orders (Online)
        </button>
        <button
          onClick={() => setActiveTab('POS')}
          className={`flex items-center px-6 py-2.5 font-bold text-sm rounded-xl transition-all ${
            activeTab === 'POS'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Store className="w-4 h-4 mr-2" />
          Direct Billing (POS)
        </button>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-[1.5rem] flex items-center shadow-sm">
          <AlertCircle className="w-5 h-5 mr-3" />
          <span className="font-medium text-sm">{error}</span>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading billing data...</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-12 gap-6"
        >
          
          {/* Left Column (Changes based on tab) */}
          <div className="xl:col-span-8 h-full">
            {activeTab === 'APP_ORDERS' ? (
              <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px] relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-indigo-500" />
                    Billing Queue
                  </h2>
                  <span className="bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                    {queue.length} Pending
                  </span>
                </div>
                
                <div className="flex-1 overflow-auto pr-2 custom-scrollbar relative z-10">
                  {queue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No confirmed requests in queue.</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                      {queue.map(item => (
                        <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={item.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex justify-between items-center group/card">
                          <div>
                            <div className="flex items-center mb-1">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                              <h3 className="font-bold text-slate-800">{item.customerName}</h3>
                            </div>
                            <div className="pl-11">
                              <p className="text-sm font-semibold text-slate-600 mb-1">
                                {item.medicineName ? (
                                  item.medicineName
                                ) : (
                                  <span className="flex items-center text-indigo-600"><FileText className="w-4 h-4 mr-1"/> Prescription Image</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Confirmed: {new Date(item.confirmedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleCreateBillClick(item)}
                            className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Create Bill
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="h-full">
                {/* OfflineBillForm will be styled internally if needed, but we wrap it to ensure variants apply */}
                <OfflineBillForm onSuccess={handleBillCreated} />
              </motion.div>
            )}
          </div>

          {/* Finalized Bills */}
          <motion.div variants={itemVariants} className="xl:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Receipt className="w-6 h-6 mr-3 text-emerald-500" />
                Recent Bills
              </h2>
              <span className="bg-emerald-100 text-emerald-700 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                {bills.length} Bills
              </span>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar relative z-10">
              {bills.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                    <Receipt className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No bills created yet.</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                  {bills.map(bill => (
                    <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={bill.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-extrabold text-slate-800 text-base">{bill.billNumber}</h3>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${bill.billType === 'ONLINE' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {bill.billType === 'ONLINE' ? 'App' : 'POS'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm font-semibold text-slate-600 mb-1">
                            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {bill.customerName}
                          </div>
                          <div className="flex items-center text-xs font-medium text-slate-400">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                            {new Date(bill.createdAt).toLocaleDateString()} at {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
                          <div className="text-lg font-bold text-slate-800 flex items-center justify-end">
                            <IndianRupee className="w-4 h-4 mr-0.5 text-slate-500" />
                            {Number(bill.total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-100/80 flex justify-between items-center">
                        <div className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                          {bill.items?.length || 0} {bill.items?.length === 1 ? 'Item' : 'Items'}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handlePrint(bill, 'THERMAL')}
                            className="p-2 text-slate-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm"
                            title="Print POS Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePrint(bill, 'A4')}
                            className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors shadow-sm"
                            title="Print A4 Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleWhatsAppBill(bill)}
                            className="p-2 text-slate-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors shadow-sm"
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {isBillModalOpen && selectedQueueItem && (
        <BillCreationModal 
          queueItem={selectedQueueItem} 
          onClose={() => setIsBillModalOpen(false)}
          onSuccess={handleBillCreated}
        />
      )}

      {/* WhatsApp Manual Phone Input Modal */}
      {whatsAppModalBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-slate-900/75 backdrop-blur-sm" 
              onClick={() => setWhatsAppModalBill(null)} 
            />
            
            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white rounded-2xl shadow-2xl border border-slate-100 z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Share via WhatsApp</h3>
                    <p className="text-xs text-slate-500 font-medium">{whatsAppModalBill.billNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setWhatsAppModalBill(null)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendManualWhatsApp} className="mt-4 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800">{whatsAppModalBill.customerName}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{whatsAppModalBill.items?.length || 0} items</p>
                  </div>
                  <div className="text-right font-bold text-sm text-slate-800">
                    ₹{Number(whatsAppModalBill.total).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      autoFocus
                      required
                      placeholder="9876543210"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-12 pr-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all tracking-wide"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the 10-digit mobile number to open chat and send the itemized digital invoice.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setWhatsAppModalBill(null)}
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
