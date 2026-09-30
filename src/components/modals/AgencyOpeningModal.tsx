import React from 'react';
import { X } from 'lucide-react';

interface AgencyOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgencyOpeningModal: React.FC<AgencyOpeningModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[96vh] bg-[#021315] border-2 border-[#caa43b] rounded-2xl shadow-[0_0_50px_rgba(202,164,59,0.4)] overflow-hidden flex flex-col"
      >
        {/* Top Control Bar */}
        <div className="relative py-2.5 px-4 bg-gradient-to-r from-[#021315] via-[#07363b] to-[#021315] border-b border-[#caa43b]/60 flex items-center justify-between z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-[#caa43b]/50 text-[#f5d77f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#f5d77f] tracking-wide" dir="rtl">
              🕌 نشاط فتح الوكالات 🕌
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Pure Exact Image View - As-Is */}
        <div className="overflow-y-auto flex-1 bg-black flex flex-col items-center p-1 sm:p-2 scrollbar-thin scrollbar-thumb-amber-600/40">
          <div className="w-full flex justify-center">
            <img
              src="/src/assets/images/agency_opening_rules_exact_1790729202852.jpg"
              alt="نشاط فتح الوكالات"
              className="w-full max-w-[440px] h-auto object-contain rounded-xl border border-[#caa43b]/50 shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
