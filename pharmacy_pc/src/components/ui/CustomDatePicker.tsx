import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomDatePicker({ value, onChange, placeholder = "Select date", className = "" }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // Format to YYYY-MM-DD local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

    const days = [];
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    // Empty cells
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Date cells
    const selectedDate = value ? new Date(value) : null;
    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const isToday = today.getDate() === day && 
        today.getMonth() === month && 
        today.getFullYear() === year;

      days.push(
        <button
          key={day}
          onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 
            ${isSelected 
              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200 transform scale-110' 
              : isToday 
                ? 'bg-slate-100 text-indigo-600 border border-indigo-200' 
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:scale-110'
            }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="p-4 w-72">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-slate-800 text-sm">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-semibold text-slate-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 place-items-center">
          {days}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={setToday}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  const displayDate = value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className={`w-full bg-white border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'} rounded-xl text-xs sm:text-sm transition-all flex items-center cursor-pointer overflow-hidden group`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`flex items-center justify-center w-8 h-full border-r border-slate-100 py-2.5 ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50/50'} transition-colors`}>
          <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 px-2 py-2.5 font-medium text-slate-700 truncate tracking-tight">
          {displayDate || <span className="text-slate-400 font-normal">{placeholder}</span>}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 bg-white rounded-2xl shadow-xl shadow-indigo-900/10 border border-slate-200 overflow-hidden top-full left-0 right-auto min-w-[280px]"
            style={{ 
              transformOrigin: "top left"
            }}
          >
            {renderCalendar()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
