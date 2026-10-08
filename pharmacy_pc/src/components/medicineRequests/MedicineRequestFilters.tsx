import React from 'react';
import { Search, X } from 'lucide-react';
import { MedicineRequestStatus } from '../../types/medicineRequest';

interface MedicineRequestFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onClear: () => void;
}

export default function MedicineRequestFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onClear
}: MedicineRequestFiltersProps) {
  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 mb-2 flex flex-col sm:flex-row gap-4 transition-all">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by medicine, customer name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 hover:bg-slate-100 transition-colors focus:bg-white"
        />
      </div>
      
      <div className="sm:w-56">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full pl-4 pr-10 py-3 text-base border border-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors focus:bg-white font-medium text-slate-700 cursor-pointer appearance-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="WAITING">Waiting</option>
          <option value="AVAILABLE">Available</option>
          <option value="CAN_ARRANGE">Can Arrange</option>
          <option value="NOT_AVAILABLE">Not Available</option>
        </select>
      </div>

      <button
        onClick={onClear}
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 shadow-sm text-sm font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <X className="h-4 w-4 mr-2" />
        Clear
      </button>
    </div>
  );
}
