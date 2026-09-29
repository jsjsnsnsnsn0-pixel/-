import React from 'react';

// 1. VIP SWORD / CREST BADGE ICONS (Vip1 to Vip9)
export const VIPRankIcon: React.FC<{
  tier: number;
  className?: string;
  size?: number;
}> = ({ tier, className = '', size = 52 }) => {
  // Styles and colors according to the 9 screenshots:
  // Vip1: Golden Bronze Sword Crest with small wings
  // Vip2: Silver Diamond Knight Sword with icy wings
  // Vip3: Emerald Green Mystic Sword with leaf crystals
  // Vip4: Sapphire Ice Blue Crystal Sword with frozen wings
  // Vip5: Royal Purple Amethyst Winged Sword Crest
  // Vip6: Crimson Flame Dragon Ruby Sword Crest
  // Vip7: Radiant Pure Gold Double-Winged Imperial Seal
  // Vip8: Grand Lion King Crowned Crest with Pink/Gold wings
  // Vip9: Blazing Fiery Solar Sun Lion King Crown Crest

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {tier === 1 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v1g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <path d="M24 4 L28 16 L38 20 L28 26 L30 42 L24 36 L18 42 L20 26 L10 20 L20 16 Z" fill="url(#v1g)" />
          <path d="M24 8 L24 38 M21 16 L27 16" stroke="#fff" strokeWidth="1.2" />
        </svg>
      )}

      {tier === 2 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v2s" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <path d="M24 3 L31 15 L43 18 L32 25 L34 43 L24 35 L14 43 L16 25 L5 18 L17 15 Z" fill="url(#v2s)" stroke="#e2e8f0" strokeWidth="0.8" />
          <polygon points="24,6 26,18 34,20 27,24 28,34 24,30 20,34 21,24 14,20 22,18" fill="#cbd5e1" />
          <line x1="24" y1="6" x2="24" y2="38" stroke="#38bdf8" strokeWidth="1.2" />
        </svg>
      )}

      {tier === 3 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v3e" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          <path d="M24 3 C16 10, 6 16, 8 26 C9 35, 17 40, 24 45 C31 40, 39 35, 40 26 C42 16, 32 10, 24 3 Z" fill="url(#v3e)" stroke="#6ee7b7" strokeWidth="1" />
          <path d="M24 6 L26 22 L36 24 L27 28 L29 38 L24 34 L19 38 L21 28 L12 24 L22 22 Z" fill="#34d399" />
          <line x1="24" y1="7" x2="24" y2="40" stroke="#ecfdf5" strokeWidth="1.2" />
        </svg>
      )}

      {tier === 4 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v4b" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M24 2 L33 14 L45 17 L35 26 L38 44 L24 36 L10 44 L13 26 L3 17 L15 14 Z" fill="url(#v4b)" stroke="#bae6fd" strokeWidth="1" />
          <polygon points="24,6 27,18 36,20 28,25 30,35 24,31 18,35 20,25 12,20 21,18" fill="#7dd3fc" />
          <circle cx="24" cy="22" r="3" fill="#ffffff" />
        </svg>
      )}

      {tier === 5 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v5p" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
          </defs>
          <path d="M24 3 L32 14 L46 16 L35 26 L38 44 L24 36 L10 44 L13 26 L2 16 L16 14 Z" fill="url(#v5p)" stroke="#d8b4fe" strokeWidth="1" />
          <path d="M24 7 L27 20 L37 22 L29 27 L31 37 L24 33 L17 37 L19 27 L11 22 L21 20 Z" fill="#c084fc" />
          <line x1="24" y1="8" x2="24" y2="40" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      )}

      {tier === 6 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v6r" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fee2e2" />
              <stop offset="40%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <path d="M24 2 L33 13 L47 16 L36 26 L39 45 L24 37 L9 45 L12 26 L1 16 L15 13 Z" fill="url(#v6r)" stroke="#fca5a5" strokeWidth="1.2" />
          <polygon points="24,6 27,19 37,21 29,27 31,37 24,33 17,37 19,27 11,21 21,19" fill="#f87171" />
          <circle cx="24" cy="22" r="3.5" fill="#fef08a" />
        </svg>
      )}

      {tier === 7 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v7g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          {/* Double Golden Angel Wings */}
          <path d="M4 14 C1 20 6 32 16 38 C12 30 10 22 12 16 Z M44 14 C47 20 42 32 32 38 C36 30 38 22 36 16 Z" fill="url(#v7g)" />
          {/* Imperial Crest Shield */}
          <polygon points="24,3 34,14 44,17 35,26 37,44 24,36 11,44 13,26 4,17 14,14" fill="url(#v7g)" stroke="#fde68a" strokeWidth="1.2" />
          <polygon points="24,8 28,19 37,21 30,27 32,36 24,32 16,36 18,27 11,21 20,19" fill="#fde047" />
          <circle cx="24" cy="22" r="3" fill="#ffffff" />
        </svg>
      )}

      {tier === 8 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="v8g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdf2f8" />
              <stop offset="30%" stopColor="#ec4899" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>
          </defs>
          {/* Lion King Golden Mane & Crown */}
          <circle cx="24" cy="24" r="19" fill="url(#v8g)" opacity="0.35" />
          {/* Crown on top */}
          <polygon points="17,8 24,3 31,8 29,12 19,12" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
          {/* Golden Lion Face Emblem */}
          <path d="M12 18 C10 28 15 38 24 43 C33 38 38 28 36 18 C30 14 18 14 12 18 Z" fill="url(#v8g)" stroke="#fef08a" strokeWidth="1.2" />
          {/* Wings */}
          <path d="M5 16 C1 22 4 33 13 37 M43 16 C47 22 44 33 35 37" stroke="#f472b6" strokeWidth="2" fill="none" />
          <circle cx="20" cy="22" r="1.5" fill="#fff" />
          <circle cx="28" cy="22" r="1.5" fill="#fff" />
          <polygon points="24,24 22,27 26,27" fill="#ef4444" />
        </svg>
      )}

      {tier >= 9 && (
        <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="v9f" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" />
              <stop offset="30%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          {/* Fiery Sun Burst Wings */}
          <path d="M24 2 C16 6 4 15 5 28 C6 38 15 44 24 46 C33 44 42 38 43 28 C44 15 32 6 24 2 Z" fill="url(#v9f)" stroke="#fdba74" strokeWidth="1.2" />
          <polygon points="16,7 24,1 32,7 30,11 18,11" fill="#fde047" />
          <circle cx="24" cy="25" r="11" fill="#ea580c" stroke="#fef08a" strokeWidth="1" />
          <circle cx="20" cy="23" r="1.5" fill="#fff" />
          <circle cx="28" cy="23" r="1.5" fill="#fff" />
          <polygon points="24,25 21,29 27,29" fill="#fef08a" />
        </svg>
      )}
    </div>
  );
};

