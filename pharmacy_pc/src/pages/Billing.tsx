import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Clock, CheckCircle, Plus, Smartphone, Store, MessageCircle, Receipt, User, CalendarDays, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { BillingService } from '../services/billingService';
import { BillingQueueItem, Bill } from '../types/billing';
import { DEV_PHARMACY_ID } from '../config/development';
import BillCreationModal from '../components/billing/BillCreationModal';
import OfflineBillForm from '../components/billing/OfflineBillForm';

import { printBill } from '../utils/printUtils';

export default function Billing() {
  const [queue, setQueue] = useState<BillingQueueItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedQueueItem, setSelectedQueueItem] = useState<BillingQueueItem | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'APP_ORDERS' | 'POS'>('APP_ORDERS');

  const fetchBillingData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const [queueData, billsData] = await Promise.all([
        BillingService.getBillingQueue(DEV_PHARMACY_ID),
        BillingService.getPharmacyBills(DEV_PHARMACY_ID)
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
    fetchBillingData(); // Refresh to move it from queue to bills
  };

  const handlePrint = (bill: Bill, format: 'A4' | 'THERMAL' = 'THERMAL') => {
    printBill(bill, format, 'DavaSetu Pharmacy', 'Admin');
  };

  const handleWhatsAppBill = (bill: Bill) => {
    let phone = bill.customerPhone?.replace(/\D/g, '') || '';
    if (phone.length === 10) phone = `91${phone}`;
    if (!phone || phone === '91') {
      alert("No valid phone number available for this customer.");
      return;
    }
    
    const text = `Hello ${bill.customerName},\n\nHere is your bill from DavaSetu Pharmacy.\nBill No: ${bill.billNumber}\nAmount: ₹${bill.total}\n\nThank you for choosing us!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            Billing & Payments
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Manage billing queue and view finalized bills.</p>
        </motion.div>
        
        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => fetchBillingData()}
          disabled={loading || refreshing}
          className="px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 transition-all"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </motion.button>
      </div>

      {/* Tabs */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex border-b border-slate-200"
      >
        <button
          onClick={() => setActiveTab('APP_ORDERS')}
          className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'APP_ORDERS'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          App Orders (Online)
        </button>
        <button
          onClick={() => setActiveTab('POS')}
          className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'POS'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Store className="w-4 h-4 mr-2" />
          Direct Billing (POS)
        </button>
      </motion.div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading billing data...</div>
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
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                    Billing Queue
                  </h2>
              <span className="bg-indigo-100 text-indigo-700 py-1 px-2 rounded-full text-xs font-medium">
                {queue.length} Pending
              </span>
            </div>
            <div className="p-4 flex-1 overflow-auto max-h-[600px]">
              {queue.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No confirmed requests in queue.
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {queue.map(item => (
                    <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={item.id} className="bg-white border border-slate-200/60 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-slate-900">{item.customerName}</h3>
                          <p className="text-sm text-slate-500">{item.medicineName || 'Prescription Image'}</p>
                          <p className="text-xs text-slate-400 mt-1">Confirmed: {new Date(item.confirmedAt).toLocaleTimeString()}</p>
                        </div>
                        <button 
                          onClick={() => handleCreateBillClick(item)}
                          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create Bill
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
            ) : (
              <OfflineBillForm onSuccess={handleBillCreated} />
            )}
          </div>

          {/* Finalized Bills */}
          <motion.div variants={itemVariants} className="xl:col-span-4 bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white/50 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Recent Bills
              </h2>
              <span className="bg-slate-100 text-slate-700 py-1 px-2 rounded-full text-xs font-medium">
                {bills.length} Bills
              </span>
            </div>
            <div className="p-4 flex-1 overflow-auto max-h-[600px]">
              {bills.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No bills created yet.
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {bills.map(bill => (
                    <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={bill.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 text-base">{bill.billNumber}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${bill.billType === 'ONLINE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {bill.billType === 'ONLINE' ? 'App Order' : 'POS'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-slate-500 mb-0.5">
                            <User className="w-3.5 h-3.5 mr-1.5" />
                            {bill.customerName}
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                            {new Date(bill.createdAt).toLocaleDateString()} at {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500 mb-1">Total Amount</div>
                          <div className="text-lg font-bold text-slate-800 flex items-center justify-end">
                            <IndianRupee className="w-4 h-4 mr-0.5 text-slate-500" />
                            {Number(bill.total).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-xs font-medium text-slate-500">
                          {bill.items?.length || 0} {bill.items?.length === 1 ? 'Item' : 'Items'}
                        </div>
                        <div className="flex gap-2">
                        <button 
                          onClick={() => handlePrint(bill, 'THERMAL')}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Print POS Receipt"
                        >
                          <Receipt className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handlePrint(bill, 'A4')}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Print A4 Invoice"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleWhatsAppBill(bill)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Send via WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
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
    </motion.div>
  );
}
