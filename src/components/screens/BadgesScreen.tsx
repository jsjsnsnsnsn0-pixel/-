import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Plus, X, Check, Award, Sparkles } from 'lucide-react';
import {
  MillionaireMedal,
  GiftGiverMedal,
  GiftReceiverMedal,
  CharmStarMedal,
  WealthRubyMedal,
  WorldStarMedal,
  EidAdhaMedal,
  MemberAMedal,
  Top3MemberMedal,
  RoomTop3Medal,
  CharmTop3Medal,
  MonthlyWealthMedal,
  CpTop3Medal,
  WeeklyStarMedal,
} from '../common/MedalIcons';

export interface MedalDetail {
  id: string;
  name: string;
  shortName: string;
  category: 'achievements' | 'activity';
  ribbon: string;
  description: string;
  isUnlocked: boolean;
  component: React.ReactNode;
}

export const BadgesScreen: React.FC = () => {
  const { setActiveSubScreen } = useApp();
  const scheduleTimeout = useTimeouts();
  const [topTab, setTopTab] = useState<'medals' | 'titles'>('medals');
  const [subTab, setSubTab] = useState<'achievements' | 'activity'>('achievements');
  const [selectedMedal, setSelectedMedal] = useState<MedalDetail | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Equipped medals in top shelf (Initial 5 matching Screenshot 1)
  const [equippedMedals, setEquippedMedals] = useState<string[]>([
    'charm_star',
    'wealth_ruby',
    'gift_receiver',
    'gift_giver',
    'millionaire',
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    scheduleTimeout(() => setToast(null), 2500);
  };

  // All Achievement Medals (الإنجازات)
  const achievementMedals: MedalDetail[] = [
    {
      id: 'millionaire',
      name: 'مليونير',
      shortName: 'مليونير',
      category: 'achievements',
      ribbon: '10M',
      description: 'تم إرسال أو شحن ما يزيد عن 10,000,000 عملة داخل التطبيق',
      isUnlocked: true,
      component: <MillionaireMedal size={68} />,
    },
    {
      id: 'gift_giver',
      name: 'نجم منح الهدايا',
      shortName: 'نجم منح الهدايا',
      category: 'achievements',
      ribbon: '5M',
      description: 'منح هدايا سخية للأصدقاء بقيمة تتجاوز 5,000,000 عملة ذهبية',
      isUnlocked: true,
      component: <GiftGiverMedal size={68} />,
    },
    {
      id: 'gift_receiver',
      name: 'نجم تلقي الهدايا',
      shortName: 'نجم تلقي الهدايا',
      category: 'achievements',
      ribbon: '5M',
      description: 'تلقي دعم وهدايا رائعة في غرف المحادثة والاحتفالات بقيمة 5M',
      isUnlocked: true,
      component: <GiftReceiverMedal size={68} />,
    },
    {
      id: 'charm_star',
      name: 'نجم الجاذبية',
      shortName: 'نجم الجاذبية',
      category: 'achievements',
      ribbon: 'LV.20',
      description: 'الوصول إلى مستوى الجاذبية والأناقة الملكية LV.20 فما فوق',
      isUnlocked: true,
      component: <CharmStarMedal size={68} />,
    },
    {
      id: 'wealth_ruby',
      name: 'ياقوت الثروة',
      shortName: 'ياقوت الثروة',
      category: 'achievements',
      ribbon: 'LV.40',
      description: 'الوصول إلى مستوى الثروة والريادة الماسية LV.40 فما فوق',
      isUnlocked: true,
      component: <WealthRubyMedal size={68} />,
    },
  ];

  // All Activity Medals (النشاط - TOP3 Platinum Badges)
  const activityMedals: MedalDetail[] = [
    {
      id: 'world_star',
      name: 'النجم العالمي TOP3',
      shortName: 'النجم العالمي T...',
      category: 'activity',
      ribbon: 'الدولة TOP3',
      description: 'تحقيق المركز الثالث في تصنيف نجوم الدولة العالمي',
      isUnlocked: true,
      component: <WorldStarMedal size={68} />,
    },
    {
      id: 'eid_adha',
      name: 'عيد الأضحى TOP3',
      shortName: 'عيد الأضحى T0...',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'الفوز بالمراكز الثلاثة الأولى في فعالية عيد الأضحى المبارك',
      isUnlocked: true,
      component: <EidAdhaMedal size={68} />,
    },
    {
      id: 'member_a',
      name: 'عضو A',
      shortName: 'A عضو',
      category: 'activity',
      ribbon: 'عضو A',
      description: 'وسام العضوية المعتمدة الفخرية A في مجتمع توتي شات',
      isUnlocked: true,
      component: <MemberAMedal size={68} />,
    },
    {
      id: 'top3_member',
      name: 'TOP3 عضو',
      shortName: 'TOP3 عضو',
      category: 'activity',
      ribbon: 'عضو TOP3',
      description: 'وسام الصدارة لأبرز أعضاء الغرف التفاعلية',
      isUnlocked: true,
      component: <Top3MemberMedal size={68} />,
    },
    {
      id: 'room_top3',
      name: 'الغرفة TOP3',
      shortName: 'الغرفة TOP3',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'وصول الغرفة إلى أفضل 3 غرف في المنافسات الأسبوعية',
      isUnlocked: true,
      component: <RoomTop3Medal size={68} />,
    },
    {
      id: 'charm_top3',
      name: 'الجاذبية TOP3',
      shortName: 'الجاذبية TOP3',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'تحقيق المرتبة الثالثة في تصنيف الجاذبية الأسبوعي',
      isUnlocked: true,
      component: <CharmTop3Medal size={68} />,
    },
    {
      id: 'monthly_wealth',
      name: 'الثروة الشهرية TOP3',
      shortName: 'الثروة الشهرية T...',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'كأس التميز في قائمة كبار داعمي الشهر',
      isUnlocked: true,
      component: <MonthlyWealthMedal size={68} />,
    },
    {
      id: 'cp_top3',
      name: 'CP TOP3',
      shortName: 'CP TOP3',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'أفضل 3 علاقات ثنائية CP في لوحة الشرف الملكية',
      isUnlocked: true,
      component: <CpTop3Medal size={68} />,
    },
    {
      id: 'weekly_star',
      name: 'النجم الأسبوعي TOP3',
      shortName: 'النجم الأسبوعي...',
      category: 'activity',
      ribbon: 'TOP3',
      description: 'وسام نجم الأسبوع في النشاط والتفاعل الصوتي المستمر',
      isUnlocked: true,
      component: <WeeklyStarMedal size={68} />,
    },
  ];

  const allMedals = [...achievementMedals, ...activityMedals];

  const toggleEquipMedal = (medalId: string) => {
    if (equippedMedals.includes(medalId)) {
      setEquippedMedals((prev) => prev.filter((id) => id !== medalId));
      showToast('تم إغلاق معاينة الميدالية.');
    } else {
      if (equippedMedals.length >= 10) {
        showToast('تم بلوغ الحد الأقصى للميداليات المعروضة (10)');
        return;
      }
      setEquippedMedals((prev) => [...prev, medalId]);
      showToast('هذه معاينة للميدالية في هذه الشاشة فقط.');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 pb-20 select-none font-sans relative overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 inset-x-4 z-50 flex items-center justify-center animate-in fade-in slide-in-from-top duration-300">
          <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs shadow-xl border border-amber-300 flex items-center gap-2">
            <span>✨</span>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER matching Screenshot 1 & 2 */}
      <header className="px-4 py-3 flex items-center justify-between z-20 bg-[#0a0a0f] border-b border-white/5">
        {/* Right back button */}
        <button
          onClick={() => setActiveSubScreen(null)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/90 cursor-pointer active:scale-95"
          title="رجوع"
        >
          <ChevronRight size={22} className="stroke-[2.5]" />
        </button>

        {/* Center Tabs: ميدالية | اللقب */}
        <div className="flex items-center gap-8 text-sm font-bold">
          <button
            onClick={() => setTopTab('medals')}
            className={`relative py-1 cursor-pointer transition-colors ${
              topTab === 'medals' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>ميدالية</span>
            {topTab === 'medals' && (
              <span className="absolute -bottom-1 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setTopTab('titles')}
            className={`relative py-1 cursor-pointer transition-colors ${
              topTab === 'titles' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>اللقب</span>
            {topTab === 'titles' && (
              <span className="absolute -bottom-1 inset-x-0 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Left balance placeholder */}
        <div className="w-8" />
      </header>

      {topTab === 'titles' ? (
        /* Titles Tab Placeholder */
        <div className="p-8 text-center text-slate-400 text-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto text-2xl">
            👑
          </div>
          <h3 className="text-sm font-bold text-white">الألقاب الملكية</h3>
          <p className="max-w-xs mx-auto leading-relaxed">
            اللقب الحالي المعتمد: <span className="text-amber-300 font-bold">»xدولة العراق🖤« (ملك الساحة)</span>
          </p>
        </div>
      ) : (
        <>
          {/* 2. TOP DISPLAY STAGE WITH ROTATING WHEEL TROPHY & MEDALS SHELF */}
          <div className="relative w-full pt-4 pb-5 px-4 overflow-hidden bg-gradient-to-b from-[#131008] via-[#0d0d12] to-[#07070a] border-b border-amber-500/20 shadow-2xl">
            {/* Glowing Golden Rhombus Background Effect from screenshot */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-48 h-48 border border-amber-500/30 rotate-45 pointer-events-none opacity-40 shadow-[0_0_50px_rgba(245,158,11,0.2)]" />
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-32 h-32 border border-amber-400/40 rotate-45 pointer-events-none opacity-30" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* Left Column: 3D Rotating Wheel Trophy with Dana Mascot Owl */}
              <div className="w-28 sm:w-32 flex flex-col items-center justify-center shrink-0">
                <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-2xl border-2 border-amber-400/60 bg-black/40 group">
                  <img
                    src="/assets/images/medals_dana_trophy_1790429560560.jpg"
                    alt="Dana Trophy"
                    className="w-full h-full object-cover select-none transform hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle pulsing glow */}
                  <div className="absolute inset-0 ring-2 ring-amber-400/50 rounded-full animate-pulse pointer-events-none" />
                </div>
              </div>

              {/* Right Column: Medals Shelf: "ميدالياتي : X" */}
              <div className="flex-1 text-right flex flex-col items-end">
                <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center gap-1.5 mb-2.5">
                  <span className="text-amber-400 font-sans">ميدالياتي :</span>
                  <span>{equippedMedals.length}</span>
                </h2>

                {/* ROW 1: Equipped Medals displayed horizontally */}
                <div className="flex items-center gap-1.5 flex-row-reverse flex-wrap justify-end">
                  {equippedMedals.slice(0, 5).map((mId) => {
                    const medalObj = allMedals.find((m) => m.id === mId);
                    if (!medalObj) return null;
                    return (
                      <div
                        key={mId}
                        onClick={() => setSelectedMedal(medalObj)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/80 border border-amber-400/60 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all overflow-hidden p-0.5"
                        title={medalObj.name}
                      >
                        <div className="transform scale-[0.55] origin-center">
                          {medalObj.component}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ROW 2: Empty Slots with [+] Buttons matching screenshot */}
                <div className="flex items-center gap-1.5 flex-row-reverse flex-wrap justify-end mt-2">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        showToast('انقر على أي ميدالية بالأسفل لعرضها وارتدائها في المنصة')
                      }
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/60 border border-amber-500/40 text-amber-400/80 hover:text-amber-300 hover:border-amber-400 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-inner"
                      title="خانة فارغة"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. SUB-TABS: [ الإنجازات ]   [ النشاط ] */}
          <div className="px-6 py-4 flex items-center justify-center gap-3">
            {/* Tab 2: النشاط */}
            <button
              onClick={() => setSubTab('activity')}
              className={`px-7 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                subTab === 'activity'
                  ? 'bg-[#1b1c24] text-white border border-amber-400/70 shadow-md scale-105'
                  : 'bg-[#12131a] text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              النشاط
            </button>

            {/* Tab 1: الإنجازات */}
            <button
              onClick={() => setSubTab('achievements')}
              className={`px-7 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                subTab === 'achievements'
                  ? 'bg-[#1b1c24] text-white border border-amber-400/70 shadow-md scale-105'
                  : 'bg-[#12131a] text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              الإنجازات
            </button>
          </div>

          {/* 4. MEDALS GRID (3 Columns matching Screenshot 1 & 2) */}
          <div className="px-4 pb-12">
            <div className="grid grid-cols-3 gap-3">
              {(subTab === 'achievements' ? achievementMedals : activityMedals).map((medal) => {
                const isEquipped = equippedMedals.includes(medal.id);

                return (
                  <div
                    key={medal.id}
                    onClick={() => setSelectedMedal(medal)}
                    className={`relative rounded-2xl p-3 bg-gradient-to-b from-[#13141d] to-[#0c0d14] border hover:border-amber-400/50 flex flex-col items-center justify-between cursor-pointer transition-all duration-200 group active:scale-95 shadow-md ${
                      isEquipped
                        ? 'border-amber-400/60 shadow-[0_4px_16px_rgba(245,158,11,0.15)]'
                        : 'border-white/5'
                    }`}
                  >
                    {/* Equipped Badge Ribbon */}
                    {isEquipped && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-xs animate-ping" />
                    )}

                    {/* Medal Graphic */}
                    <div className="w-16 h-16 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {medal.component}
                    </div>

                    {/* Medal Name */}
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-amber-300 text-center mt-2 truncate w-full">
                      {medal.shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 5. MEDAL DETAIL MODAL */}
      {selectedMedal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#141524] border border-amber-500/50 p-6 shadow-2xl text-right relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMedal(null)}
              className="absolute top-4 left-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center justify-center text-center pt-2 pb-4">
              <div className="w-24 h-24 mb-3 drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]">
                {selectedMedal.component}
              </div>

              <h3 className="text-base font-black text-white">
                {selectedMedal.name}
              </h3>

              <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-[10px] font-bold text-amber-300">
                {selectedMedal.ribbon}
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed px-3">
                {selectedMedal.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-2">
              <button
                onClick={() => {
                  toggleEquipMedal(selectedMedal.id);
                  setSelectedMedal(null);
                }}
                className={`w-full py-2.5 rounded-full font-bold text-xs cursor-pointer transition-all ${
                  equippedMedals.includes(selectedMedal.id)
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-md hover:brightness-105'
                }`}
              >
                {equippedMedals.includes(selectedMedal.id)
                  ? 'إلغاء العرض من الرف العلوي'
                  : 'ارتداء وعرض في المنصة 🏅'}
              </button>

              <button
                onClick={() => setSelectedMedal(null)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
