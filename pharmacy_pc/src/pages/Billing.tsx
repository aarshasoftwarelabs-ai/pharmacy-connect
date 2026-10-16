import React, { useState, useEffect, useRef } from 'react';
import { FileText, Printer, Clock, Store, MessageCircle, Receipt, User, CalendarDays, IndianRupee, RefreshCw, Loader2, AlertCircle, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { BillingService } from '../services/billingService';
import { Bill } from '../types/billing';
import { getPharmacyId } from '../config/development';
import OfflineBillForm from '../components/billing/OfflineBillForm';
import { printBill } from '../utils/printUtils';
import { sendWhatsAppBill } from '../utils/whatsappUtils';
import { AudioAlert } from '../utils/audioAlertService';

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
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBillAlert, setNewBillAlert] = useState<string | null>(null);

  const [pharmacyName, setPharmacyName] = useState('K.Y Pharmacy');
  const [whatsAppModalBill, setWhatsAppModalBill] = useState<Bill | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const previousBillIdsRef = useRef<Set<number>>(new Set());

  const fetchBillingData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const billsData = await BillingService.getPharmacyBills(getPharmacyId());
      
      if (Array.isArray(billsData)) {
        // Detect newly arrived bills (e.g. from Mobile app)
        if (previousBillIdsRef.current.size > 0) {
          const newlyAdded = billsData.filter(b => !previousBillIdsRef.current.has(b.id));
          if (newlyAdded.length > 0) {
            AudioAlert.playBarcodeBeep();
            setNewBillAlert(`✓ New Bill (${newlyAdded[0].billNumber} - ₹${newlyAdded[0].total}) received from Mobile POS!`);
            setTimeout(() => setNewBillAlert(null), 5000);
          }
        }
        previousBillIdsRef.current = new Set(billsData.map(b => b.id));
        setBills(billsData);
      }
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

    // Live 3.5s auto-refresh so mobile bills show up one by one in real-time
    const intervalId = setInterval(() => {
      fetchBillingData(true);
    }, 3500);

    const handleFocus = () => fetchBillingData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleBillCreated = () => {
    fetchBillingData(true);
  };

  const handlePrint = (bill: Bill, format: 'THERMAL' | 'A4') => {
    try {
      printBill(bill, format, pharmacyName);
    } catch (e: any) {
      console.error(e);
      alert('Printing error: ' + (e.message || 'Unable to print bill'));
    }
  };

  const handleWhatsAppBill = (bill: Bill) => {
    if (bill.customerPhone && bill.customerPhone.trim().length >= 10) {
      sendWhatsAppBill(bill, pharmacyName);
    } else {
      setManualPhone('');
      setWhatsAppModalBill(bill);
    }
  };

  const handleSendManualWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsAppModalBill) return;
    if (!manualPhone || manualPhone.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    const cleanPhone = manualPhone.trim().replace(/\D/g, '');
    sendWhatsAppBill(whatsAppModalBill, pharmacyName, cleanPhone);
    setWhatsAppModalBill(null);
    setManualPhone('');
  };

  return (
    <div className="w-full pb-12 space-y-6">
      
      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600 tracking-tight w-fit">
            Billing & POS Counter
          </h1>
          <p className="text-slate-500 font-medium flex items-center mt-1">
            Create in-store POS invoices, print thermal receipts, and manage billing history.
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
          
          {/* Left Column: Direct POS Billing Form */}
          <div className="xl:col-span-8 h-full">
            <motion.div variants={itemVariants} className="h-full">
              <OfflineBillForm onSuccess={handleBillCreated} />
            </motion.div>
          </div>

          {/* Right Column: Recent Finalized Bills */}
          <motion.div variants={itemVariants} className="xl:col-span-4 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px] relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <Receipt className="w-6 h-6 mr-3 text-emerald-500" />
                  Recent Bills
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live Mobile Sync Active</span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-700 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                {bills.length} Bills
              </span>
            </div>

            {newBillAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-4 p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-xs flex items-center shadow-lg border border-emerald-400"
              >
                <Smartphone className="w-4 h-4 mr-2 shrink-0 animate-bounce" />
                <span className="flex-1">{newBillAlert}</span>
                <CheckCircle2 className="w-4 h-4 ml-1 text-emerald-200" />
              </motion.div>
            )}
            
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
                  {bills.map(bill => {
                    const isRecent = (Date.now() - new Date(bill.createdAt).getTime()) < 180000;
                    return (
                      <motion.div variants={itemVariants} whileHover={{ y: -2 }} key={bill.id} className={`bg-slate-50/50 border ${isRecent ? 'border-emerald-400 bg-emerald-50/40 shadow-sm' : 'border-slate-100'} rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md transition-all flex flex-col gap-4`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-extrabold text-slate-800 text-base">{bill.billNumber}</h3>
                              {isRecent ? (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-3 h-3" /> Just Synced
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700">
                                  POS
                                </span>
                              )}
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
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* WhatsApp Manual Number Modal */}
      {whatsAppModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 max-w-sm w-full relative">
            <button 
              onClick={() => setWhatsAppModalBill(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Send WhatsApp Bill</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter customer's 10-digit WhatsApp phone number for invoice <b>{whatsAppModalBill.billNumber}</b>:
            </p>
            <form onSubmit={handleSendManualWhatsApp}>
              <input 
                type="tel" 
                autoFocus
                placeholder="e.g. 9876543210" 
                value={manualPhone} 
                onChange={(e) => setManualPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-4"
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setWhatsAppModalBill(null)} 
                  className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-200"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
