import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string | React.ReactNode;
}

interface ModernSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  theme?: 'indigo' | 'blue' | 'pharmacy';
}

export function ModernSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  className = "",
  theme = "indigo"
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'blue':
        return {
          borderActive: 'border-blue-500 ring-2 ring-blue-100',
          itemActive: 'bg-blue-50 text-blue-700 font-bold',
          iconActive: 'text-blue-600'
        };
      case 'pharmacy':
        return {
          borderActive: 'border-emerald-500 ring-2 ring-emerald-100',
          itemActive: 'bg-emerald-50 text-emerald-700 font-bold',
          iconActive: 'text-emerald-600'
        };
      case 'indigo':
      default:
        return {
          borderActive: 'border-indigo-500 ring-2 ring-indigo-100',
          itemActive: 'bg-indigo-50 text-indigo-700 font-bold',
          iconActive: 'text-indigo-600'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`w-full px-4 py-2.5 bg-slate-50 border ${isOpen ? themeClasses.borderActive : 'border-slate-200'} rounded-xl cursor-pointer flex justify-between items-center transition-all hover:border-slate-300`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate ${selectedOption ? 'text-slate-800 font-medium' : 'text-slate-400 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">No options available</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                  value === option.value ? themeClasses.itemActive : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <Check className={`w-4 h-4 shrink-0 ${themeClasses.iconActive}`} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
