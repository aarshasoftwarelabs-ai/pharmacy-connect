import React, { useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle, ShoppingBag, ArrowUpDown } from 'lucide-react';
import { ReportService, ReportDateRange, MedicineSalesReportItem } from '../../services/reportService';
import { getPharmacyId } from '../../config/development';

export default function MedicineSalesTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [data, setData] = useState<MedicineSalesReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'sales'>('quantity');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ReportService.getMedicineSalesReport(getPharmacyId(), { ...dateRange, search, sortBy });
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load medicine sales report');
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [dateRange.from, dateRange.to, search, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 w-full max-w-md shadow-sm">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search Medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-sm text-slate-900"
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => setSortBy('quantity')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'quantity' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sort by Quantity
          </button>
          <button
            onClick={() => setSortBy('sales')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${sortBy === 'sales' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sort by Revenue
          </button>
        </div>
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
          <ShoppingBag className="w-10 h-10 mb-2 text-slate-300" />
          <p>No medicines sold for this period.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Medicine Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end">
                    Quantity Sold
                    {sortBy === 'quantity' && <ArrowUpDown className="w-3 h-3 ml-1 text-indigo-500" />}
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end">
                    Total Sales
                    {sortBy === 'sales' && <ArrowUpDown className="w-3 h-3 ml-1 text-indigo-500" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.medicineName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{item.quantitySold}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">₹{item.totalSales.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
