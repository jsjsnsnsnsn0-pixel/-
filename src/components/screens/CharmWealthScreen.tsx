import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight } from 'lucide-react';
import { WealthBadgeExact, CharmBadgeExact } from '../common/LevelIcons';

interface CharmWealthScreenProps {
  initialTab?: 'wealth' | 'charm';
}

export const CharmWealthScreen: React.FC<CharmWealthScreenProps> = ({ initialTab = 'wealth' }) => {
  const { user, setActiveSubScreen } = useApp();
  const [activeTab, setActiveTab] = useState<'wealth' | 'charm'>(initialTab);

  const isWealth = activeTab === 'wealth';

  // Wealth tiers: Extended up to Level 150 with magnificent higher-tier crests
  const wealthTiers = [
    { range: '1-9', tier: 1, num: 1 },
    { range: '10-19', tier: 10, num: 10 },
    { range: '20-29', tier: 20, num: 20 },
    { range: '30-39', tier: 30, num: 30 },
    { range: '40-49', tier: 40, num: 40 },
    { range: '50-59', tier: 50, num: 50 },
    { range: '60-69', tier: 60, num: 60 },
    { range: '70-79', tier: 70, num: 70 },
    { range: '80-89', tier: 80, num: 80 },
    { range: '90-99', tier: 90, num: 90 },
    { range: '100-109', tier: 100, num: 100 },
    { range: '110-119', tier: 110, num: 110 },
    { range: '120-129', tier: 120, num: 120 },
    { range: '130-139', tier: 130, num: 130 },
    { range: '140-149', tier: 140, num: 140 },
    { range: '150', tier: 150, num: 150 },
  ];

  // Charm / Magic tiers: Extended up to Level 110 with celestial diamond angel heart
  const charmTiers = [
    { range: '1-9', tier: 1, num: 1 },
    { range: '10-19', tier: 10, num: 10 },
    { range: '20-29', tier: 20, num: 20 },
    { range: '30-39', tier: 30, num: 30 },
    { range: '40-49', tier: 40, num: 40 },
    { range: '50-59', tier: 50, num: 50 },
    { range: '60-69', tier: 60, num: 60 },
    { range: '70-79', tier: 70, num: 70 },
    { range: '80-89', tier: 80, num: 80 },
    { range: '90-99', tier: 90, num: 90 },
    { range: '100-109', tier: 100, num: 100 },
    { range: '110', tier: 110, num: 110 },
  ];

  const maxLvl = isWealth ? 150 : 110;
  const rank = isWealth ? user.wealthLevel : user.charmLevel;
  const currentLevel = rank ?? 0;
  const isMax = currentLevel >= maxLvl;
  const nextLevel = isMax ? 'MAX 👑' : currentLevel + 1;

  // Arabesque Damask floral wallpaper SVG background pattern
  const damaskGold = `radial-gradient(circle at 50% 10%, rgba(217,119,6,0.18) 0%, rgba(15,12,7,0.98) 55%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='0.12' fill-rule='evenodd'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm10-20c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm0 40c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z'/%3E%3C/g%3E%3C/svg%3E")`;
  const damaskPurple = `radial-gradient(circle at 50% 10%, rgba(168,85,247,0.25) 0%, rgba(18,2,23,0.98) 55%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c084fc' fill-opacity='0.14' fill-rule='evenodd'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm10-20c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm0 40c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z'/%3E%3C/g%3E%3C/svg%3E")`;

  if(rank===undefined)return <div dir="rtl" className="min-h-screen bg-[#100b20] text-white p-5"><button type="button" onClick={()=>setActiveSubScreen(null)} className="p-3 rounded-xl bg-white/5">الرجوع</button><p className="py-8 text-slate-300">مستوى {isWealth?'الثروة':'السحر'} غير متاح من الخادم حالياً.</p></div>;
  return (
    <div
      className={`min-h-screen pb-16 select-none transition-colors duration-300 ${
        isWealth ? 'bg-[#0f0c07] text-[#f7e6cb]' : 'bg-[#120217] text-[#f7d6fb]'
      }`}
      style={{
        backgroundImage: isWealth ? damaskGold : damaskPurple,
      }}
    >
      {/* MAGENTA HORIZON GLOW (Visible in Screenshot 2 under the header) */}
      {!isWealth && (
        <div className="absolute top-16 inset-x-0 h-10 bg-gradient-to-b from-fuchsia-600/30 to-transparent pointer-events-none" />
      )}

      {/* TOP HEADER: Back button on Right, Tabs: مستوى السحر | مستوى الثروة */}
      <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between">
        {/* Left spacer for optical balance */}
        <div className="w-10" />

        {/* Center Tabs: مستوى السحر (left) | مستوى الثروة (right) */}
        <div className="flex items-center gap-6">
          {/* مستوى السحر (Left Tab) */}
          <button
            type="button"
            onClick={() => setActiveTab('charm')}
            className={`text-base transition-all cursor-pointer font-bold ${
              !isWealth
                ? 'text-white font-black'
                : 'text-[#9c8973] hover:text-[#d3c2ab]'
            }`}
          >
            مستوى السحر
          </button>

          {/* مستوى الثروة (Right Tab) */}
          <button
            type="button"
            onClick={() => setActiveTab('wealth')}
            className={`text-base transition-all cursor-pointer font-bold ${
              isWealth
                ? 'text-white font-black'
                : 'text-[#99659f] hover:text-[#d4a8da]'
            }`}
          >
            مستوى الثروة
          </button>
        </div>

        {/* Circular Back Button on Right: black circle with white chevron */}
        <button
          type="button"
          onClick={() => setActiveSubScreen(null)}
          className="w-10 h-10 rounded-full bg-black/75 hover:bg-black border border-white/10 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-md"
          title="رجوع"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>
      </header>

      {/* PROGRESS CARD (Rounded dark container with next level on left and current level on right) */}
      <div className="px-4 mt-3">
        <div
          className={`px-4 py-2.5 rounded-2xl border ${
            isWealth
              ? 'bg-[#18130a]/85 border-[#3d3322]'
              : 'bg-[#1d0325]/85 border-[#4e1c5c]'
          } shadow-inner flex flex-col justify-center`}
        >
          {/* Gray Track Bar with luminous dynamic fill */}
          <div className="w-full h-2 rounded-full bg-[#332a1e] overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                isWealth
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-200'
                  : 'bg-gradient-to-r from-purple-500 via-pink-400 to-rose-300'
              } ${isMax ? 'w-full shadow-[0_0_10px_rgba(250,204,21,0.85)]' : 'w-3/5'}`}
            />
          </div>

          {/* Labels: Lv. (Next / MAX) on Left | Lv. (Current) on Right */}
          <div className="flex items-center justify-between font-mono text-xs font-bold text-white px-0.5">
            <span>{isMax ? 'Lv. MAX 👑' : `Lv. ${nextLevel}`}</span>
            <span>Lv. {currentLevel}</span>
          </div>
        </div>
      </div>

      {/* MAIN TABLE (Matching Screenshot 1 for Wealth and Screenshot 2 for Charm) */}
      <div className="mt-4 px-3">
        {/* ============================================================== */}
        {/* 1. WEALTH TABLE (3 COLUMNS: دخول | رمز | مستوى)               */}
        {/* ============================================================== */}
        {isWealth && (
          <div className="w-full">
            {/* Table Header Row */}
            <div className="grid grid-cols-12 py-2.5 px-2 border-b border-[#2d220f] text-sm font-bold text-[#c9b497] select-none text-center">
              {/* Left Column: دخول */}
              <div className="col-span-3">دخول</div>

              {/* Center Column: رمز */}
              <div className="col-span-6">رمز</div>

              {/* Right Column: مستوى */}
              <div className="col-span-3">مستوى</div>
            </div>

            {/* Table Rows: Extended up to Level 150 */}
            <div className="divide-y divide-[#21180a]/80">
              {wealthTiers.map((t) => (
                <div
                  key={t.range}
                  className="grid grid-cols-12 items-center py-2.5 px-2 text-center"
                >
                  {/* Left Column: دخول (Displays --) */}
                  <div className="col-span-3 font-mono text-sm text-[#7e6f5c]">
                    --
                  </div>

                  {/* Center Column: رمز (Pill with number on left, Shield on right) */}
                  <div className="col-span-6 flex items-center justify-center">
                    <WealthBadgeExact tier={t.tier} displayLevel={t.num} size="md" />
                  </div>

                  {/* Right Column: مستوى (Level range: 1-9 ... up to 150) */}
                  <div className="col-span-3 font-mono font-bold text-sm text-[#e4d6c4]">
                    {t.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. CHARM / MAGIC TABLE (2 COLUMNS: رمز | مستوى)              */}
        {/* ============================================================== */}
        {!isWealth && (
          <div className="w-full">
            {/* Table Header Row: ONLY TWO COLUMNS (رمز | مستوى) */}
            <div className="grid grid-cols-12 py-2.5 px-4 border-b border-[#360840] text-sm font-bold text-[#cf9dd5] select-none text-center">
              {/* Left Column: رمز */}
              <div className="col-span-6 text-center">رمز</div>

              {/* Right Column: مستوى */}
              <div className="col-span-6 text-center">مستوى</div>
            </div>

            {/* Table Rows: Extended up to Level 110 */}
            <div className="divide-y divide-[#26052d]/80">
              {charmTiers.map((t) => (
                <div
                  key={t.range}
                  className="grid grid-cols-12 items-center py-2.5 px-4 text-center"
                >
                  {/* Left Column: رمز (Pill with number on left, Heart on right) */}
                  <div className="col-span-6 flex items-center justify-center">
                    <CharmBadgeExact tier={t.tier} displayLevel={t.num} size="md" />
                  </div>

                  {/* Right Column: مستوى (Level range: 1-9 ... up to 110) */}
                  <div className="col-span-6 font-mono font-bold text-sm text-[#ecdcf0]">
                    {t.range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
