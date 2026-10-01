import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Power, PowerOff } from 'lucide-react';
import { Medicine } from '../../types/medicine';

interface ActionMenuProps {
  medicine: Medicine;
  onView: (med: Medicine) => void;
  onEdit: (med: Medicine) => void;
  onToggleStatus: (med: Medicine) => void;
}

export default function MedicineActionMenu({ medicine, onView, onEdit, onToggleStatus }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = medicine.status === 'Active';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => { onView(medicine); setIsOpen(false); }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-pharmacy-600"
              role="menuitem"
            >
              <Eye className="mr-3 h-4 w-4" /> View Details
            </button>
            <button
              onClick={() => { onEdit(medicine); setIsOpen(false); }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-pharmacy-600"
              role="menuitem"
            >
              <Edit className="mr-3 h-4 w-4" /> Edit Medicine
            </button>
            <button
              onClick={() => { onToggleStatus(medicine); setIsOpen(false); }}
              className={`w-full text-left flex items-center px-4 py-2 text-sm ${isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              role="menuitem"
            >
              {isActive ? <PowerOff className="mr-3 h-4 w-4" /> : <Power className="mr-3 h-4 w-4" />}
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
