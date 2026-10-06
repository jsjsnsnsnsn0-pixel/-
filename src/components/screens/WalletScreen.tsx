import {EmptyState,InlineLoading,ErrorState} from '../common/UIState';
import { DiamondRedeemModal } from '../modals/DiamondRedeemModal';
import { diamondState } from '../../services/diamonds';
import { useServerData } from '../../hooks/useServerData';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction } from '../../types';
import {
  ChevronRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Gift,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const { user, transactions, setActiveSubScreen } = useApp();
  const [redeeming,setRedeeming] = useState(false);
  const breakdown = useServerData(diamondState, null);
  const [filterTab, setFilterTab] = useState<'all' | 'recharge' | 'sent' | 'received'>('all');

  const getFilteredTransactions = () => {
    switch (filterTab) {
      case 'recharge':
        return transactions.filter((t) => t.type === 'recharge');
      case 'sent':
        return transactions.filter((t) => t.type === 'gift_sent');
      case 'received':
        return transactions.filter((t) => ['gift_received','fixed_gift_diamonds_received','lucky_gift_diamonds_received'].includes(t.type));
      default:
        return transactions;
    }
  };

  const filteredList = getFilteredTransactions();

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-28" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            aria-label="الرجوع" className="ui-icon-button rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <h1 className="text-base font-bold text-slate-100">المحفظة والرصيد</h1>
        </div>

        <button
          onClick={() => setActiveSubScreen('recharge')}
          className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30"
        >
          + شحن
        </button>
      </header>

      {/* Two Main Cards: Gold & Diamonds */}
      <div className="p-4 space-y-3">
        {/* GOLD CARD */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#2c2010] via-[#1f1910] to-[#121424] border border-amber-500/40 p-4 shadow-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-2xl shadow-md">
                🪙
              </div>
              <div>
                <span className="text-xs text-amber-300 font-semibold block">Coins 🪙 — عملة الشحن والإنفاق</span>
                <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {user.gold.toLocaleString('ar-SA')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveSubScreen('recharge')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-extrabold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} />
              <span>شحن Coins</span>
            </button>
          </div>
        </div>

        {/* DIAMONDS CARD */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0e2136] via-[#101b2a] to-[#121424] border border-cyan-500/40 p-4 shadow-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 flex items-center justify-center text-2xl shadow-md">
                💎
              </div>
              <div>
                <span className="text-xs text-cyan-300 font-semibold block">Diamonds 💎 — أرباح الهدايا</span>
                <span className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
                  {user.diamonds.toLocaleString('ar-SA')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setRedeeming(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              فك الماس
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 text-xs text-slate-300 space-y-1">
        {breakdown.loading && <InlineLoading>جارٍ تحميل مصادر الماس…</InlineLoading>}
        {breakdown.error && <ErrorState message={breakdown.error} onRetry={()=>void breakdown.reload()}/>}
        {breakdown.data && <><p>Fixed Diamonds: {Number(breakdown.data.fixed_diamonds).toLocaleString()} 💎 — 30%</p><p>Lucky Diamonds: {Number(breakdown.data.lucky_diamonds).toLocaleString()} 💎 — 10%</p><p>ماس قديم غير محدد المصدر: {Number(breakdown.data.legacy_diamonds).toLocaleString()} 💎 — يحتاج مراجعة</p></>}
      </div>
      {redeeming && <DiamondRedeemModal onClose={() => setRedeeming(false)} onRedeemed={() => void breakdown.reload()} />}
      {/* Transaction History Section */}
      <div className="px-4 mt-2">
        <h3 className="text-xs font-bold text-slate-300 mb-2">سجل العمليات والتحويلات:</h3>

        {/* 4 Tabs Filter */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#141629] rounded-xl border border-purple-500/15 text-xs mb-3">
          <button
            aria-pressed={filterTab==='all'} onClick={() => setFilterTab('all')}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'all'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل
          </button>
          <button
            aria-pressed={filterTab==='recharge'} onClick={() => setFilterTab('recharge')}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'recharge'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الشحن
          </button>
          <button
            aria-pressed={filterTab==='sent'} onClick={() => setFilterTab('sent')}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'sent'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مرسلة
          </button>
          <button
            aria-pressed={filterTab==='received'} onClick={() => setFilterTab('received')}
            className={`py-1.5 rounded-lg font-medium transition-all ${
              filterTab === 'received'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مستلمة
          </button>
        </div>

        {/* Transaction Items List */}
        <div className="space-y-2">
          {!filteredList.length && <EmptyState title="لا توجد عمليات في هذه القائمة" />}
          {filteredList.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <div
                key={tx.id}
                className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-[#141629] border border-purple-500/15 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'recharge'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : tx.type === 'gift_sent'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {tx.type === 'recharge' ? (
                      <ArrowDownLeft size={18} />
                    ) : tx.type === 'gift_sent' ? (
                      <ArrowUpRight size={18} />
                    ) : (
                      <Gift size={18} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-100 break-words">{tx.title}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono mt-1">
                      <span>{tx.date}</span>
                      <span>·</span>
                      <span>{tx.time}</span>
                      <span>·</span>
                      <span className="ui-id basis-full text-purple-300 font-normal">ID: {tx.id}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-end max-w-[40%]">
                  <span
                    dir="ltr" className={`block text-sm font-extrabold font-mono ${
                      isPositive ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isPositive ? `+${tx.amount.toLocaleString('ar-SA')}` : tx.amount.toLocaleString('ar-SA')}{' '}
                    {tx.currency === 'gold' ? '🪙' : tx.currency === 'silver' ? '🥈' : '💎'}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 justify-end">
                    <CheckCircle2 size={10} />
                    <span>مكتمل</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
