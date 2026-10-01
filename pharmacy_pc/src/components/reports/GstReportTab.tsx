import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { DEV_PHARMACY_ID } from '../../config/development';
import { ReportService, ReportDateRange } from '../../services/reportService';

export default function GstReportTab({ dateRange }: { dateRange: ReportDateRange }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    ReportService.getGstReport(DEV_PHARMACY_ID, dateRange)
      .then(res => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Failed to load GST report');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p>No GST data available for this period.</p>
      </div>
    );
  }

  const totals = data.reduce((acc, row) => ({
    taxableAmount: acc.taxableAmount + row.taxableAmount,
    cgst: acc.cgst + row.cgst,
    sgst: acc.sgst + row.sgst,
    igst: acc.igst + row.igst,
    totalGst: acc.totalGst + row.totalGst,
    totalAmount: acc.totalAmount + row.totalAmount
  }), { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, totalAmount: 0 });

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GST Slab</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Taxable Amt (₹)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">CGST (₹)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">SGST (₹)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">IGST (₹)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total GST (₹)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Amt (₹)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.gstRate}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{row.taxableAmount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{row.cgst.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{row.sgst.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{row.igst.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 text-right">{row.totalGst.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold text-right">{row.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">Grand Total</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">{totals.taxableAmount.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">{totals.cgst.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">{totals.sgst.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">{totals.igst.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 text-right">{totals.totalGst.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 text-right">{totals.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
