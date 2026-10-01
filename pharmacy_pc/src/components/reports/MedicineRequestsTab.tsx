import React, { useEffect, useState } from 'react';
import { Stethoscope, Loader2, AlertCircle, Clock, CheckCircle2, XCircle, PackageSearch } from 'lucide-react';
import { ReportService, ReportDateRange, MedicineRequestReportData } from '../../services/reportService';
import { DEV_PHARMACY_ID } from '../../config/development';

export default function MedicineRequestsTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [data, setData] = useState<MedicineRequestReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ReportService.getMedicineRequestReport(DEV_PHARMACY_ID, dateRange);
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load request report');
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

  if (!data || data.totalRequests === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <Stethoscope className="w-10 h-10 mb-2 text-slate-300" />
        <p>No medicine requests recorded for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Requests</p>
        <p className="text-4xl font-bold text-slate-900">{data.totalRequests}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-yellow-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-yellow-600 mb-2">
            <Clock className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Waiting</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.waiting}</p>
          <p className="text-xs text-slate-500 mt-1">Pending pharmacy response</p>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-indigo-600 mb-2">
            <PackageSearch className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Can Arrange</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.canArrange}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting customer confirm</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Confirmed / Available</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.confirmed + data.available}</p>
          <p className="text-xs text-slate-500 mt-1">Ready for pickup</p>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-red-600 mb-2">
            <XCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Cancelled</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.cancelled}</p>
          <p className="text-xs text-slate-500 mt-1">Cancelled by customer</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center text-slate-600 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Not Available</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.notAvailable}</p>
          <p className="text-xs text-slate-500 mt-1">Pharmacy cannot arrange</p>
        </div>

      </div>
    </div>
  );
}
