import { Medicine } from '../../types/medicine';
import MedicineStatusBadge from './MedicineStatusBadge';
import StockIndicator from './StockIndicator';
import MedicineActionMenu from './MedicineActionMenu';

interface MedicineTableProps {
  medicines: Medicine[];
  onView: (med: Medicine) => void;
  onEdit: (med: Medicine) => void;
  onToggleStatus: (med: Medicine) => void;
}

export default function MedicineTable({ medicines, onView, onEdit, onToggleStatus }: MedicineTableProps) {
  if (medicines.length === 0) {
    return null; // Handled by empty state in parent
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medicine</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Generic Name</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Strength & Pack</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Selling Price</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {medicines.map((med) => (
              <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-pharmacy-700">{med.name}</div>
                  <div className="text-xs text-slate-500">SKU: {med.sku}</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell">
                  {med.genericName}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                  {med.category}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 hidden lg:table-cell">
                  <div>{med.strength}</div>
                  <div className="text-xs">{med.packSize}</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  ₹{med.sellingPrice}
                  {med.mrp > med.sellingPrice && (
                    <span className="ml-2 text-xs text-slate-400 line-through">₹{med.mrp}</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <StockIndicator currentStock={med.currentStock} minimumStock={med.minimumStock} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <MedicineStatusBadge status={med.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <MedicineActionMenu 
                    medicine={med} 
                    onView={onView}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
