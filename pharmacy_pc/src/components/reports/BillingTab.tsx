import React, { useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle, FileText, Printer, Download, Eye } from 'lucide-react';
import { ReportService, ReportDateRange, BillingReportItem } from '../../services/reportService';
import { BillingService } from '../../services/billingService';
import { getPharmacyId } from '../../config/development';
import ReceiptAnimation from '../billing/ReceiptAnimation';
import { printBill } from '../../utils/printUtils';

export default function BillingTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [data, setData] = useState<BillingReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [viewingBillId, setViewingBillId] = useState<number | null>(null);
  const [fullBillMap, setFullBillMap] = useState<Record<number, any>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ReportService.getBillingReport(getPharmacyId(), { ...dateRange, search });
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load billing report');
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [dateRange.from, dateRange.to, search]);

  const handleAction = async (billId: number, action: 'view' | 'print' | 'pdf') => {
    try {
      setActionLoading(billId);
      
      let bill = fullBillMap[billId];
      if (!bill) {
        bill = await BillingService.getBillById(billId);
        setFullBillMap(prev => ({ ...prev, [billId]: bill }));
      }

      if (action === 'view') {
        setViewingBillId(billId);
      } else if (action === 'print') {
        printBill(bill, 'A4', 'DavaSetu Pharmacy', 'Admin');
      } else if (action === 'pdf') {
        // Our printBill utility handles PDF when thermal is not selected, but standard print dialog
        // For actual direct PDF download we'd need jspdf. But print dialog allows "Save as PDF".
        printBill(bill, 'A4', 'DavaSetu Pharmacy', 'Admin'); 
      }
    } catch (e) {
      alert('Failed to fetch full bill details');
    } finally {
      setActionLoading(null);
    }
  };

  if (viewingBillId && fullBillMap[viewingBillId]) {
    return (
      <div className="relative">
        <button 
          onClick={() => setViewingBillId(null)}
          className="absolute top-2 right-2 z-50 p-2 bg-white rounded-full shadow-md text-slate-500 hover:text-slate-900"
        >
          ✕
        </button>
        <ReceiptAnimation 
          bill={fullBillMap[viewingBillId]} 
          onClose={() => setViewingBillId(null)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 w-full max-w-md shadow-sm">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search by Bill Number or Customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-sm text-slate-900"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 text-red-500">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
          <FileText className="w-10 h-10 mb-2 text-slate-300" />
          <p>No bills found for this period.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Bill No.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right text-emerald-600">Profit</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">{item.billNumber}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(item.billDate).toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric', 
                        hour: 'numeric', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{item.customerName || '-'}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">₹{item.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">₹{item.totalProfit?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        item.paymentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {actionLoading === item.id ? (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin inline-block" />
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleAction(item.id, 'view')}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(item.id, 'print')}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
