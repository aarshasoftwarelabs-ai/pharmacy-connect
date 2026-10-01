import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModernDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ModernDatePicker({ value, onChange, label, className = '' }: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIdx: number) => {
    // Generate a string YYYY-MM-DD
    const newDate = new Date(viewYear, monthIdx, 1);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = '01'; // Defaulting to 1st of the month since expiry is usually month-level
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return '';
    const d = new Date(value);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500 transition-all hover:bg-slate-50 shadow-sm"
      >
        <span className={value ? 'text-slate-800 font-medium' : 'text-slate-400'}>
          {value ? getDisplayValue() : 'Select Month/Year'}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-72 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden p-4 right-0 sm:left-0 sm:right-auto"
            style={{ boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}
          >
            {/* Header: Year Selector */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewYear(y => y - 1); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-lg font-bold text-slate-800 tracking-tight">
                {viewYear}
              </span>
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewYear(y => y + 1); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, idx) => {
                const isSelected = value && new Date(value).getMonth() === idx && new Date(value).getFullYear() === viewYear;
                const isCurrent = new Date().getMonth() === idx && new Date().getFullYear() === viewYear;
                
                return (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    key={month}
                    onClick={(e) => { e.stopPropagation(); handleMonthSelect(idx); }}
                    className={`
                      py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${isSelected 
                        ? 'bg-gradient-to-br from-pharmacy-500 to-pharmacy-600 text-white shadow-md shadow-pharmacy-500/30' 
                        : isCurrent 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                      }
                    `}
                  >
                    {month}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
