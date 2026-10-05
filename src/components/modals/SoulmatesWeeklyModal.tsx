import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Sparkles, Plus, Gift as GiftIcon, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerSoulmatesWeeklyWinNotification } from '../../services/systemNotificationService';

interface SoulmatesWeeklyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'rewards' | 'ranking';
type RankTier = 'top1' | 'top2' | 'top3';

export interface CpLeaderboardEntry {
  rank: number;
  cpScore: number;
  user1: {
    name: string;
    avatar: string;
    id: string;
  } | null;
  user2: {
    name: string;
    avatar: string;
    id: string;
  } | null;
}

export const SoulmatesWeeklyModal: React.FC<SoulmatesWeeklyModalProps> = ({ isOpen, onClose }) => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedRank, setSelectedRank] = useState<RankTier>('top1');

  // Dynamic ranking entries stored in localStorage so CP gifts add real data
  const [leaderboard, setLeaderboard] = useState<CpLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('soulmates_cp_leaderboard');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Clean, empty initial state ready to receive real ranking after sending CP gifts
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      cpScore: 0,
      user1: null,
      user2: null,
    }));
  });

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('soulmates_cp_leaderboard');
        if (saved) {
          setLeaderboard(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  if (!isOpen) return null;

  const rankImages: Record<RankTier, { title: string; image: string; tag: string }> = {
    top1: {
      title: 'Top 1 - المركز الأول',
      image: '/assets/images/soulmates_top1_rewards_1790784739419.jpg',
      tag: 'Top 1',
    },
    top2: {
      title: 'Top 2 - المركز الثاني',
      image: '/assets/images/soulmates_top2_rewards_1790784803070.jpg',
      tag: 'Top 2',
    },
    top3: {
      title: 'Top 3 - المركز الثالث',
      image: '/assets/images/soulmates_top3_rewards_1790784825470.jpg',
      tag: 'Top 3',
    },
  };

  const top1Entry = leaderboard[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[96vh] bg-[#220414] border-2 border-[#d4af37] rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.45)] overflow-hidden flex flex-col"
      >
        {/* Top Control Bar */}
        <div className="relative py-2.5 px-4 bg-gradient-to-r from-[#1c0310] via-[#3b0821] to-[#1c0310] border-b border-[#d4af37]/60 flex items-center justify-between z-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-[#d4af37]/50 text-[#f5d77f] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#fce7f3] tracking-wide" dir="rtl">
              💖 رفقاء الروح الاسبوعيه 💖
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Tab Switcher: الرئيسية (نظرة عامة) | الترتيب (TOP 1 - 10) | المكافآت (Top 1 - 3) */}
        <div className="bg-gradient-to-r from-[#18020d] via-[#2c051a] to-[#18020d] px-2 py-2 border-b border-[#d4af37]/40 flex items-center justify-center gap-1.5 shrink-0" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#d946ef] to-[#ec4899] text-white border-white shadow-[0_0_12px_rgba(236,72,153,0.6)] scale-105'
                : 'bg-black/40 text-pink-200 border-[#d4af37]/30 hover:border-[#d4af37]'
            }`}
          >
            الرئيسية
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'ranking'
                ? 'bg-gradient-to-r from-[#e11d48] via-[#be123c] to-[#9f1239] text-white border-amber-300 shadow-[0_0_14px_rgba(225,29,72,0.7)] scale-105'
                : 'bg-black/40 text-rose-200 border-[#d4af37]/30 hover:border-[#d4af37]'
            }`}
          >
            👑 الترتيب (TOP 1 - 10)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('rewards');
              setSelectedRank('top1');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#ca8a04] text-slate-950 border-white shadow-[0_0_14px_rgba(234,179,8,0.7)] scale-105'
                : 'bg-black/40 text-amber-200 border-[#d4af37]/30 hover:border-[#d4af37]'
            }`}
          >
            🏆 المكافآت (Top 1 - 3)
          </button>
        </div>

        {/* Top 1, Top 2, Top 3 Selector Bar (when activeTab is rewards) */}
        {activeTab === 'rewards' && (
          <div className="bg-[#12020a] px-3 py-2 border-b border-[#d4af37]/30 flex items-center justify-center gap-2 shrink-0 animate-fade-in" dir="rtl">
            {(['top1', 'top2', 'top3'] as RankTier[]).map((tier) => {
              const isSelected = selectedRank === tier;
              const labels: Record<RankTier, string> = {
                top1: '🥇 Top 1',
                top2: '🥈 Top 2',
                top3: '🥉 Top 3',
              };

              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedRank(tier)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                    isSelected
                      ? tier === 'top1'
                        ? 'bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white border-amber-300 shadow-[0_0_15px_rgba(225,29,72,0.6)] scale-105'
                        : tier === 'top2'
                        ? 'bg-gradient-to-r from-[#9333ea] to-[#7e22ce] text-white border-cyan-300 shadow-[0_0_15px_rgba(147,51,234,0.6)] scale-105'
                        : 'bg-gradient-to-r from-[#c2410c] to-[#9a3412] text-white border-amber-400 shadow-[0_0_15px_rgba(194,65,12,0.6)] scale-105'
                      : 'bg-black/50 text-slate-300 border-[#d4af37]/30 hover:border-[#d4af37]'
                  }`}
                >
                  {labels[tier]}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 bg-black flex flex-col items-center p-1 sm:p-2 scrollbar-thin scrollbar-thumb-pink-600/40">
          {activeTab === 'overview' ? (
            /* Main Overview Image with interactive hotspots on "المكافآت" and "الترتيب" */
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full max-w-[440px]">
                <img
                  src="/assets/images/soulmates_weekly_user_image_1790784401660.jpg"
                  alt="رفقاء الروح الاسبوعيه"
                  className="w-full h-auto object-contain rounded-2xl border border-[#d4af37]/50 shadow-2xl"
                />

                {/* Hotspot 1: Middle "المكافآت" button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('rewards');
                    setSelectedRank('top1');
                  }}
                  className="absolute top-[32%] left-[18%] w-[28%] h-[6%] rounded-full cursor-pointer hover:bg-white/20 active:scale-95 transition-all border border-amber-300/40 bg-pink-500/10"
                  title="عرض مكافآت توب 1 حتى توب 3"
                >
                  <span className="sr-only">المكافآت</span>
                </button>

                {/* Hotspot 2: Middle "الترتيب" button -> Shows Leaderboard */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className="absolute top-[32%] right-[18%] w-[28%] h-[6%] rounded-full cursor-pointer hover:bg-white/20 active:scale-95 transition-all border border-amber-300/40 bg-pink-500/10"
                  title="عرض قائمة الترتيب"
                >
                  <span className="sr-only">الترتيب</span>
                </button>

                {/* Hotspot 3: Bottom "المكافآت" button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('rewards');
                    setSelectedRank('top1');
                  }}
                  className="absolute bottom-[10.5%] left-[5%] w-[30%] h-[7%] rounded-2xl cursor-pointer hover:bg-white/20 active:scale-95 transition-all border border-amber-300/40 bg-pink-500/10"
                  title="عرض مكافآت توب 1 حتى توب 3"
                >
                  <span className="sr-only">المكافآت</span>
                </button>

                {/* Hotspot 4: Bottom "الترتيب" button -> Shows Leaderboard */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className="absolute bottom-[10.5%] right-[5%] w-[30%] h-[7%] rounded-2xl cursor-pointer hover:bg-white/20 active:scale-95 transition-all border border-amber-300/40 bg-pink-500/10"
                  title="عرض قائمة الترتيب"
                >
                  <span className="sr-only">الترتيب</span>
                </button>
              </div>

              {/* Direct Quick-Access Action Buttons Below Image */}
              <div className="mt-3 w-full max-w-[440px] px-2 flex flex-col gap-2" dir="rtl">
                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#e11d48] via-[#be123c] to-[#881337] border-2 border-amber-300 text-white font-black text-sm shadow-[0_0_20px_rgba(225,29,72,0.6)] flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>👑</span>
                    <span>اضغط هنا لعرض جدول الترتيب (TOP 1 - 10)</span>
                  </span>
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('rewards');
                    setSelectedRank('top1');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] border-2 border-amber-200 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>🏆</span>
                    <span>اضغط هنا لعرض تفاصيل المكافآت (Top 1 إلى Top 3)</span>
                  </span>
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
          ) : activeTab === 'ranking' ? (
            /* Ranking Leaderboard Screen: تصاعدي حتى رقم 10 بنفس التصميم الملكي طبق الأصل */
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="relative w-full max-w-[440px] select-none">
                <img
                  src="/assets/images/soulmates_ranks_1_to_10_poster_1790800855277.jpg"
                  alt="ترتيب رفقاء الروح الاسبوعيه من 1 إلى 10"
                  className="w-full h-auto object-contain rounded-2xl border border-[#d4af37]/60 shadow-2xl block"
                />
              </div>

              {/* Bottom Quick Switch Bar */}
              <div className="mt-3 w-full max-w-[440px] px-2 flex flex-col gap-2" dir="rtl">
                {/* Claim Top 1 Winner Celebration Button */}
                <button
                  type="button"
                  onClick={() => {
                    alert('مكافآت الأسبوع تحتاج اعتماد النتائج الفعلية من الخادم. لم تُمنح مكافأة.');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 text-xs font-black border-2 border-white hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
                >
                  <Trophy size={16} />
                  <span>تتويج نهاية الأسبوع واستلام مكافأة المرتبة الأولى (السيبي Top 1)</span>
                  <Sparkles size={16} />
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="py-2 px-3 rounded-xl bg-black/60 border border-pink-400/50 text-pink-200 text-xs font-bold hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
                  >
                    ↩ الرئيسية
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('rewards');
                      setSelectedRank('top1');
                    }}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black border border-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    🏆 عرض المكافآت (Top 1-3)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rewards Tab with Top 1, Top 2, Top 3 */
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="relative w-full max-w-[440px]">
                <img
                  src={rankImages[selectedRank].image}
                  alt={rankImages[selectedRank].title}
                  className="w-full h-auto object-contain rounded-2xl border border-[#d4af37]/60 shadow-2xl"
                />

                {/* Floating Navigation Controls */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRank === 'top3') setSelectedRank('top2');
                      else if (selectedRank === 'top2') setSelectedRank('top1');
                    }}
                    disabled={selectedRank === 'top1'}
                    className={`w-9 h-9 rounded-full bg-black/70 border border-amber-300 text-amber-200 flex items-center justify-center transition-all pointer-events-auto cursor-pointer shadow-lg active:scale-90 ${
                      selectedRank === 'top1' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/90'
                    }`}
                    title="السابق"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="px-3 py-1 rounded-full bg-black/80 border border-amber-300 text-amber-300 text-xs font-black shadow-md">
                    {rankImages[selectedRank].tag}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRank === 'top1') setSelectedRank('top2');
                      else if (selectedRank === 'top2') setSelectedRank('top3');
                    }}
                    disabled={selectedRank === 'top3'}
                    className={`w-9 h-9 rounded-full bg-black/70 border border-amber-300 text-amber-200 flex items-center justify-center transition-all pointer-events-auto cursor-pointer shadow-lg active:scale-90 ${
                      selectedRank === 'top3' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/90'
                    }`}
                    title="التالي"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Bottom Quick Switch Bar */}
              <div className="mt-3 w-full max-w-[440px] px-2 flex items-center justify-between gap-2" dir="rtl">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="py-2 px-3 rounded-xl bg-black/60 border border-pink-400/50 text-pink-200 text-xs font-bold hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
                >
                  ↩ الرئيسية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ranking')}
                  className="py-2 px-3 rounded-xl bg-rose-950/70 border border-rose-400/50 text-rose-200 text-xs font-bold hover:bg-rose-900 active:scale-95 transition-all cursor-pointer"
                >
                  👑 عرض الترتيب
                </button>

                <div className="flex items-center gap-1.5">
                  {(['top1', 'top2', 'top3'] as RankTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedRank(tier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                        selectedRank === tier
                          ? 'bg-amber-400 text-black border-white shadow-md scale-105'
                          : 'bg-black/60 text-slate-300 border-white/20 hover:border-white/50'
                      }`}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
