import React from 'react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { UserAvatar } from '../common/UserAvatar';
import { ChevronRight, Zap, Award, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export const LevelScreen: React.FC = () => {
  const { user, setActiveSubScreen } = useApp();

  const currentLevel = user.level;
  const currentXP = 14800;
  const nextLevelXP = 20000;
  const progressPercent = Math.round((currentXP / nextLevelXP) * 100);

  // Visual tiers from Level 1 up to high levels
  const levelTiers = [
    {
      level: 1,
      title: 'مستوى المبتدئ البرونزي',
      xpRange: '0 - 1,000 XP',
      color: 'from-amber-800 to-amber-950',
      borderColor: 'border-amber-700/40',
      badgeColor: 'from-slate-700 to-slate-500',
      perk: 'فتح الدردشة في الغرف العامة وإرسال الإيموجيات',
    },
    {
      level: 2,
      title: 'مستوى المتحدث النشط',
      xpRange: '1,000 - 3,000 XP',
      color: 'from-emerald-900 to-slate-900',
      borderColor: 'border-emerald-600/40',
      badgeColor: 'from-emerald-600 to-teal-400',
      perk: 'إمكانية رفع اليد لطلب المايك في الرومات الكبيرة',
    },
    {
      level: 3,
      title: 'مستوى الصاعد الفضي',
      xpRange: '3,000 - 6,000 XP',
      color: 'from-blue-950 to-slate-900',
      borderColor: 'border-blue-500/40',
      badgeColor: 'from-blue-600 to-cyan-400',
      perk: 'إمكانية إرسال الرسائل الصوتية في الخاص',
    },
    {
      level: 4,
      title: 'مستوى المتألق الذهبي',
      xpRange: '6,000 - 10,000 XP',
      color: 'from-purple-950 to-slate-900',
      borderColor: 'border-purple-500/40',
      badgeColor: 'from-purple-600 to-pink-500',
      perk: 'إطار متألق متحرك حول الصورة الرمزية',
    },
    {
      level: 5,
      title: 'مستوى النجم الماسي',
      xpRange: '10,000 - 15,000 XP',
      color: 'from-indigo-950 to-slate-900',
      borderColor: 'border-indigo-500/40',
      badgeColor: 'from-indigo-600 to-blue-400',
      perk: 'إمكانية إنشاء غرف صوتية مخصصة حتى 10 مقاعد',
    },
    {
      level: 6,
      title: 'مستوى الأسطورة الياقوتي',
      xpRange: '15,000 - 25,000 XP',
      color: 'from-rose-950 to-slate-900',
      borderColor: 'border-rose-500/40',
      badgeColor: 'from-rose-600 to-amber-500',
      perk: 'أولوية الظهور في الصفحة الأولى ومكافآت مضاعفة',
    },
    {
      level: 7,
      title: 'مستوى التيجان والملوك',
      xpRange: '25,000 - 50,000 XP',
      color: 'from-amber-950 to-slate-900',
      borderColor: 'border-amber-500/40',
      badgeColor: 'from-amber-500 to-yellow-300',
      perk: 'تاج مستوى مخصص وتأثير دخول خاص في كل الرومات',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
          >
            <ChevronRight size={22} />
          </button>
          <h1 className="text-base font-bold text-slate-100">نظام المستويات والخبرة</h1>
        </div>

        <LevelBadge level={currentLevel} size="md" showIcon />
      </header>

      {/* Hero Level Banner Card */}
      <div className="p-4">
        <div className="relative rounded-3xl bg-gradient-to-tr from-purple-950 via-[#181a38] to-indigo-950 border border-purple-500/30 p-5 shadow-2xl overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />

          {/* Avatar with level badge */}
          <div className="flex justify-center mb-3">
            <UserAvatar user={user} size="xl" showVIP />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-white">مستواي الحالي: Lv. {currentLevel}</h2>
          </div>

          <span className="text-xs text-purple-300 block mb-4">
            تفاعل في الغرف الصوتية وأرسل الهدايا لاكتساب نقاط الخبرة (XP)
          </span>

          {/* XP Progress Card */}
          <div className="bg-[#0e1022]/80 border border-purple-500/20 rounded-2xl p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">التقدم نحو Lv. {currentLevel + 1}</span>
              <span className="font-bold text-amber-400 font-mono">
                {currentXP.toLocaleString('ar-SA')} / {nextLevelXP.toLocaleString('ar-SA')} XP
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-900 border border-purple-500/20 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>متبقي {(nextLevelXP - currentXP).toLocaleString('ar-SA')} XP للترقية</span>
              <span className="text-purple-300 font-bold">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Tiers List */}
      <div className="px-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Award size={16} className="text-amber-400" />
          <span>المستويات ومميزات كل مستوى:</span>
        </h3>

        {levelTiers.map((tier) => {
          const isCurrentTier = currentLevel >= tier.level * 6 - 5 && currentLevel <= tier.level * 6;
          const isUnlocked = currentLevel >= tier.level * 6 - 5;

          return (
            <div
              key={tier.level}
              className={`p-3.5 rounded-2xl bg-gradient-to-r ${tier.color} border ${
                tier.borderColor
              } transition-all relative overflow-hidden ${
                isCurrentTier ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-950/40' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tier.badgeColor} flex flex-col items-center justify-center font-bold text-white shadow-md`}
                  >
                    <span className="text-[10px] uppercase font-mono">Level</span>
                    <span className="text-sm font-extrabold">{tier.level}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{tier.title}</h4>
                      {isCurrentTier && (
                        <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.2 rounded-full">
                          مستواك الحالي
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {tier.xpRange}
                    </span>
                  </div>
                </div>

                <div>
                  {isUnlocked ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Lock size={16} className="text-slate-500" />
                  )}
                </div>
              </div>

              {/* Perk text */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 text-xs text-purple-200">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span>{tier.perk}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
