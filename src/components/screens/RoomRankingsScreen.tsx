import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtimeRankings } from '../../context/RealtimeRankingsContext';
import { ChevronRight, Trophy, CheckCircle2 } from 'lucide-react';

export const RoomRankingsScreen: React.FC = () => {
  const { setActiveSubScreen, rooms } = useApp();
  const { roomRankings, period: activePeriod, setPeriod: setActivePeriod } = useRealtimeRankings();
  const scheduleTimeout = useTimeouts();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Top 1, Top 2, Top 3 Rooms
  const top1 = roomRankings.length > 0 ? roomRankings[0] : null;
  const top2 = roomRankings.length > 1 ? roomRankings[1] : null;
  const top3 = roomRankings.length > 2 ? roomRankings[2] : null;
  const otherRanks = roomRankings.slice(3, 10);

  // Test boost a room
  const handleBoostRoom = (_amount: number) => {
    setFeedbackMsg('التصنيف يعتمد على الهدايا الفعلية المرسلة داخل الغرف.');
    scheduleTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div
      className="min-h-screen text-white select-none relative overflow-x-hidden pb-24 font-sans bg-black"
      dir="rtl"
    >
      {/* 0. Full Exact Background Wallpaper (Crown & Crowned Lions with Ruby Highlights) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <img
          src="/assets/images/room_screen_bg_1790556227206.jpg"
          alt="خلفية تصنيف الغرفة"
          className="w-full h-full object-cover max-w-[480px]"
        />
        {/* Subtle vignette so lions, marble stage, and ruby crystals shine through clearly */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 1. Clean Top Header: Return Button + Centered Title Text (No Box, No Boost Button) */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => setActiveSubScreen(null)}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 border border-amber-400/80 text-amber-200 flex items-center justify-center cursor-pointer hover:bg-black active:scale-95 transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          aria-label="الرجوع"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>

        {/* Clean Title Only */}
        <h1 className="text-lg font-black text-amber-300 tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
          تصنيف كأس الغرفة
        </h1>

        {/* Empty placeholder to balance layout */}
        <div className="w-9" />
      </header>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white font-black text-xs px-4 py-2 rounded-full shadow-2xl border border-white flex items-center gap-1.5 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. Period Switcher (يومي | أسبوعي | شهري) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-2">
        <div className="p-1 rounded-2xl bg-black/50 border border-amber-500/30 backdrop-blur-xs flex items-center justify-between shadow-lg">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => {
            const labels = { daily: 'اليومي', weekly: 'الأسبوعي', monthly: 'الشهري' };
            const isActive = activePeriod === period;
            return (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`flex-1 py-1 text-xs font-black rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white shadow-md'
                    : 'text-amber-200/80 hover:text-white'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PODIUM (Clean Pure Circular Room Covers + Names + Values directly over Royal Stage - No Box Grids, No Crowns) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 items-end gap-2 pt-2">
          {/* ===================== TOP 2 (Right in RTL / Silver) ===================== */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Pure Circular Room Cover with Silver Ring */}
              <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500 shadow-[0_0_20px_rgba(203,213,225,0.7)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {top2 ? (
                    <img src={top2.roomCover} alt={top2.roomName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-slate-500">🏰</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-slate-300 to-slate-100 text-black font-black text-[9px] shadow-md border border-white">
                TOP 2
              </span>
            </div>

            {/* Room Name below avatar */}
            <div className="mt-3.5 text-center w-full px-1">
              <div className="text-xs font-black text-slate-100 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {top2 ? top2.roomName : 'غرفة شاغرة'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-[11px] font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top2 ? top2.supportScore.toLocaleString() : '0'}</span>
                <span>💎</span>
              </div>
            </div>
          </div>

          {/* ===================== TOP 1 (Center / Gold) ===================== */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              {/* Pure Circular Room Cover with Radiant Gold Ring */}
              <div className="w-22 h-22 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-yellow-200 to-rose-500 shadow-[0_0_30px_rgba(245,158,11,0.9)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border-2 border-amber-300">
                  {top1 ? (
                    <img src={top1.roomCover} alt={top1.roomName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-amber-500/50">🏰</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-black text-[10px] shadow-lg border border-amber-200">
                TOP 1
              </span>
            </div>

            {/* Room Name below avatar */}
            <div className="mt-4 text-center w-full px-1">
              <div className="text-sm font-black text-amber-200 truncate drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                {top1 ? top1.roomName : 'بانتظار الغرفة المتصدرة'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-xs font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top1 ? top1.supportScore.toLocaleString() : '0'}</span>
                <span>💎</span>
              </div>
            </div>
          </div>

          {/* ===================== TOP 3 (Left in RTL / Bronze) ===================== */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Pure Circular Room Cover with Bronze Ring */}
              <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-amber-700 via-amber-500 to-amber-800 shadow-[0_0_20px_rgba(217,119,6,0.7)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {top3 ? (
                    <img src={top3.roomCover} alt={top3.roomName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-amber-700/50">🏰</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 text-white font-black text-[9px] shadow-md border border-amber-400">
                TOP 3
              </span>
            </div>

            {/* Room Name below avatar */}
            <div className="mt-3.5 text-center w-full px-1">
              <div className="text-xs font-black text-amber-200 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {top3 ? top3.roomName : 'شاغر'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-[11px] font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top3 ? top3.supportScore.toLocaleString() : '0'}</span>
                <span>💎</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LEADERBOARD LIST (TOP 4 TO 10 - Sleek Glass Rows directly over the wallpaper) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 text-[11px] font-black text-amber-300/90 drop-shadow">
          <span>قائمة شرف الغرف (4 - 10)</span>
          <span>نقاط كأس الغرفة 💎</span>
        </div>

        {Array.from({ length: 7 }).map((_, i) => {
          const rankNum = i + 4;
          const entry = otherRanks[i];
          const isSilver = rankNum % 2 !== 0;

          return (
            <div
              key={rankNum}
              className={`flex items-center justify-between py-2 px-3 rounded-2xl border backdrop-blur-xs transition-all ${
                isSilver
                  ? 'bg-black/50 border-slate-600/30 hover:border-slate-500/50'
                  : 'bg-black/50 border-amber-500/20 hover:border-amber-500/40 shadow-md'
              }`}
            >
              {/* Rank Badge + Circle Room Avatar + Room Name & Host */}
              <div className="flex items-center gap-3">
                {/* Clean Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border ${
                    rankNum === 4
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black border-yellow-200'
                      : isSilver
                      ? 'bg-gradient-to-b from-slate-300 to-slate-500 text-black border-white'
                      : 'bg-gradient-to-b from-rose-700 to-amber-700 text-white border-amber-300'
                  }`}
                >
                  {rankNum}
                </div>

                {/* Pure Circular Room Cover */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/70 bg-black shrink-0 shadow-md">
                  {entry ? (
                    <img src={entry.roomCover} alt={entry.roomName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                      🏰
                    </div>
                  )}
                </div>

                {/* Room Name & Host */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-100 max-w-[130px] truncate drop-shadow">
                    {entry ? entry.roomName : 'غرفة شاغرة'}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {entry ? `المضيف: ${entry.hostName}` : 'ادعم غرفتك لتتصدر'}
                  </span>
                </div>
              </div>

              {/* Value directly on right */}
              <div className="text-xs font-black text-amber-300 drop-shadow flex items-center gap-1">
                <span>{entry ? entry.supportScore.toLocaleString() : '0'}</span>
                <span>💎</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