// 2. VIP CHAT BUBBLE PREVIEWS (Exact colors and decorative ornaments from screenshots)
export const VIPChatBubblePreview: React.FC<{
  tier: number;
  text?: string;
  className?: string;
}> = ({ tier, text = 'Chat Bubbles', className = '' }) => {
  const configs: Record<number, { bg: string; border: string; cornerDeco: string; textColor: string }> = {
    1: {
      bg: 'bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#0f766e]',
      border: 'border-[#34d399]',
      cornerDeco: '💎',
      textColor: 'text-emerald-100',
    },
    2: {
      bg: 'bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#38bdf8]',
      border: 'border-[#7dd3fc]',
      cornerDeco: '❄️',
      textColor: 'text-sky-100',
    },
    3: {
      bg: 'bg-gradient-to-r from-[#451a03] via-[#78350f] to-[#b45309]',
      border: 'border-[#fbbf24]',
      cornerDeco: '⚜️',
      textColor: 'text-amber-100',
    },
    4: {
      bg: 'bg-gradient-to-r from-[#312e81] via-[#4338ca] to-[#6366f1]',
      border: 'border-[#a5b4fc]',
      cornerDeco: '🔮',
      textColor: 'text-indigo-100',
    },
    5: {
      bg: 'bg-gradient-to-r from-[#172554] via-[#1d4ed8] to-[#60a5fa]',
      border: 'border-[#93c5fd]',
      cornerDeco: '🔷',
      textColor: 'text-blue-100',
    },
    6: {
      bg: 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#fb7185]',
      border: 'border-[#fda4af]',
      cornerDeco: '🔥',
      textColor: 'text-rose-100',
    },
    7: {
      bg: 'bg-gradient-to-r from-[#713f12] via-[#ca8a04] to-[#fde047]',
      border: 'border-[#fef08a]',
      cornerDeco: '👑',
      textColor: 'text-yellow-950 font-black',
    },
    8: {
      bg: 'bg-gradient-to-r from-[#a21caf] via-[#f59e0b] to-[#fbbf24]',
      border: 'border-[#fde68a]',
      cornerDeco: '🦁',
      textColor: 'text-amber-950 font-black',
    },
    9: {
      bg: 'bg-gradient-to-r from-[#831843] via-[#e11d48] to-[#fb923c]',
      border: 'border-[#fed7aa]',
      cornerDeco: '☀️',
      textColor: 'text-white font-black',
    },
  };

  const cfg = configs[tier] || configs[1];

  return (
    <div
      className={`relative h-9 px-3.5 rounded-lg flex items-center justify-between border ${cfg.bg} ${cfg.border} shadow-sm ${className}`}
    >
      <span className={`text-[11px] font-sans font-bold ${cfg.textColor}`}>
        {text}
      </span>
      <span className="text-xs">{cfg.cornerDeco}</span>
    </div>
  );
};

