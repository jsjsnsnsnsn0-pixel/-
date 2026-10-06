import {useDismissableLayer} from '../../hooks/useDismissableLayer';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Palette, Check, X } from 'lucide-react';

export type ShimmerStyleKey =
  | 'quad_luxury'
  | 'gold_shine'
  | 'ruby_red'
  | 'obsidian_black'
  | 'silver_platinum'
  | 'rainbow_sparkle';

export interface ShimmerTheme {
  id: ShimmerStyleKey;
  name: string;
  subtitle: string;
  badgeLabel: string;
  className: string;
  glowColor: string;
  previewGradient: string;
  sparkleColor: string;
}

export const SHIMMER_THEMES: ShimmerTheme[] = [
  {
    id: 'quad_luxury',
    name: 'الرباعي الملكي (ذهبي • أحمر • أسود • فضي)',
    subtitle: 'مزيج فاخر من الذهب والياقوت والأوبسيديان والفضة بلمعان مستمر',
    badgeLabel: 'رباعي أسطوري ✨',
    className: 'shimmer-text-quad',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    previewGradient: 'from-amber-400 via-red-600 via-slate-900 to-slate-200',
    sparkleColor: '#ffd700',
  },
  {
    id: 'gold_shine',
    name: 'الذهب الإمبراطوري 24K',
    subtitle: 'بريق ذهبي خالص يلمع باستمرار كسبائك الذهب الخالص',
    badgeLabel: 'ذهب 24K 👑',
    className: 'shimmer-text-gold',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    previewGradient: 'from-amber-500 via-yellow-300 to-amber-600',
    sparkleColor: '#fef08a',
  },
  {
    id: 'ruby_red',
    name: 'الياقوت الأحمر الساطع',
    subtitle: 'أحمر قرمزي ناري متوهج بأشعة ليزرية مستمرة',
    badgeLabel: 'ياقوت أحمر 💎',
    className: 'shimmer-text-red',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    previewGradient: 'from-rose-600 via-red-500 to-rose-700',
    sparkleColor: '#fca5a5',
  },
  {
    id: 'obsidian_black',
    name: 'الأسود الملكي والأوبسيديان',
    subtitle: 'فخامة الأسود الداكن مع انعكاسات فضية وذهبية مشعة',
    badgeLabel: 'أوبسيديان فخم 🖤',
    className: 'shimmer-text-black',
    glowColor: 'rgba(255, 255, 255, 0.3)',
    previewGradient: 'from-slate-950 via-slate-800 to-slate-600',
    sparkleColor: '#e2e8f0',
  },
  {
    id: 'silver_platinum',
    name: 'الفضة والبلاتين السائل',
    subtitle: 'بريق فضي ساطع ولمعان ألماسي كريستالي دائم الحركة',
    badgeLabel: 'بلاتين فضي ⚪',
    className: 'shimmer-text-silver',
    glowColor: 'rgba(226, 232, 240, 0.7)',
    previewGradient: 'from-slate-300 via-white to-slate-400',
    sparkleColor: '#ffffff',
  },
  {
    id: 'rainbow_sparkle',
    name: 'طيف الماس المتلألئ',
    subtitle: 'ألوان سحرية متحركة تلمع باستمرار كمنشور بلوري',
    badgeLabel: 'طيف متوهج 🌈',
    className: 'shimmer-text-rainbow',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    previewGradient: 'from-rose-500 via-purple-500 via-sky-400 to-amber-400',
    sparkleColor: '#ec4899',
  },
];

interface ShimmeringAccountNameProps {
  name: string;
  vipLevel?: number;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  styleKey?: ShimmerStyleKey;
  showSparkles?: boolean;
  showPaletteButton?: boolean;
  className?: string;
  onClick?: () => void;
}

export const VIP_TO_SHIMMER_MAP: Record<number, ShimmerStyleKey> = {
  1: 'silver_platinum',
  2: 'silver_platinum',
  3: 'gold_shine',
  4: 'gold_shine',
  5: 'ruby_red',
  6: 'ruby_red',
  7: 'obsidian_black',
  8: 'quad_luxury',
  9: 'rainbow_sparkle',
  10: 'rainbow_sparkle',
};

