import React from 'react';
import { X, MessageCircle, Sparkles, Lock, Unlock, CheckCircle } from 'lucide-react';
import { useMonthlyRecharge } from '../../hooks/useMonthlyRecharge';
import { useApp } from '../../context/AppContext';
import { usePublicChat } from '../../hooks/usePublicChat';

interface CustomGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomGiftModal: React.FC<CustomGiftModalProps> = ({ isOpen, onClose }) => {
  const { user, setActiveSubScreen, setSelectedChatUser } = useApp();

  const { opening, openChat } = usePublicChat(isOpen);
  const currentMonthlyRecharge = useMonthlyRecharge(user.authId, isOpen);

  const targetAmount = 1500;
  const progressPct = Math.min(100, (currentMonthlyRecharge / targetAmount) * 100);
  const remaining = Math.max(0, targetAmount - currentMonthlyRecharge);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[96vh] bg-[#1a0426] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.45)] overflow-hidden flex flex-col"
      >
        {/* Top Control Bar */}
        <div className="relative py-2.5 px-4 bg-gradient-to-r from-[#12021c] via-[#2d0745] to-[#12021c] border-b border-[#d4af37]/60 flex items-center justify-between z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-[#d4af37]/50 text-[#f5d77f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#f3e8ff] tracking-wide" dir="rtl">
              🎁 الهدية المخصصة - الشحن التراكمي 🎁
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Content Body: The exact vertical full-screen poster */}
        <div className="overflow-y-auto flex-1 bg-black flex flex-col items-center p-1 sm:p-2 scrollbar-thin scrollbar-thumb-purple-600/40">
          <div className="relative w-full max-w-[440px] flex flex-col items-center">
            {/* The exact image matching the user upload with Lock / Unlock Badge */}
            <div className="relative w-full">
              <img
                src="/assets/images/custom_gift_user_exact_1790801288056.jpg"
                alt="قيمة الشحن التراكمي الشهري - الهدية المخصصة $1500"
                className="w-full h-auto object-contain rounded-2xl border border-[#d4af37]/60 shadow-2xl block"
              />

              {/* Status Lock / Unlock Floating Badge */}
              <div className="absolute top-3 right-3 z-10" dir="rtl">
                {currentMonthlyRecharge >= targetAmount ? (
                  <div className="px-3 py-1.5 rounded-full bg-emerald-600/90 text-white border-2 border-amber-300 font-black text-xs shadow-xl flex items-center gap-1.5 animate-bounce">
                    <Unlock size={15} className="text-amber-200" />
                    <span>تم فتح القفل بنجاح 🔓</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-black/80 text-amber-200 border border-amber-400/60 font-black text-xs shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                    <Lock size={15} className="text-amber-400" />
                    <span>مقفل حتى الوصول إلى $1500 🔒</span>
                  </div>
                )}
              </div>
            </div>

            {/* Real Progress Banner: كم شحنت وكم باقي لك للهدية المخصصة */}
            <div className="mt-2.5 w-full px-2" dir="rtl">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#2a0440] via-[#1a0229] to-[#2a0440] border border-[#d4af37]/70 shadow-lg text-center">
                <div className="flex items-center justify-between text-xs font-black text-[#f3e8ff] mb-1.5 px-1">
                  <span>تم شحن: <strong className="text-amber-300 font-mono">${currentMonthlyRecharge.toFixed(2)}</strong></span>
                  <span>الهدف: <strong className="text-amber-300 font-mono">$1500.00</strong></span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-black/80 border border-purple-500/40 overflow-hidden relative p-[1px]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-amber-400 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold mt-1.5 px-1">
                  <span className="text-purple-200">النسبة المكتملة: {progressPct.toFixed(1)}%</span>
                  <span className="text-amber-300">
                    {remaining > 0 ? `المتبقي للحصول على الهدية: $${remaining.toFixed(2)}` : '🎉 مبروك! لقد حققت شرط الهدية بالكامل!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button: تواصل مع خدمة العملاء */}
            <div className="mt-3 w-full px-2 flex flex-col gap-2" dir="rtl">
              <button
                type="button"
                disabled={opening}
                onClick={async () => { if (await openChat()) onClose(); }}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#9333ea] via-[#7e22ce] to-[#581c87] border-2 border-amber-300 text-white font-black text-sm shadow-[0_0_20px_rgba(147,51,234,0.6)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle size={18} className="text-amber-300" />
                <span>تواصل مع خدمة العملاء للحصول عليها</span>
                <Sparkles size={16} className="text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