// 3. VIP PROFILE CARD / BANNER PREVIEW (Exact colors & headers from screenshots)
export const VIPProfileCardPreview: React.FC<{
  tier: number;
  className?: string;
}> = ({ tier, className = '' }) => {
  const configs: Record<number, { headerColor: string; bottomColor: string; crest: string }> = {
    1: {
      headerColor: 'bg-gradient-to-b from-[#b45309] to-transparent',
      bottomColor: 'from-[#b45309]/30 to-white',
      crest: '⚜️',
    },
    2: {
      headerColor: 'bg-gradient-to-b from-[#38bdf8] to-transparent',
      bottomColor: 'from-[#38bdf8]/30 to-white',
      crest: '❄️',
    },
    3: {
      headerColor: 'bg-gradient-to-b from-[#10b981] to-transparent',
      bottomColor: 'from-[#10b981]/30 to-white',
      crest: '🌿',
    },
    4: {
      headerColor: 'bg-gradient-to-b from-[#0284c7] to-transparent',
      bottomColor: 'from-[#0284c7]/30 to-white',
      crest: '🔷',
    },
    5: {
      headerColor: 'bg-gradient-to-b from-[#9333ea] to-transparent',
      bottomColor: 'from-[#9333ea]/30 to-white',
      crest: '🔮',
    },
    6: {
      headerColor: 'bg-gradient-to-b from-[#ea580c] to-transparent',
      bottomColor: 'from-[#ea580c]/30 to-white',
      crest: '🔥',
    },
    7: {
      headerColor: 'bg-gradient-to-b from-[#eab308] to-transparent',
      bottomColor: 'from-[#eab308]/40 to-white',
      crest: '👑',
    },
    8: {
      headerColor: 'bg-gradient-to-b from-[#ec4899] to-transparent',
      bottomColor: 'from-[#ec4899]/40 to-white',
      crest: '🦁',
    },
    9: {
      headerColor: 'bg-gradient-to-b from-[#f97316] to-transparent',
      bottomColor: 'from-[#f97316]/40 to-white',
      crest: '☀️',
    },
  };

  const cfg = configs[tier] || configs[1];

  return (
    <div
      className={`relative w-full h-20 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Top ornamental bar */}
      <div className={`w-full h-6 ${cfg.headerColor} flex items-center justify-between px-2`}>
        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        <div className="w-8 h-1 rounded-full bg-white/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
      </div>

      {/* Watermark crest on bottom right */}
      <div className="absolute right-2 bottom-1 opacity-40 text-2xl pointer-events-none">
        {cfg.crest}
      </div>
    </div>
  );
};

// 4. VIP VOICE WAVE (Star / Hexagram Aura Seat Wave)
export const VIPVoiceWavePreview: React.FC<{
  tier: number;
  className?: string;
  size?: number;
}> = ({ tier, className = '', size = 56 }) => {
  const configs: Record<number, { ring: string; star: string; glow: string }> = {
    1: { ring: 'border-[#78350f]', star: '#b45309', glow: '#d97706' },
    2: { ring: 'border-[#38bdf8]', star: '#7dd3fc', glow: '#38bdf8' },
    3: { ring: 'border-[#10b981]', star: '#34d399', glow: '#10b981' },
    4: { ring: 'border-[#0284c7]', star: '#38bdf8', glow: '#0ea5e9' },
    5: { ring: 'border-[#9333ea]', star: '#c084fc', glow: '#a855f7' },
    6: { ring: 'border-[#ef4444]', star: '#f87171', glow: '#dc2626' },
    7: { ring: 'border-[#eab308]', star: '#fde047', glow: '#ca8a04' },
    8: { ring: 'border-[#ec4899]', star: '#f472b6', glow: '#db2777' },
    9: { ring: 'border-[#f97316]', star: '#fb923c', glow: '#ea580c' },
  };

  const cfg = configs[tier] || configs[1];

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Outer circular dotted ring */}
      <div
        className={`absolute inset-0 rounded-full border border-dashed ${cfg.ring} opacity-80 animate-spin`}
        style={{ animationDuration: '10s' }}
      />
      {/* Star / Hexagram polygon */}
      <svg viewBox="0 0 36 36" className="w-8 h-8">
        <polygon
          points="18,3 22,12 32,12 24,18 27,27 18,22 9,27 12,18 4,12 14,12"
          fill="none"
          stroke={cfg.star}
          strokeWidth="1.8"
        />
        <circle cx="18" cy="18" r="4" fill={cfg.glow} opacity="0.6" />
      </svg>
    </div>
  );
};

// 5. VIP USERNAME COLOR WITH CONTINUOUS LUXURY SHIMMER
export const VIPUsernameColors: Record<number, string> = {
  1: 'shimmer-text-silver font-bold',
  2: 'shimmer-text-silver font-black',
  3: 'shimmer-text-gold font-bold',
  4: 'shimmer-text-gold font-black',
  5: 'shimmer-text-red font-bold',
  6: 'shimmer-text-red font-black',
  7: 'shimmer-text-black font-black',
  8: 'shimmer-text-quad font-black',
  9: 'shimmer-text-rainbow font-black',
};

// 6. VIP TIERS DISTRIBUTED LUXURY COLOR SCHEMES
// Distributing: Silver (1-2), Gold (3-4), Ruby Red (5-6), Obsidian Black (7), Quad Luxury (8), Rainbow Prism (9)
export interface VIPTierStyleInfo {
  tier: number;
  colorNameArabic: string;
  themeTitle: string;
  description: string;
  textShimmerClass: string;
  badgeShimmerClass: string;
  heroGradient: string;
  borderClass: string;
  iconGlow: string;
  chipEmoji: string;
  tagTitle: string;
}

export const VIP_TIER_STYLES: Record<number, VIPTierStyleInfo> = {
  1: {
    tier: 1,
    colorNameArabic: 'الفضي والبلاتيني السائل',
    themeTitle: 'الفضة النقية والبلاتين ⚪',
    description: 'بريق فضي بلاتيني سائل دائم الحركة والصفاء',
    textShimmerClass: 'shimmer-text-silver',
    badgeShimmerClass: 'shimmer-badge-silver',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0f172a 70%, #070913 100%)',
    borderClass: 'border-slate-400/50',
    iconGlow: 'rgba(226, 232, 240, 0.5)',
    chipEmoji: '⚪',
    tagTitle: 'فضي وبلاتيني',
  },
  2: {
    tier: 2,
    colorNameArabic: 'الفضة الكريستالية الماسية',
    themeTitle: 'الفضة الألماسية المشعة ❄️',
    description: 'تألق فضي بلاتيني عاكس كبلورات الثلج والألماس السائل',
    textShimmerClass: 'shimmer-text-silver',
    badgeShimmerClass: 'shimmer-badge-silver',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0f172a 70%, #070913 100%)',
    borderClass: 'border-sky-300/50',
    iconGlow: 'rgba(56, 189, 248, 0.5)',
    chipEmoji: '❄️',
    tagTitle: 'فضة ألماسية',
  },
  3: {
    tier: 3,
    colorNameArabic: 'الذهب الملكي الخالص 24K',
    themeTitle: 'الذهب الملكي الخالص 👑',
    description: 'تموجات ذهبية إمبراطورية براقة مستمرة اللمعان والسطوع',
    textShimmerClass: 'shimmer-text-gold',
    badgeShimmerClass: 'shimmer-badge-gold',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #451a03 0%, #1c0d02 70%, #070913 100%)',
    borderClass: 'border-amber-400/50',
    iconGlow: 'rgba(245, 158, 11, 0.5)',
    chipEmoji: '⚜️',
    tagTitle: 'ذهب ملكي',
  },
  4: {
    tier: 4,
    colorNameArabic: 'الذهب الإمبراطوري 24K',
    themeTitle: 'سبائك الذهب الصافي 🌟',
    description: 'بريق إمبراطوري مشع كسبائك الذهب الصافي عيار 24 قيراط',
    textShimmerClass: 'shimmer-text-gold',
    badgeShimmerClass: 'shimmer-badge-gold',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #451a03 0%, #1c0d02 70%, #070913 100%)',
    borderClass: 'border-amber-400/60',
    iconGlow: 'rgba(251, 191, 36, 0.6)',
    chipEmoji: '👑',
    tagTitle: 'ذهب 24K',
  },
  5: {
    tier: 5,
    colorNameArabic: 'الياقوت الأحمر الساطع',
    themeTitle: 'الياقوت القرمزي الساطع 🔴',
    description: 'أحمر قرمزي ناري متوهج بأشعة ليزرية مشتعلة لا تنطفئ',
    textShimmerClass: 'shimmer-text-red',
    badgeShimmerClass: 'shimmer-badge-red',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #450a0a 0%, #1f0404 70%, #070913 100%)',
    borderClass: 'border-rose-500/50',
    iconGlow: 'rgba(239, 68, 68, 0.6)',
    chipEmoji: '🔴',
    tagTitle: 'ياقوت أحمر',
  },
  6: {
    tier: 6,
    colorNameArabic: 'الياقوت القرمزي الناري',
    themeTitle: 'شعلة الياقوت المشتعلة 🔥',
    description: 'وهج ياقوتي ناري مشتعل بتدرجات الشعلة المتلألئة',
    textShimmerClass: 'shimmer-text-red',
    badgeShimmerClass: 'shimmer-badge-red',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #450a0a 0%, #1f0404 70%, #070913 100%)',
    borderClass: 'border-rose-400/60',
    iconGlow: 'rgba(244, 63, 94, 0.6)',
    chipEmoji: '🔥',
    tagTitle: 'لهب الياقوت',
  },
  7: {
    tier: 7,
    colorNameArabic: 'الأسود الملكي والأوبسيديان',
    themeTitle: 'الأوبسيديان والأسود الفاخر 🖤',
    description: 'فخامة الأسود الداكن مع انعكاسات فضية وذهبية مشعة بمهابة ملكية',
    textShimmerClass: 'shimmer-text-black',
    badgeShimmerClass: 'shimmer-badge-black',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #0f172a 0%, #020617 70%, #000000 100%)',
    borderClass: 'border-slate-500/60',
    iconGlow: 'rgba(255, 255, 255, 0.35)',
    chipEmoji: '🖤',
    tagTitle: 'أسود ملكي',
  },
  8: {
    tier: 8,
    colorNameArabic: 'الرباعي الملكي (ذهبي • أحمر • أسود • فضي)',
    themeTitle: 'الرباعي الملكي الأسطوري ✨',
    description: 'مزيج استثنائي يجمع الذهب 24K والياقوت الأحمر والأسود الفاخر والفضة بلمعان مستمر متداخل',
    textShimmerClass: 'shimmer-text-quad',
    badgeShimmerClass: 'shimmer-badge-quad',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #31133f 0%, #190a21 50%, #070913 100%)',
    borderClass: 'border-amber-400/60',
    iconGlow: 'rgba(245, 158, 11, 0.6)',
    chipEmoji: '✨',
    tagTitle: 'رباعي أسطوري',
  },
  9: {
    tier: 9,
    colorNameArabic: 'طيف الماس المتلألئ باستمرار',
    themeTitle: 'طيف الماس الإمبراطوري 🌈',
    description: 'ألوان سحرية متحركة تلمع باستمرار كمنشور بلوري مشع يجمع كل الأطياف',
    textShimmerClass: 'shimmer-text-rainbow',
    badgeShimmerClass: 'shimmer-badge-rainbow',
    heroGradient: 'radial-gradient(ellipse at 50% 0%, #3b0764 0%, #1e0938 60%, #070913 100%)',
    borderClass: 'border-pink-500/60',
    iconGlow: 'rgba(168, 85, 247, 0.6)',
    chipEmoji: '🌈',
    tagTitle: 'طيف الألماس',
  },
};

