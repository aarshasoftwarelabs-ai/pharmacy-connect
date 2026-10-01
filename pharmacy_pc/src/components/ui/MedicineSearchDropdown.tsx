import React, { useState, useRef, useEffect } from 'react';
import { Search, Package, AlertCircle } from 'lucide-react';
import { Medicine } from '../../types/medicine';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicineSearchDropdownProps {
  catalogue: Medicine[];
  value: string;
  onChange: (medicineName: string, selectedMedicine?: Medicine) => void;
  placeholder?: string;
  className?: string;
}

export default function MedicineSearchDropdown({ catalogue, value, onChange, placeholder, className = '' }: MedicineSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCatalogue = catalogue.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.manufacturer && m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 50); // Limit to 50 for performance

  const handleSelect = (medicine: Medicine) => {
    setSearchTerm(medicine.name);
    setIsOpen(false);
    onChange(medicine.name, medicine);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    onChange(val); // Still emit raw value for custom entries
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder || "Search Medicine..."}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white transition-all shadow-sm"
          required
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
      </div>

      <AnimatePresence>
        {isOpen && searchTerm.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full md:w-[350px] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden"
          >
            {filteredCatalogue.length > 0 ? (
              <ul className="py-2">
                {filteredCatalogue.map((med) => (
                  <li 
                    key={med.id}
                    onClick={() => handleSelect(med)}
                    className="px-4 py-2 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                        {med.name}
                      </div>
                      <div className="text-xs text-slate-500">{med.manufacturer || 'Generic'} • {med.strength || '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm">₹{med.sellingPrice}</div>
                      <div className={`text-xs font-medium flex items-center justify-end ${med.currentStock > 0 ? 'text-slate-500' : 'text-red-500'}`}>
                        {med.currentStock <= 0 && <AlertCircle className="w-3 h-3 mr-1" />}
                        Stock: {med.currentStock}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-slate-500 text-sm flex flex-col items-center">
                <Package className="w-8 h-8 mb-2 text-slate-300" />
                No matching medicines found.
                <span className="text-xs text-slate-400 mt-1 block">Custom name will be saved.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
