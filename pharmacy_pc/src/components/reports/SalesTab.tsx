import React, { useEffect, useState } from 'react';
import { IndianRupee, TrendingDown, TrendingUp, Percent, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { ReportService, ReportDateRange, SalesReportData } from '../../services/reportService';
import { DEV_PHARMACY_ID } from '../../config/development';

export default function SalesTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ReportService.getSalesReport(DEV_PHARMACY_ID, dateRange);
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load sales report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange.from, dateRange.to]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-red-500">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.totalBills === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <ShoppingBag className="w-10 h-10 mb-2 text-slate-300" />
        <p>No sales recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
        <div className="flex items-center text-slate-500 mb-2">
          <IndianRupee className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Gross Sales</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">₹{data.totalSales.toFixed(2)}</p>
        <p className="text-sm text-slate-500 mt-1">Before discounts</p>
      </div>

      <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center text-orange-600 mb-2">
          <Percent className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Total Discount</h3>
        </div>
        <p className="text-3xl font-bold text-orange-700">₹{data.totalDiscount.toFixed(2)}</p>
        <p className="text-sm text-orange-600/80 mt-1">Given to customers</p>
      </div>

      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center text-indigo-600 mb-2">
          <TrendingUp className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Net Sales</h3>
        </div>
        <p className="text-3xl font-bold text-indigo-700">₹{data.netSales.toFixed(2)}</p>
        <p className="text-sm text-indigo-600/80 mt-1">Final collected amount</p>
      </div>

      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-center text-emerald-600 mb-2">
          <TrendingDown className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Net Profit</h3>
        </div>
        <p className="text-3xl font-bold text-emerald-700">₹{data.netProfit?.toFixed(2) || '0.00'}</p>
        <p className="text-sm text-emerald-600/80 mt-1">Total Sales - Purchase Cost</p>
      </div>


      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center text-blue-600 mb-2">
          <ShoppingBag className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Average Bill Value</h3>
        </div>
        <p className="text-3xl font-bold text-blue-700">₹{data.averageBillValue.toFixed(2)}</p>
        <p className="text-sm text-blue-600/80 mt-1">Across {data.totalBills} bills</p>
      </div>
    </div>
  );
}