export const ShimmeringAccountName: React.FC<ShimmeringAccountNameProps> = ({
  name,
  vipLevel,
  size = 'md',
  tone = 'light',
  styleKey,
  showSparkles = true,
  showPaletteButton = false,
  className = '',
  onClick,
}) => {
  const { user, setUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const themeRef=useDismissableLayer(isModalOpen,()=>setIsModalOpen(false));

  // Check VIP status:
  // If vipLevel was passed explicitly, use it; otherwise, check if this is the active user
  const effectiveVip = vipLevel !== undefined ? vipLevel : (user.vipLevel || 0);
  const hasVip = Boolean(effectiveVip && effectiveVip > 0);

  // Active theme when user has VIP:
  const vipTheme = hasVip ? VIP_TO_SHIMMER_MAP[effectiveVip] || 'quad_luxury' : undefined;
  const currentKey = styleKey || (hasVip ? (user.nameShimmerStyle || vipTheme) : undefined);
  const activeTheme = currentKey ? SHIMMER_THEMES.find((t) => t.id === currentKey) || SHIMMER_THEMES[0] : null;

  const sizeClasses = {
    sm: 'text-sm font-bold',
    md: 'text-base font-extrabold',
    lg: 'text-lg font-black',
    xl: 'text-xl font-black',
  }[size];

  const handleSelectTheme = (newKey: ShimmerStyleKey) => {
    setUser((prev) => ({
      ...prev,
      nameShimmerStyle: newKey,
    }));
    setIsModalOpen(false);
  };

  // If user has NO VIP:
  // Pure, clean solid black color without any sparkles or special gradients
  if (!hasVip || !activeTheme) {
    return (
      <div className={`min-w-0 max-w-full relative inline-flex items-center ${className}`}>
        <span
          onClick={onClick}
          role={onClick?"button":undefined} tabIndex={onClick?0:undefined} onKeyDown={event=>{if(onClick&&(event.key==="Enter"||event.key===" ")){event.preventDefault();onClick();}}}
          className={`${sizeClasses} min-w-0 break-words ${tone === "dark" ? "text-slate-100" : "text-black"} font-black tracking-tight select-none cursor-pointer transition-transform hover:opacity-85 inline-block`}
          dir="auto"
        >
          {name}
        </span>
      </div>
    );
  }

  // If user HAS VIP:
  // Radiant animated shimmer theme matching their VIP tier with sparkles
  return (
    <>
      <div className={`min-w-0 max-w-full relative inline-flex items-center gap-1.5 ${className}`}>
        {/* Left Twinkling Star Sparkle */}
        {showSparkles && (
          <span
            className="inline-block pointer-events-none text-xs animate-pulse select-none"
            style={{
              animation: 'sparkle-twinkle 2.5s infinite ease-in-out',
              color: activeTheme.sparkleColor,
            }}
          >
            ✨
          </span>
        )}

        {/* The Animated Text with Continuous Color Shimmer */}
        <span
          onClick={onClick}
          role={onClick?"button":undefined} tabIndex={onClick?0:undefined} onKeyDown={event=>{if(onClick&&(event.key==="Enter"||event.key===" ")){event.preventDefault();onClick();}}}
          className={`${sizeClasses} min-w-0 break-words ${activeTheme.className} tracking-tight select-none cursor-pointer transition-transform hover:scale-[1.02] inline-block`}
          dir="auto"
        >
          {name}
        </span>

        {/* Right Shimmer Twinkle */}
        {showSparkles && (
          <span
            className="inline-block pointer-events-none text-xs animate-pulse select-none"
            style={{
              animation: 'sparkle-twinkle 2.8s infinite ease-in-out 0.8s',
              color: activeTheme.sparkleColor,
            }}
          >
            ✦
          </span>
        )}

        {/* Optional Theme Palette Switcher Button */}
        {showPaletteButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="w-5 h-5 rounded-full bg-slate-800/80 border border-amber-400/50 text-amber-300 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer ml-0.5"
            title="تغيير ألوان ولمعان الاسم"
          >
            <Palette size={11} />
          </button>
        )}
      </div>

      {/* Colors & Continuous Shine Customizer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-gradient-to-b from-[#18202f] to-[#0b0f17] text-white rounded-3xl p-5 border border-amber-500/30 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="text-white drop-shadow" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ألوان ولمعان اسم الحساب</h3>
                  <p className="text-[11px] text-amber-300/80">
                    ذهبي • أحمر • أسود • فضي • ألوان تلمع باستمرار حسب VIP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Name Preview Showcase */}
            <div className="my-4 p-4 rounded-2xl bg-[#090d15] border border-amber-500/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              <div className="text-[11px] text-slate-400 mb-1">المعاينة المباشرة لاسمك:</div>
              <div className="py-2">
                <span
                  className={`text-2xl font-black ${activeTheme.className} tracking-wide inline-block`}
                >
                  ✨ {name} ✨
                </span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-semibold">
                <span>النمط النشط:</span>
                <span className="font-bold">{activeTheme.badgeLabel}</span>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300 px-1">
                اختر المظهر واللون المفضل:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {SHIMMER_THEMES.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Gradient preview circle */}
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${theme.previewGradient} flex items-center justify-center shadow-md shrink-0 border border-white/30`}
                        >
                          <span className="text-xs">✨</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">{theme.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            {theme.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Selected checkmark */}
                      <div className="shrink-0 mr-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                            <Check size={14} className="stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              حفظ النمط
            </button>
          </div>
        </div>
      )}
    </>
  );
};
