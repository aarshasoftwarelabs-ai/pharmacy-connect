import React, { useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle, Users, UserPlus, UserCheck } from 'lucide-react';
import { ReportService, ReportDateRange, CustomerReportData } from '../../services/reportService';
import { getPharmacyId } from '../../config/development';

export default function CustomersTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [data, setData] = useState<CustomerReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ReportService.getCustomerReport(getPharmacyId(), { ...dateRange, search });
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer report');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [dateRange.from, dateRange.to, search]);

  return (
    <div className="space-y-6">
      
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Customers</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.totalCustomers}</p>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-center">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">New Customers</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.newCustomers}</p>
              <p className="text-xs text-emerald-600 mt-1">First visit in this period</p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg mr-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Returning</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.returningCustomers}</p>
              <p className="text-xs text-indigo-600 mt-1">Visited before this period</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 w-full max-w-md shadow-sm">
        <Search className="w-5 h-5 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search Customer Name..."
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
      ) : !data || data.customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500">
          <Users className="w-10 h-10 mb-2 text-slate-300" />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">First Visit</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Visit</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total Bills</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.customers.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.customerName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.customerPhone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(item.firstVisit).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(item.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 text-right">{item.totalBills}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">₹{item.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
