import React, { useState } from 'react';
import { RefreshCcw, AlertTriangle, Search, CheckCircle2, XCircle, ArrowRightLeft, Clock } from 'lucide-react';

interface ReturnRequest {
  id: string;
  retailerName: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  returnReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  dateRequested: string;
}

export default function ExpiryReturns() {
  const [returns, setReturns] = useState<ReturnRequest[]>([
    {
      id: 'RET-201',
      retailerName: 'Apollo Pharmacy',
      medicineName: 'Amoxicillin 500mg',
      batchNumber: 'BCH-88392',
      expiryDate: '2026-11-01',
      quantity: 50,
      returnReason: 'Nearing Expiry (30 days)',
      status: 'PENDING',
      dateRequested: '2026-10-04'
    },
    {
      id: 'RET-202',
      retailerName: 'City Hospital',
      medicineName: 'Paracetamol 650mg',
      batchNumber: 'BCH-11029',
      expiryDate: '2026-09-15',
      quantity: 120,
      returnReason: 'Expired',
      status: 'APPROVED',
      dateRequested: '2026-10-02'
    },
    {
      id: 'RET-203',
      retailerName: 'Relief Medico',
      medicineName: 'Azithromycin 250mg',
      batchNumber: 'BCH-55912',
      expiryDate: '2027-05-20',
      quantity: 10,
      returnReason: 'Damaged in transit',
      status: 'REFUNDED',
      dateRequested: '2026-09-28'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT' | 'REFUND') => {
    setReturns(returns.map(r => {
      if (r.id === id) {
        if (action === 'APPROVE') return { ...r, status: 'APPROVED' };
        if (action === 'REJECT') return { ...r, status: 'REJECTED' };
        if (action === 'REFUND') return { ...r, status: 'REFUNDED' };
      }
      return r;
    }));
  };

  const filteredReturns = returns.filter(r => 
    r.retailerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <RefreshCcw className="w-5 h-5 mr-2 text-rose-500" />
            B2B Expiry Return Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage medicine returns, nearing-expiry claims, and refunds from retailers.</p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Retailer, Medicine, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
        {filteredReturns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <p>No return requests found.</p>
          </div>
        ) : (
          filteredReturns.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{r.id}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {r.status}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {r.dateRequested}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mt-2">{r.retailerName}</h3>
                </div>
                
                <div className="flex gap-2">
                  {r.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleAction(r.id, 'APPROVE')} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded-lg flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Return
                      </button>
                      <button onClick={() => handleAction(r.id, 'REJECT')} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-sm rounded-lg flex items-center">
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </button>
                    </>
                  )}
                  {r.status === 'APPROVED' && (
                    <button onClick={() => handleAction(r.id, 'REFUND')} className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-sm rounded-lg flex items-center shadow-md shadow-emerald-200">
                      <ArrowRightLeft className="w-4 h-4 mr-1" /> Process Khata Refund
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Medicine</p>
                  <p className="font-medium text-slate-800 text-sm mt-0.5">{r.medicineName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Batch & Expiry</p>
                  <p className="font-medium text-slate-800 text-sm mt-0.5">{r.batchNumber} <span className="text-rose-500">({r.expiryDate})</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Quantity Returned</p>
                  <p className="font-medium text-slate-800 text-sm mt-0.5">{r.quantity} units</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Reason</p>
                  <p className="font-medium text-slate-800 text-sm mt-0.5 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" /> {r.returnReason}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
