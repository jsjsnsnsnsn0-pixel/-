import { useTimeouts } from '../../hooks/useTimeouts';
import { setImageFallback } from '../../utils/imageFallback';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtimeRankings } from '../../context/RealtimeRankingsContext';
import { ChevronRight, Gift, CheckCircle2 } from 'lucide-react';

export const WealthRankingScreen: React.FC = () => {
  const { setActiveSubScreen, user, rechargeGold } = useApp();
  const { wealthRankings, recordGiftSupport } = useRealtimeRankings();
  const scheduleTimeout = useTimeouts();
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showQuickSupport, setShowQuickSupport] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Top 1, Top 2, Top 3
  const top1 = wealthRankings.length > 0 ? wealthRankings[0] : null;
  const top2 = wealthRankings.length > 1 ? wealthRankings[1] : null;
  const top3 = wealthRankings.length > 2 ? wealthRankings[2] : null;
  const otherRanks = wealthRankings.slice(3, 10);

  // Current logged in user ranking in Wealth
  const myEntry = wealthRankings.find((r) => r.id === user.id);

  // Quick Support Action for Testing
  const handleSupport = (amount: number) => {
    if (user.gold < amount) {
      rechargeGold(amount + 50000);
    }
    // Record real support from current user
    recordGiftSupport(
      user,
      {
        id: 'host-royal-star',
        username: 'queen_laila',
        name: '👑 ملكة السهرة',
        avatar: '/src/assets/images/default_arab_user_avatar_1790806239365.jpg',
        level: 45,
        vipLevel: 8,
        gold: 300000,
        diamonds: 120000,
        friendsCount: 230,
        followersCount: 1540,
        followingCount: 40,
        isOnline: true,
        receivedGiftsCount: 1200,
      },
      null,
      amount
    );
    setFeedbackMsg(`تم إرسال دعم بقيمة +${amount.toLocaleString()} 🪙 وارتفاع حسابك في الثروة!`);
    setShowQuickSupport(false);
    scheduleTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div
      className="min-h-screen text-white select-none relative overflow-x-hidden pb-24 font-sans bg-black"
      dir="rtl"
    >
      {/* 0. Full Exact Background Wallpaper (Golden Eagles & Glowing Light Trails) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <img
          src="/src/assets/images/wealth_screen_bg_1790554652978.jpg"
          alt="خلفية الثروة"
          className="w-full h-full object-cover max-w-[480px]"
        />
        {/* Subtle vignette so eagles and background artwork shine through cleanly */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 1. Clean Top Header: Return Button + Centered Title Text (No Box, No Quick Support Button) */}
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
          تصنيف الثروة
        </h1>

        {/* Empty placeholder to balance layout */}
        <div className="w-9" />
      </header>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black font-black text-xs px-4 py-2 rounded-full shadow-2xl border border-white flex items-center gap-1.5 animate-bounce">
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
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black shadow-md'
                    : 'text-amber-200/80 hover:text-white'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PODIUM (Clean Pure Circles + Names + Values directly over the Golden Eagles Wallpaper - No Box Grids, No Crowns) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 items-end gap-2 pt-2">
          {/* ===================== TOP 2 (Right in RTL / Silver) ===================== */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Pure Circular Avatar with Silver Ring */}
              <div className="w-18 h-18 rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500 shadow-[0_0_20px_rgba(203,213,225,0.7)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  {top2 ? (
                    <img src={top2.avatar} onError={(e) => setImageFallback(e, '/src/assets/images/default_arab_user_avatar_1790806239365.jpg')} alt={top2.name} className="w-full h-full object-cover" />
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
              <div className="mt-1 text-[11px] font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top2 ? top2.score.toLocaleString() : '0'}</span>
                <span>🪙</span>
              </div>
            </div>
          </div>

          {/* ===================== TOP 1 (Center / Gold) ===================== */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative">
              {/* Pure Circular Avatar with Radiant Gold Ring */}
              <div className="w-22 h-22 rounded-full p-1.5 bg-gradient-to-tr from-amber-600 via-yellow-200 to-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.9)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center border-2 border-amber-300">
                  {top1 ? (
                    <img src={top1.avatar} onError={(e) => setImageFallback(e, '/src/assets/images/default_arab_user_avatar_1790806239365.jpg')} alt={top1.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-amber-500/50">👤</span>
                  )}
                </div>
              </div>
              {/* Badge */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-black font-black text-[10px] shadow-lg border border-amber-200">
                TOP 1
              </span>
            </div>

            {/* Name below avatar */}
            <div className="mt-4 text-center w-full px-1">
              <div className="text-sm font-black text-amber-200 truncate drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
                {top1 ? top1.name : 'بانتظار المتصدر'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-xs font-black text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top1 ? top1.score.toLocaleString() : '0'}</span>
                <span>🪙</span>
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
                    <img src={top3.avatar} onError={(e) => setImageFallback(e, '/src/assets/images/default_arab_user_avatar_1790806239365.jpg')} alt={top3.name} className="w-full h-full object-cover" />
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
              <div className="text-xs font-black text-amber-200 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {top3 ? top3.name : 'شاغر'}
              </div>
              {/* Value below name */}
              <div className="mt-1 text-[11px] font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                <span>{top3 ? top3.score.toLocaleString() : '0'}</span>
                <span>🪙</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LEADERBOARD LIST (TOP 4 TO 10 - Sleek Glass Rows directly over the wallpaper) */}
      <div className="relative z-10 max-w-md mx-auto px-4 mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 text-[11px] font-black text-amber-300/90 drop-shadow">
          <span>قائمة شرف الداعمين (4 - 10)</span>
          <span>قيمة الدعم 🪙</span>
        </div>

        {Array.from({ length: 7 }).map((_, i) => {
          const rankNum = i + 4;
          const entry = otherRanks[i];
          const isSilver = rankNum % 2 !== 0;

          return (
            <div
              key={rankNum}
              className={`flex items-center justify-between py-2 px-3 rounded-2xl border backdrop-blur-xs transition-all ${
                entry?.id === user.id
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-black/50 border-amber-500/20 hover:border-amber-500/40 shadow-md'
              }`}
            >
              {/* Rank Badge + Circle Avatar + Name */}
              <div className="flex items-center gap-3">
                {/* Clean Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-md border ${
                    rankNum === 4
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-black border-yellow-200'
                      : isSilver
                      ? 'bg-gradient-to-b from-slate-300 to-slate-500 text-black border-white'
                      : 'bg-gradient-to-b from-amber-600 to-yellow-600 text-white border-amber-300'
                  }`}
                >
                  {rankNum}
                </div>

                {/* Circle Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/70 bg-black shrink-0 shadow-md">
                  {entry ? (
                    <img src={entry.avatar} onError={(e) => setImageFallback(e, '/src/assets/images/default_arab_user_avatar_1790806239365.jpg')} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                      👤
                    </div>
                  )}
                </div>

                {/* Name & ID */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-100 max-w-[130px] truncate drop-shadow">
                      {entry ? entry.name : 'مقعد شاغر'}
                    </span>
                    {entry && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black">
                        Lv.{entry.wealthLevel}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {entry ? `ID: ${entry.idNumber}` : 'ارمي دعم لتتصدر'}
                  </span>
                </div>
              </div>

              {/* Value directly on right */}
              <div className="text-xs font-black text-amber-300 drop-shadow flex items-center gap-1">
                <span>{entry ? entry.score.toLocaleString() : '0'}</span>
                <span>🪙</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Sticky Bottom Bar: My Real Ranking & Direct Support Action */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/85 border-t border-amber-500/40 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={user.avatar} onError={(e) => setImageFallback(e, '/src/assets/images/default_arab_user_avatar_1790806239365.jpg')}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white">
                {myEntry ? `#${myEntry.rank}` : 'غير مصنف'}
              </span>
            </div>
            <div>
              <div className="text-xs font-black text-amber-200 flex items-center gap-1">
                <span>{user.name}</span>
                <span className="text-[9px] text-amber-400">(حسابك)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                مجموع دعمك:{' '}
                <span className="text-amber-400 font-black">
                  {myEntry ? myEntry.score.toLocaleString() : '0'} 🪙
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSupport(selectedAmount)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>ادعم الآن</span>
            <span>+{selectedAmount.toLocaleString()}</span>
            <span>🪙</span>
          </button>
        </div>
      </div>

      {/* 6. Quick Support Modal */}
      {showQuickSupport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1f1305] via-zinc-950 to-black border border-amber-500/60 rounded-3xl w-full max-w-sm p-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 mx-auto mb-2 text-2xl">
              🎁
            </div>
            <h3 className="text-base font-black text-amber-300">إرسال دعم ورفع الترتيب</h3>
            <p className="text-xs text-amber-100/70 mt-1">
              اختر قيمة الذهب المراد دعمه ليرتفع حسابك مباشرة من المركز العاشر وصولاً للمركز الأول:
            </p>

            {/* Preset amounts */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {[10000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    selectedAmount === amt
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-white shadow-lg scale-105'
                      : 'bg-black/60 text-amber-200 border-amber-500/30 hover:bg-zinc-800'
                  }`}
                >
                  {amt.toLocaleString()} 🪙
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSupport(selectedAmount)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              تأكيد الدعم وإظهار حسابي في التوب 🚀
            </button>

            <button
              onClick={() => setShowQuickSupport(false)}
              className="mt-3 text-xs text-slate-400 hover:text-white block mx-auto cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
