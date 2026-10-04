import React, { useState, useEffect } from 'react';
import { IndianRupee, FileText, Download, TrendingUp, Calendar, Loader2, Search, ArrowRight } from 'lucide-react';
import { BillingService } from '../../services/billingService';
import { Bill } from '../../types/billing';
import { DEV_PHARMACY_ID } from '../../config/development';

export default function WholesaleInvoiceHistory() {
  const [invoices, setInvoices] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const allBills = await BillingService.getPharmacyBills(DEV_PHARMACY_ID);
      // Backend might return billType or we just filter locally if we have it
      // Filter for B2B/Wholesale bills only
      const b2bBills = allBills.filter(b => b.billType === 'WHOLESALE' || (b as any).type === 'WHOLESALE' || Number(b.total) > 1500); // fallback heuristic if billType is missing in db
      setInvoices(b2bBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.total), 0); // Simulated pending

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Wholesale Invoices
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track and download past B2B bills.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex flex-col justify-center">
            <span className="text-xs font-bold text-blue-600 uppercase">Total Sales (30d)</span>
            <span className="text-lg font-extrabold text-blue-900">₹{totalOutstanding.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by client or invoice #..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <button className="text-sm font-semibold text-blue-600 flex items-center hover:text-blue-700">
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p>No wholesale invoices found.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">B2B Client</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                    {inv.billNumber || `INV-${inv.id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800">{inv.customerName}</div>
                    <div className="text-xs text-slate-500">{inv.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-slate-800">
                    ₹{Number(inv.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center">
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
