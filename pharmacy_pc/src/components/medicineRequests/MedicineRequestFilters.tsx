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
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by medicine, customer name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-pharmacy-500 focus:border-pharmacy-500 text-sm"
        />
      </div>
      
      <div className="sm:w-48">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-pharmacy-500 focus:border-pharmacy-500 sm:text-sm rounded-lg"
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
        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pharmacy-500"
      >
        <X className="h-4 w-4 mr-2" />
        Clear
      </button>
    </div>
  );
}
