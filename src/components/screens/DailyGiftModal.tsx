import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Gift, Sparkles, Check } from 'lucide-react';

interface DailyGiftModalProps {
  onClose: () => void;
}

export const DailyGiftModal: React.FC<DailyGiftModalProps> = ({ onClose }) => {
  const { reportError } = useApp();
  const [opened, setOpened] = useState(false);
  const [rewardGold] = useState(300);
  const [rewardSilver] = useState(150);

  const handleOpenChest = () => {
    reportError('المكافأة اليومية غير متاحة حتى تفعيل منحها من الخادم.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white text-slate-800 p-6 shadow-2xl text-center border border-slate-100 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
        >
          <X size={18} />
        </button>

        {!opened ? (
          <div>
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center text-4xl shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
              🎁
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">صندوق الهدايا اليومي</h2>
            <p className="text-xs text-slate-500 mb-6">
              اضغط على الصندوق لفتح مكافأتك اليومية المجانية!
            </p>

            <button
              onClick={handleOpenChest}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-sm rounded-2xl shadow-md shadow-rose-500/25 hover:from-amber-600 hover:to-rose-600 cursor-pointer transition-all active:scale-95"
            >
              افتح الصندوق الآن ✨
            </button>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl mb-4 border border-emerald-200">
              🎉
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">مبروك!</h2>
            <p className="text-xs text-slate-500 mb-4">حصلت على مكافأتك اليومية:</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-2xl block mb-1">🪙</span>
                <span className="text-sm font-black text-amber-700">+{rewardGold}</span>
                <span className="text-[10px] text-amber-600 block">ذهب</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-2xl block mb-1">🥈</span>
                <span className="text-sm font-black text-purple-700">+{rewardSilver}</span>
                <span className="text-[10px] text-purple-600 block">عملات فضية</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer hover:bg-slate-800"
            >
              تم، رائع!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
