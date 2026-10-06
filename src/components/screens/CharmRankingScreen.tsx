import {EmptyState} from '../common/UIState';
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtimeRankings } from '../../context/RealtimeRankingsContext';
import { ChevronRight, Heart } from 'lucide-react';

export const CharmRankingScreen: React.FC = () => {
  const { setActiveSubScreen, user } = useApp();
  const { charmRankings, period: activePeriod, setPeriod: setActivePeriod } = useRealtimeRankings();
  // Top 1, Top 2, Top 3
  const top1 = charmRankings.length > 0 ? charmRankings[0] : null;
  const top2 = charmRankings.length > 1 ? charmRankings[1] : null;
  const top3 = charmRankings.length > 2 ? charmRankings[2] : null;
  const otherRanks = charmRankings.slice(3, 10);

  // My ranking in Charm
  const myEntry = charmRankings.find((r) => r.id === user.id);

  return (
    <div
      className="min-h-screen text-white select-none relative overflow-x-hidden pb-24 font-sans bg-black"
      dir="rtl"
    >
      {/* 0. Full Exact Background Wallpaper (Ruby Eagles & Crimson Aura Artwork) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <img
          src="/assets/images/charm_screen_bg_1790555660904.jpg"
          alt="خلفية الجاذبية"
          className="w-full h-full object-cover max-w-[480px]"
        />
        {/* Subtle vignette so eagles and background artwork shine through cleanly */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 1. Clean Top Header: Return Button + Centered Title Text (No Box, No Support Button) */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => setActiveSubScreen(null)}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 border border-rose-400/80 text-rose-200 flex items-center justify-center cursor-pointer hover:bg-black active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          aria-label="الرجوع"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>

        {/* Clean Title Only */}
        <h1 className="text-lg font-black text-rose-300 tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
          تصنيف الجاذبية
        </h1>

        {/* Empty placeholder to balance layout */}
        <div className="w-9" />
      </header>

      {/* 2. Period Switcher (يومي | أسبوعي | شهري) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-2">
        <div className="p-1 rounded-2xl bg-black/50 border border-rose-500/30 backdrop-blur-xs flex items-center justify-between shadow-lg">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => {
            const labels = { daily: 'اليومي', weekly: 'الأسبوعي', monthly: 'الشهري' };
            const isActive = activePeriod === period;
            return (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`flex-1 py-1 text-xs font-black rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-md'
                    : 'text-rose-200/80 hover:text-white'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PODIUM (Clean Pure Circles + Names + Values directly over Ruby Eagles Wallpaper - No Box Grids, No Crowns) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 items-end gap-2 pt-2">
          {/* ===================== TOP 2 (Right in RTL / Silver) ===================== */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Pure Circular Avatar with Silver Ring */}
              <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500 shadow-[0_0_20px_rgba(203,213,225,0.7)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {top2 ? (
                    <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-slate-500">👤</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-slate-300 to-slate-100 text-black font-black text-[9px] shadow-md border border-white">
                TOP 2
              </span>
            </div>

            {/* Name below avatar */}
            <div className="mt-3.5 text-center w-full px-1">
              <div className="text-xs font-black text-slate-100 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {top2 ? top2.name : 'شاغر'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-[11px] font-black text-pink-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top2 ? top2.score.toLocaleString() : '0'}</span>
                <span>✨</span>
              </div>
            </div>
          </div>

          {/* ===================== TOP 1 (Center / Ruby-Gold) ===================== */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              {/* Pure Circular Avatar with Radiant Ruby-Gold Ring */}
              <div className="w-22 h-22 rounded-full p-1.5 bg-gradient-to-tr from-rose-500 via-pink-200 to-purple-600 shadow-[0_0_30px_rgba(244,63,94,0.9)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border-2 border-rose-300">
                  {top1 ? (
                    <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-rose-500/50">👤</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-purple-500 text-white font-black text-[10px] shadow-lg border border-rose-200">
                TOP 1
              </span>
            </div>

            {/* Name below avatar */}
            <div className="mt-4 text-center w-full px-1">
              <div className="text-sm font-black text-rose-200 truncate drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                {top1 ? top1.name : 'بانتظار نجم الجاذبية'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-xs font-black text-pink-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top1 ? top1.score.toLocaleString() : '0'}</span>
                <span>✨</span>
              </div>
            </div>
          </div>

          {/* ===================== TOP 3 (Left in RTL / Bronze) ===================== */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Pure Circular Avatar with Bronze Ring */}
              <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-800 shadow-[0_0_20px_rgba(217,119,6,0.7)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {top3 ? (
                    <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-amber-700/50">👤</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 text-white font-black text-[9px] shadow-md border border-amber-400">
                TOP 3
              </span>
            </div>

            {/* Name below avatar */}
            <div className="mt-3.5 text-center w-full px-1">
              <div className="min-w-0 text-sm font-bold text-rose-200 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {top3 ? top3.name : 'شاغر'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-[11px] font-black text-pink-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top3 ? top3.score.toLocaleString() : '0'}</span>
                <span>✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!charmRankings.length && <div className="relative z-10 px-4 mt-4 text-slate-200"><EmptyState title="لا توجد عمليات مؤهلة في هذه الفترة" /></div>}
      {/* 4. LEADERBOARD LIST (TOP 4 TO 10 - Sleek Glass Rows directly over the wallpaper) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 text-[11px] font-black text-rose-300/90 drop-shadow">
          <span>قائمة شرف الجاذبية (4 - 10)</span>
          <span>نقاط الجاذبية ✨</span>
        </div>

        {otherRanks.map((entry, i) => {
          const rankNum = i + 4;
          const isSilver = rankNum % 2 !== 0;

          return (
            <div
              key={rankNum}
              className={`flex items-center justify-between py-2 px-3 rounded-2xl border backdrop-blur-xs transition-all ${
                entry?.id === user.id
                  ? 'bg-rose-500/25 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : 'bg-black/50 border-rose-500/20 hover:border-rose-500/40 shadow-md'
              }`}
            >
              {/* Rank Badge + Circle Avatar + Name */}
              <div className="flex items-center gap-3">
                {/* Clean Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border ${
                    rankNum === 4
                      ? 'bg-gradient-to-b from-rose-400 to-pink-600 text-white border-pink-200'
                      : isSilver
                      ? 'bg-gradient-to-b from-slate-300 to-slate-500 text-black border-white'
                      : 'bg-gradient-to-b from-rose-700 to-purple-800 text-white border-rose-300'
                  }`}
                >
                  {rankNum}
                </div>

                {/* Circle Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-rose-400/70 bg-black shrink-0 shadow-md">
                  {entry ? (
                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                      👤
                    </div>
                  )}
                </div>

                {/* Name & ID */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-rose-100 max-w-[130px] truncate drop-shadow">
                      {entry ? entry.name : 'مقعد شاغر'}
                    </span>
                    {entry?.charmLevel !== undefined && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black">
                        Lv.{entry.charmLevel}
                      </span>
                    )}
                  </div>
                  <span className="ui-id text-xs text-zinc-400">
                    {entry ? `ID: ${entry.idNumber}` : 'استلم دعم لتتصدر'}
                  </span>
                </div>
              </div>

              {/* Value directly on right */}
              <div className="text-xs font-black text-pink-300 drop-shadow flex items-center gap-1">
                <span>{entry ? entry.score.toLocaleString() : '0'}</span>
                <span>✨</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Sticky Bottom Bar: My Real Charm Ranking & Direct Receive Support */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/85 border-t border-rose-500/40 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-rose-400 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white">
                {myEntry ? `#${myEntry.rank}` : 'غير مصنف'}
              </span>
            </div>
            <div>
              <div className="text-xs font-black text-rose-200 flex items-center gap-1">
                <span>{user.name}</span>
                <span className="text-[9px] text-rose-400">(حسابك)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                إجمالي استلامك داخل الغرف:{' '}
                <span className="text-pink-400 font-black">
                  {Number(user.receivedTotal || 0).toLocaleString()} ✨
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
