import React, { useState } from 'react';
import { X, Image as ImageIcon, CheckCircle, Clock, XCircle, Package, Loader2, MessageCircle, Send, User, Calendar, Phone, Sparkles, AlertTriangle } from 'lucide-react';
import { MedicineRequest, MedicineRequestStatus } from '../../types/medicineRequest';
import { Medicine } from '../../types/medicine';
import { fetchMedicines } from '../../services/medicineService';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicineRequestDetailsProps {
  request: MedicineRequest;
  onClose: () => void;
  onUpdateStatus: (id: string, status: MedicineRequestStatus, message?: string, estimatedPrice?: number, estimatedDeliveryTime?: string) => Promise<void>;
}

export default function MedicineRequestDetails({ request, onClose, onUpdateStatus }: MedicineRequestDetailsProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [activeAction, setActiveAction] = useState<MedicineRequestStatus | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>('');

  const [inventoryStatus, setInventoryStatus] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading');
  const [matchedMedicine, setMatchedMedicine] = useState<Medicine | null>(null);

  React.useEffect(() => {
    if (!request.medicineName) {
      setInventoryStatus('not_found');
      return;
    }
    
    let isMounted = true;
    const checkInventory = async () => {
      try {
        setInventoryStatus('loading');
        const meds = await fetchMedicines();
        if (!isMounted) return;
        
        const reqName = request.medicineName!.toLowerCase().trim();
        const cleanReqName = reqName.replace(/[^a-z0-9]/g, '');
        
        // Smart match: check if reqName is in medicine name, or medicine name in reqName
        const match = meds.find(m => {
          if (!m || (!m.name && !m.genericName)) return false;
          const cleanName = m.name ? m.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          const cleanGeneric = m.genericName ? m.genericName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          
          return (cleanName && cleanName.includes(cleanReqName)) || 
                 (cleanName && cleanReqName.includes(cleanName)) ||
                 (cleanGeneric && cleanGeneric.includes(cleanReqName)) ||
                 (cleanGeneric && cleanReqName.includes(cleanGeneric));
        });
        
        if (match) {
          setMatchedMedicine(match);
          setInventoryStatus('found');
        } else {
          setInventoryStatus('not_found');
        }
      } catch (err) {
        if (isMounted) setInventoryStatus('error');
      }
    };
    
    checkInventory();
    return () => { isMounted = false; };
  }, [request.medicineName]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleStatusUpdate = async (status: MedicineRequestStatus, message?: string, price?: number, time?: string) => {
    try {
      setIsUpdating(true);
      await onUpdateStatus(request.id, status, message, price, time);
      setActiveAction(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAction = () => {
    if (!activeAction) return;
    handleStatusUpdate(
      activeAction, 
      actionMessage, 
      estimatedPrice ? Number(estimatedPrice) : undefined, 
      estimatedDeliveryTime
    );
  };

  const handleActionClick = (status: MedicineRequestStatus) => {
    if (activeAction === status) {
      setActiveAction(null); // toggle off
    } else {
      setActiveAction(status);
      if (status === 'AVAILABLE') {
        setActionMessage('Medicine is available at this pharmacy.');
      } else if (status === 'CAN_ARRANGE') {
        setActionMessage('Pharmacy can arrange this medicine.');
      } else {
        setActionMessage('Medicine is currently not available.');
      }
    }
  };

  const handleWhatsAppNotify = () => {
    let phone = request.customerPhone?.replace(/\D/g, '') || '';
    if (phone.length === 10) phone = `91${phone}`;
    if (!phone || phone === '91') {
      alert("No valid phone number available for this customer.");
      return;
    }
    
    const medName = request.medicineName ? `"${request.medicineName}"` : "the prescription";
    let text = `Hello ${request.customerName},\n\nYour medicine request for ${medName} at DavaSetu Pharmacy `;
    
    if (request.status === 'AVAILABLE') {
      text += `is now *AVAILABLE*.\n\nPlease visit the pharmacy to collect it.`;
    } else if (request.status === 'CAN_ARRANGE') {
      text += `*CAN BE ARRANGED*.\n\n${request.responseMessage ? `Note: ${request.responseMessage}\n\n` : ''}Please reply to confirm if you want us to order it.`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusColor = (status: MedicineRequestStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CAN_ARRANGE': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'NOT_AVAILABLE': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getStatusIcon = (status: MedicineRequestStatus) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="h-5 w-5 mr-2" />;
      case 'CAN_ARRANGE': return <Package className="h-5 w-5 mr-2" />;
      case 'NOT_AVAILABLE': return <XCircle className="h-5 w-5 mr-2" />;
      default: return <Clock className="h-5 w-5 mr-2" />;
    }
  };

  const getStatusLabel = (status: MedicineRequestStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'CAN_ARRANGE': return 'Can Arrange';
      case 'NOT_AVAILABLE': return 'Not Available';
      default: return 'Waiting for Response';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-4xl bg-white rounded-[2rem] text-left overflow-hidden shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md flex-shrink-0">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight" id="modal-title">
              Request Details
            </h3>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative px-6 py-6 flex flex-col lg:flex-row gap-8 bg-white overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Left: Customer & Request Info */}
            <div className="flex-1 space-y-8">
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" /> Customer Info
                </h4>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4 shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium mb-0.5">Name</span>
                      <span className="block text-sm font-bold text-slate-800">{request.customerName}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-4 shadow-sm">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium mb-0.5">Phone</span>
                      <span className="block text-sm font-bold text-slate-800">{request.customerPhone}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                  <Package className="h-4 w-4 mr-2" /> Request Details
                </h4>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                  
                  <div className="relative z-10">
                    <span className="block text-xs text-slate-500 font-medium mb-1.5">Requested Medicine</span>
                    <span className="block text-lg font-bold text-slate-800">
                      {request.medicineName || <span className="italic font-normal text-slate-400">Not provided by customer</span>}
                    </span>
                  </div>
                  
                  <div className="relative z-10 flex items-center pt-1">
                    <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-sm font-medium text-slate-600">{formatDate(request.requestedAt)}</span>
                  </div>
                  
                  <div className="relative z-10 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.requestType && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200">
                          {request.requestType.replace('_', ' ')}
                        </span>
                      )}
                      {request.isDeliveryRequired !== undefined && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${request.isDeliveryRequired ? 'bg-amber-50 text-amber-600 border-amber-200 opacity-70' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {request.isDeliveryRequired ? 'Home Delivery (Coming Soon)' : 'Self Pickup'}
                        </span>
                      )}
                      {request.allowGenericSubstitute && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
                          Substitute Allowed
                        </span>
                      )}
                    </div>
                    
                    {request.quantity && (
                      <div className="mb-3">
                        <span className="block text-xs text-slate-500 font-medium mb-1">Quantity Requested</span>
                        <span className="block text-sm font-bold text-slate-800">{request.quantity}</span>
                      </div>
                    )}
                    
                    {request.isDeliveryRequired && (
                      <div className="mb-4">
                        <span className="block text-xs text-slate-500 font-medium mb-1.5">Delivery Address</span>
                        <div className="flex items-center">
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <span className="block text-xs text-slate-500 font-medium mb-3 mt-4 border-t border-slate-100 pt-4">Image Attachment</span>
                    {request.imageAttached ? (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-32 w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer relative group flex items-center justify-center"
                        onClick={() => setShowImagePreview(true)}
                      >
                        {request.imageUrl ? (
                          <img src={request.imageUrl} alt="Prescription" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">Click to view image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" /> View Image
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-16 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-sm text-slate-400 italic">No image provided</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Left Column ends here */}
            </div>

            {/* Right: Pharmacy Response Actions */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Smart Inventory Check - Moved to TOP Right for visibility without scrolling */}
              <section>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-indigo-500" /> Smart Inventory Match
                </h4>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                  {inventoryStatus === 'loading' && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mr-3" />
                      <span className="text-sm font-medium text-slate-600">Scanning inventory...</span>
                    </div>
                  )}
                  
                  {inventoryStatus === 'error' && (
                    <div className="flex items-center p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Failed to check inventory.</span>
                    </div>
                  )}
                  
                  {inventoryStatus === 'not_found' && (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-2">
                        <XCircle className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Not found in inventory</span>
                      <span className="text-xs text-slate-500 text-center mt-1">This medicine isn't in your smart inventory list.</span>
                    </div>
                  )}
                  
                  {inventoryStatus === 'found' && matchedMedicine && (
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Match Found</span>
                          <span className="block text-base font-bold text-slate-800">{matchedMedicine.name}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{matchedMedicine.category} • {matchedMedicine.strength}</span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md border text-xs font-bold ${matchedMedicine.currentStock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {matchedMedicine.currentStock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200/60">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Current Stock</span>
                          <span className={`text-lg font-black ${matchedMedicine.currentStock > 0 ? 'text-slate-800' : 'text-red-600'}`}>
                            {matchedMedicine.currentStock} <span className="text-xs font-medium text-slate-500">units</span>
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Selling Price</span>
                          <span className="text-lg font-black text-slate-800">
                            ₹{matchedMedicine.sellingPrice} <span className="text-xs font-medium text-slate-500">(MRP ₹{matchedMedicine.mrp})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="flex-1 flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" /> Response & Actions
              </h4>
              
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden relative">
                
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                    <span className="text-sm font-bold text-indigo-900">Updating Request...</span>
                  </div>
                )}

                {/* Current Status Banner */}
                <div className={`p-5 border-b flex flex-col ${getStatusColor(request.status)}`}>
                  <span className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Current Status</span>
                  <div className="flex items-center">
                    {getStatusIcon(request.status)}
                    <span className="text-base font-bold uppercase">{getStatusLabel(request.status)}</span>
                  </div>
                  {request.responseMessage && (
                    <div className="mt-3 bg-white/60 p-3 rounded-lg border border-current/10 text-sm font-medium">
                      {request.responseMessage}
                    </div>
                  )}
                  
                  {(request.status === 'AVAILABLE' || request.status === 'CAN_ARRANGE') && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWhatsAppNotify}
                      className="mt-4 w-full flex items-center justify-center px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Notify via WhatsApp
                    </motion.button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-5 flex-1 flex flex-col gap-3 justify-center bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Update Status</p>
                  
                  <div className="relative">
                    <button
                      onClick={() => handleActionClick('AVAILABLE')}
                      className={`relative w-full flex items-center px-4 py-3 border-2 rounded-xl text-sm font-bold transition-all ${
                        activeAction === 'AVAILABLE' || request.status === 'AVAILABLE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle className={`h-5 w-5 mr-3 ${(activeAction === 'AVAILABLE' || request.status === 'AVAILABLE') ? 'text-emerald-500' : 'text-slate-400'}`} />
                      Available Now
                    </button>
                    
                    <AnimatePresence>
                      {activeAction === 'AVAILABLE' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-emerald-50/50 border-x-2 border-b-2 border-emerald-500 rounded-b-xl -mt-2 pt-4">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Total Price (₹)</label>
                                <input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} className="w-full p-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" placeholder="e.g. 150" />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Delivery Time</label>
                                <input type="text" value={estimatedDeliveryTime} onChange={e => setEstimatedDeliveryTime(e.target.value)} className="w-full p-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white" placeholder="e.g. 30-45 mins" />
                              </div>
                            </div>
                            <textarea
                              value={actionMessage}
                              onChange={(e) => setActionMessage(e.target.value)}
                              className="w-full p-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none bg-white"
                              rows={2}
                              placeholder="Add an optional message..."
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setActiveAction(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={confirmAction} className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm flex items-center">
                                Confirm <Send className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => handleActionClick('CAN_ARRANGE')}
                      className={`relative w-full flex items-center px-4 py-3 border-2 rounded-xl text-sm font-bold transition-all ${
                        activeAction === 'CAN_ARRANGE' || request.status === 'CAN_ARRANGE'
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Package className={`h-5 w-5 mr-3 ${(activeAction === 'CAN_ARRANGE' || request.status === 'CAN_ARRANGE') ? 'text-blue-500' : 'text-slate-400'}`} />
                      Can Arrange
                    </button>
                    
                    <AnimatePresence>
                      {activeAction === 'CAN_ARRANGE' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-blue-50/50 border-x-2 border-b-2 border-blue-500 rounded-b-xl -mt-2 pt-4">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Total Price (₹)</label>
                                <input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" placeholder="e.g. 150" />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Delivery Time</label>
                                <input type="text" value={estimatedDeliveryTime} onChange={e => setEstimatedDeliveryTime(e.target.value)} className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" placeholder="e.g. Tomorrow 10 AM" />
                              </div>
                            </div>
                            <textarea
                              value={actionMessage}
                              onChange={(e) => setActionMessage(e.target.value)}
                              className="w-full p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none bg-white"
                              rows={2}
                              placeholder="Add an optional message..."
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setActiveAction(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={confirmAction} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm flex items-center">
                                Confirm <Send className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => handleActionClick('NOT_AVAILABLE')}
                      className={`relative w-full flex items-center px-4 py-3 border-2 rounded-xl text-sm font-bold transition-all ${
                        activeAction === 'NOT_AVAILABLE' || request.status === 'NOT_AVAILABLE'
                          ? 'border-rose-500 bg-rose-50 text-rose-700' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      <XCircle className={`h-5 w-5 mr-3 ${(activeAction === 'NOT_AVAILABLE' || request.status === 'NOT_AVAILABLE') ? 'text-rose-500' : 'text-slate-400'}`} />
                      Not Available
                    </button>

                    <AnimatePresence>
                      {activeAction === 'NOT_AVAILABLE' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-rose-50/50 border-x-2 border-b-2 border-rose-500 rounded-b-xl -mt-2 pt-4">
                            <textarea
                              value={actionMessage}
                              onChange={(e) => setActionMessage(e.target.value)}
                              className="w-full p-2 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none bg-white"
                              rows={2}
                              placeholder="Add an optional message..."
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setActiveAction(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={confirmAction} className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm flex items-center">
                                Confirm <Send className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="relative max-w-5xl w-full flex flex-col items-center"
            >
              <button 
                onClick={() => setShowImagePreview(false)}
                className="absolute -top-14 right-0 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="w-full aspect-video md:aspect-[4/3] rounded-2xl border border-white/10 flex flex-col items-center justify-center text-white overflow-hidden p-2 shadow-2xl bg-black/50">
                {request.imageUrl ? (
                  <img src={request.imageUrl} alt="Prescription Full Size" className="max-w-full max-h-full object-contain rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="h-16 w-16 text-slate-500 mb-4" />
                    <p className="text-lg font-medium text-slate-300">Image Preview</p>
                    <p className="text-sm text-slate-500 mt-2">No valid image URL provided by the backend.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
