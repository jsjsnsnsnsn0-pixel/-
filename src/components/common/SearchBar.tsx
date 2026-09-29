import React from 'react';
import { Search, X, Mic } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
  onFocus?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'ابحث عن غرفة، مستخدم أو رقم ID...',
  onFocus,
  className = '',
  autoFocus = false,
}) => {
  return (
    <div
      className={`relative flex items-center bg-slate-100/80 hover:bg-slate-100 focus-within:bg-white border border-slate-200/90 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/10 rounded-2xl px-3.5 py-2.5 shadow-xs transition-all ${className}`}
    >
      <Search size={18} className="text-slate-400 shrink-0 ml-2" />
      <input
        type="text"
        dir="rtl"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            if (onClear) onClear();
          }}
          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
        >
          <X size={16} />
        </button>
      ) : (
        <div className="text-cyan-600 p-1">
          <Mic size={16} />
        </div>
      )}
    </div>
  );
};
