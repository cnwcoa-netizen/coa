import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon: React.ElementType;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4 relative" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative group cursor-pointer transition-all",
          isOpen ? "z-40" : "z-0"
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon size={18} className={cn(
            "transition-colors",
            isOpen || value ? "text-blue-600" : "text-slate-400"
          )} />
        </div>
        
        <div className={cn(
          "w-full pl-12 pr-10 py-4 bg-slate-50 border rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-between",
          isOpen ? "border-blue-600 ring-4 ring-blue-100 bg-white" : "border-slate-100 hover:border-blue-300"
        )}>
          <span className={cn(
            "truncate",
            value ? "text-slate-900" : "text-slate-400"
          )}>
            {value || placeholder}
          </span>
          <ChevronDown size={16} className={cn(
            "text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180 text-blue-600"
          )} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  !value ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                All {label}s
              </button>
              
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all mt-1",
                      value === option ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    )}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
