import React from 'react';
import { Image as ImageIcon, Eye, FileText, User } from 'lucide-react';
import { MedicineRequest } from '../../types/medicineRequest';

interface MedicineRequestTableProps {
  requests: MedicineRequest[];
  onView: (request: MedicineRequest) => void;
}

export default function MedicineRequestTable({ requests, onView }: MedicineRequestTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 shadow-sm border border-amber-200/50">WAITING</span>;
      case 'AVAILABLE':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200/50">AVAILABLE</span>;
      case 'CAN_ARRANGE':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shadow-sm border border-blue-200/50">CAN ARRANGE</span>;
      case 'NOT_AVAILABLE':
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 shadow-sm border border-rose-200/50">NOT AVAILABLE</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (requests.length === 0) {
    return (
      <div className="p-16 text-center flex flex-col items-center">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">No medicine requests found</h3>
        <p className="text-slate-500 font-medium">Try changing your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50/50">
          <tr>
            <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Request</th>
            <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
            <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Requested At</th>
            <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
            <th scope="col" className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-50">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onView(request)}>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mr-4 border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                    {request.imageAttached ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {request.medicineName || <span className="italic text-slate-400 font-medium">Image Prescription</span>}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mr-3 border border-slate-200">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{request.customerName}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{request.customerPhone}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-500">
                {formatDate(request.requestedAt)}
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                {getStatusBadge(request.status)}
              </td>
              <td className="px-6 py-5 whitespace-nowrap text-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onView(request); }}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-bold shadow-sm hover:shadow-indigo-500/25 border border-indigo-100 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
