import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Printer, FileText } from 'lucide-react';
import { Bill } from '../../types/billing';
import { printBill } from '../../utils/printUtils';
import { PharmacyService } from '../../services/pharmacyService';
import { getPharmacyId } from '../../config/development';

interface Props {
  bill: Bill;
  onClose: () => void;
}

export default function ReceiptAnimation({ bill, onClose }: Props) {
  const [stage, setStage] = useState<'printing' | 'ready'>('printing');
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL' | 'B2B_A4'>('A4');
  const [pharmacyName, setPharmacyName] = useState('DavaSetu Pharmacy');
  const [ownerName, setOwnerName] = useState('Admin');

  useEffect(() => {
    if (bill.billType === 'WHOLESALE') {
      setPrintFormat('B2B_A4');
    }
    // Load Pharmacy details
    PharmacyService.getPharmacyProfile(getPharmacyId())
      .then(profile => {
        let pName = profile?.name || 'DavaSetu Pharmacy';
        let oName = profile?.ownerName || 'Admin';
        
        const localData = localStorage.getItem('pharmacy_profile_data');
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed.name) pName = parsed.name;
            if (parsed.ownerName) oName = parsed.ownerName;
          } catch(e) {}
        }
        setPharmacyName(pName);
        setOwnerName(oName);
      })
      .catch(() => {});

    const timer = setTimeout(() => {
      setStage('ready');
    }, 2500); // 2.5s animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 min-h-[450px] rounded-2xl relative overflow-hidden">


       <div className="relative w-full h-80 flex flex-col items-center justify-center">
          {printFormat === 'THERMAL' ? (
            <>
              {/* Printer Top */}
              <div className="w-64 h-4 bg-slate-800 rounded-t-xl z-20"></div>
              
              {/* Receipt Wrapper */}
              <div className="w-56 h-[300px] overflow-hidden relative z-10 bg-transparent flex justify-center">
                 <div className="w-full bg-white shadow-lg border border-slate-200 p-4 absolute top-0" style={{ animation: 'printSlideDown 1.2s ease-out forwards' }}>
                    <div className="text-center mb-3">
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{pharmacyName}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">{bill.billNumber}</p>
                    </div>
                    
                    <div className="border-t border-dashed border-slate-300 py-2 mb-2">
                      <p className="text-xs font-medium text-slate-700 truncate">Cust: {bill.customerName}</p>
                    </div>

                    <div className="space-y-1 mb-2 max-h-24 overflow-hidden">
                      {bill.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] text-slate-600">
                          <span className="truncate pr-2">{item.medicineName} x{item.quantity}</span>
                          <span>₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center mt-2">
                      <span className="font-bold text-slate-800 text-sm">Total</span>
                      <span className="font-bold text-indigo-600 text-sm">₹{Number(bill.total).toFixed(2)}</span>
                    </div>
                 </div>
              </div>
              
              {/* Printer Bottom */}
              <div className="w-64 h-10 bg-slate-700 rounded-b-xl z-20 shadow-xl flex items-center justify-center">
                 <div className="w-48 h-1.5 bg-slate-900 rounded-full opacity-50"></div>
              </div>
            </>
          ) : (
            /* A4 Preview */
            <div className="w-64 h-[340px] bg-white shadow-xl border border-slate-200 rounded-sm p-4 flex flex-col relative overflow-hidden opacity-0" style={{ animation: 'printScaleUp 0.8s ease-out forwards' }}>
               
               {/* Header */}
               <div className="flex justify-between items-start mb-3 border-b border-slate-200 pb-2">
                 <div>
                   {bill.billType === 'ONLINE' ? (
                     <div className="flex items-center gap-1">
                       <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white text-[8px] font-bold">+</div>
                       <div>
                         <h4 className="font-bold text-emerald-900 text-[10px] m-0 leading-none">DavaSetu</h4>
                         <p className="text-[6px] text-emerald-600 m-0">Online Pharmacy</p>
                       </div>
                     </div>
                   ) : (
                     <div>
                       <h4 className="font-bold text-slate-800 text-[10px] m-0 leading-none">{pharmacyName}</h4>
                       <p className="text-[6px] text-slate-500 m-0 mt-0.5">Proprietor: {ownerName}</p>
                     </div>
                   )}
                 </div>
                 <div className="text-right">
                   <h5 className="font-bold text-slate-800 text-[8px] m-0 tracking-widest uppercase">Invoice</h5>
                   <p className="text-[6px] text-slate-500 m-0 mt-0.5">#{bill.billNumber}</p>
                   <p className="text-[6px] text-slate-500 m-0">{new Date(bill.createdAt).toLocaleDateString()}</p>
                 </div>
               </div>
               
               {/* Customer */}
               <div className="mb-3">
                 <p className="text-[6px] text-slate-400 uppercase tracking-wide m-0 mb-0.5">Billed To</p>
                 <p className="text-[8px] font-bold text-slate-800 m-0">{bill.customerName}</p>
                 {bill.customerPhone && <p className="text-[7px] text-slate-600 m-0">{bill.customerPhone}</p>}
               </div>
               
               {/* Table */}
               <div className="flex-1">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-y border-slate-200">
                       <th className="py-1 text-[6px] font-semibold text-slate-500 w-[10%]">Sr.</th>
                       <th className="py-1 text-[6px] font-semibold text-slate-500 w-[50%]">Item</th>
                       <th className="py-1 text-[6px] font-semibold text-slate-500 w-[15%] text-center">Qty</th>
                       <th className="py-1 text-[6px] font-semibold text-slate-500 w-[25%] text-right">Amt</th>
                     </tr>
                   </thead>
                   <tbody>
                     {bill.items?.slice(0, 5).map((item: any, idx: number) => (
                       <tr key={idx} className="border-b border-slate-100">
                         <td className="py-1 text-[6px] text-slate-500">{idx + 1}</td>
                         <td className="py-1 text-[7px] text-slate-800 font-medium truncate max-w-[80px]">{item.medicineName}</td>
                         <td className="py-1 text-[7px] text-slate-600 text-center">{item.quantity}</td>
                         <td className="py-1 text-[7px] text-slate-800 text-right">₹{item.lineTotal}</td>
                       </tr>
                     ))}
                     {bill.items && bill.items.length > 5 && (
                       <tr>
                         <td colSpan={4} className="py-1 text-[6px] text-slate-400 text-center italic">... and more items</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>

               {/* Totals */}
               <div className="mt-auto border-t border-slate-200 pt-2 flex flex-col items-end w-full">
                 <div className="w-1/2">
                   <div className="flex justify-between text-[7px] text-slate-600 mb-0.5">
                     <span>Subtotal:</span>
                     <span>₹{bill.subtotal}</span>
                   </div>
                   <div className="flex justify-between text-[7px] text-slate-600 mb-1 border-b border-slate-100 pb-1">
                     <span>Discount:</span>
                     <span className="text-red-500">-₹{bill.discount}</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-bold text-slate-900 mt-1">
                     <span>Total:</span>
                     <span className="text-indigo-600">₹{bill.total}</span>
                   </div>
                 </div>
               </div>
            </div>
          )}
       </div>

       {/* Status Text & Buttons */}
       <div className="mt-6 flex flex-col items-center min-h-[120px] w-full z-30">
          {stage === 'printing' ? (
             <div className="flex items-center text-indigo-600 animate-pulse mt-4">
                <Printer className="w-5 h-5 mr-2 animate-bounce" />
                <span className="font-medium">Generating Receipt...</span>
             </div>
          ) : (
                <div className="flex flex-col items-center w-full animate-fade-in" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                   <div className="flex items-center text-emerald-600 mb-4">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span className="font-medium">Bill Created Successfully</span>
                   </div>
                   
                   <div className="flex bg-slate-100 p-1 rounded-lg mb-4 w-full max-w-[320px]">
                     {bill.billType === 'WHOLESALE' ? (
                       <button
                         onClick={() => setPrintFormat('B2B_A4')}
                         className={`flex-1 flex items-center justify-center py-1.5 text-xs font-semibold rounded-md transition-all ${printFormat === 'B2B_A4' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         <FileText className="w-3.5 h-3.5 mr-1.5" /> B2B Tax Invoice
                       </button>
                     ) : (
                       <button
                         onClick={() => setPrintFormat('A4')}
                         className={`flex-1 flex items-center justify-center py-1.5 text-xs font-semibold rounded-md transition-all ${printFormat === 'A4' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                       >
                         <FileText className="w-3.5 h-3.5 mr-1.5" /> A4 Size
                       </button>
                     )}
                     <button
                       onClick={() => setPrintFormat('THERMAL')}
                       className={`flex-1 flex items-center justify-center py-1.5 text-xs font-semibold rounded-md transition-all ${printFormat === 'THERMAL' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       <Printer className="w-3.5 h-3.5 mr-1.5" /> Thermal
                     </button>
                   </div>

                   <div className="flex gap-3 justify-center w-full">
                      <button 
                        onClick={() => printBill(bill, printFormat, pharmacyName, ownerName)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                      >
                         <Printer className="w-4 h-4 mr-2" /> Print Bill
                      </button>
                      <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2 bg-slate-800 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-slate-900 transition-colors"
                      >
                         Done
                      </button>
                   </div>
                </div>
          )}
       </div>
       <style>{`
         @keyframes printSlideDown {
           from { transform: translateY(-100%); }
           to { transform: translateY(0); }
         }
         @keyframes printScaleUp {
           from { transform: scale(0.95); opacity: 0; }
           to { transform: scale(1); opacity: 1; }
         }
         @keyframes fadeIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
         }
       `}</style>
    </div>
  );
}
