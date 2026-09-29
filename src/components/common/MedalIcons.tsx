import React from 'react';

// =========================================================================
// 1. ACHIEVEMENT MEDALS (الإنجازات)
// =========================================================================

// 1.1 Millionaire Medal (مليونير - 10M Dollar Shield)
export const MillionaireMedal: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="goldRadial" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <linearGradient id="cyanRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      {/* Wings */}
      <path d="M50 45 C30 25, 10 28, 5 45 C2 52, 12 60, 25 60 C35 60, 45 55, 50 50 Z" fill="url(#goldRadial)" opacity="0.9" />
      <path d="M50 45 C70 25, 90 28, 95 45 C98 52, 88 60, 75 60 C65 60, 55 55, 50 50 Z" fill="url(#goldRadial)" opacity="0.9" />
      {/* Laurel leaves behind */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="3 5" />
      {/* Crown on top */}
      <polygon points="50,15 42,26 46,28 50,22 54,28 58,26" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
      {/* Golden Shield Frame */}
      <path d="M50 24 L74 34 C74 58, 64 74, 50 82 C36 74, 26 58, 26 34 Z" fill="url(#goldRadial)" stroke="#fef3c7" strokeWidth="2" />
      {/* Inner Blue Jewel Center with Dollar Sign */}
      <path d="M50 30 L68 38 C68 56, 60 68, 50 74 C40 68, 32 56, 32 38 Z" fill="#0284c7" />
      <text x="50" y="58" textAnchor="middle" fill="#fef08a" fontSize="24" fontWeight="900" fontFamily="sans-serif">$</text>
      {/* Ribbon with 10M */}
      <path d="M22 68 L78 68 L72 80 L50 76 L28 80 Z" fill="url(#cyanRibbon)" stroke="#38bdf8" strokeWidth="1" />
      <text x="50" y="76" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">10M</text>
    </svg>
  </div>
);

// 1.2 Gift Giver Medal (نجم منح الهدايا - 5M Gift Box Wreath)
export const GiftGiverMedal: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="giftGold" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <linearGradient id="cyanRibbon2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Crown */}
      <polygon points="50,14 42,24 45,26 50,20 55,26 58,24" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
      {/* Golden Laurel Wreath */}
      <circle cx="50" cy="50" r="33" fill="none" stroke="url(#giftGold)" strokeWidth="8" strokeDasharray="4 6" />
      {/* Inner Dark Blue Medallion */}
      <circle cx="50" cy="50" r="25" fill="#0f172a" stroke="#d97706" strokeWidth="2" />
      {/* Gift Box Icon */}
      <rect x="38" y="44" width="24" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
      <rect x="36" y="39" width="28" height="5" rx="1.5" fill="#38bdf8" />
      {/* Golden ribbon wrap */}
      <rect x="48" y="39" width="4" height="23" fill="#fbbf24" />
      {/* Ribbon bow on top */}
      <path d="M45 36 C42 32, 45 30, 50 35 C55 30, 58 32, 55 36 Z" fill="#fbbf24" />
      {/* Cyan Ribbon 5M */}
      <path d="M24 70 L76 70 L70 82 L50 78 L30 82 Z" fill="url(#cyanRibbon2)" stroke="#38bdf8" strokeWidth="1" />
      <text x="50" y="78" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">5M</text>
    </svg>
  </div>
);

// 1.3 Gift Receiver Medal (نجم تلقي الهدايا - 5M Rose Wreath)
export const GiftReceiverMedal: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="roseGold" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
      </defs>
      {/* Crown */}
      <polygon points="50,14 42,24 45,26 50,20 55,26 58,24" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
      {/* Laurel Wreath */}
      <circle cx="50" cy="50" r="33" fill="none" stroke="url(#roseGold)" strokeWidth="8" strokeDasharray="4 6" />
      {/* Inner Dark Blue Medallion */}
      <circle cx="50" cy="50" r="25" fill="#0f172a" stroke="#d97706" strokeWidth="2" />
      {/* Golden Blooming Rose */}
      <circle cx="50" cy="48" r="11" fill="#f59e0b" />
      <circle cx="50" cy="48" r="7" fill="#fbbf24" />
      <path d="M46 45 C48 42, 52 42, 54 45 C56 50, 44 50, 46 45 Z" fill="#fff" opacity="0.6" />
      {/* Cyan bow tie under rose */}
      <path d="M40 56 L60 56 L55 61 L50 58 L45 61 Z" fill="#0284c7" />
      {/* Cyan Ribbon 5M */}
      <path d="M24 70 L76 70 L70 82 L50 78 L30 82 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
      <text x="50" y="78" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">5M</text>
    </svg>
  </div>
);

// 1.4 Charm Star Medal (نجم الجاذبية - Purple Heart LV.20)
export const CharmStarMedal: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="purpleHeart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="30%" stopColor="#c084fc" />
          <stop offset="70%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
        <linearGradient id="silverWings" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      {/* Silver Crown / Wings crest */}
      <path d="M50 20 L65 32 L85 28 L75 52 L82 70 L50 62 L18 70 L25 52 L15 28 L35 32 Z" fill="url(#silverWings)" stroke="#e2e8f0" strokeWidth="1" />
      {/* Faceted Purple Crystal Heart */}
      <path
        d="M50 34 C44 26, 30 26, 26 38 C23 48, 36 60, 50 72 C64 60, 77 48, 74 38 C70 26, 56 26, 50 34 Z"
        fill="url(#purpleHeart)"
        stroke="#e9d5ff"
        strokeWidth="1.5"
      />
      {/* Gem facet highlight */}
      <polygon points="50,38 42,46 50,56 58,46" fill="#ffffff" opacity="0.4" />
      {/* Ribbon with LV.20 */}
      <path d="M26 68 L74 68 L68 80 L50 76 L32 80 Z" fill="#7e22ce" stroke="#d8b4fe" strokeWidth="1" />
      <text x="50" y="76" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">LV.20</text>
    </svg>
  </div>
);

// 1.5 Wealth Ruby/Sapphire Medal (ياقوت الثروة - Blue Sapphire LV.40)
export const WealthRubyMedal: React.FC<{ size?: number; className?: string }> = ({
  size = 72,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative select-none ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <radialGradient id="blueGem" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="80%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#172554" />
        </radialGradient>
        <linearGradient id="silverPlat" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      {/* Silver Winged Frame */}
      <path d="M50 16 L68 28 L88 32 L78 54 L84 72 L50 64 L16 72 L22 54 L12 32 L32 28 Z" fill="url(#silverPlat)" stroke="#e2e8f0" strokeWidth="1" />
      {/* Faceted Blue Diamond Octagon */}
      <polygon points="50,26 68,36 74,54 64,68 50,72 36,68 26,54 32,36" fill="url(#blueGem)" stroke="#bae6fd" strokeWidth="2" />
      <polygon points="50,34 60,42 62,52 50,60 38,52 40,42" fill="#ffffff" opacity="0.35" />
      {/* Ribbon with LV.40 */}
      <path d="M26 68 L74 68 L68 80 L50 76 L32 80 Z" fill="#1e40af" stroke="#93c5fd" strokeWidth="1" />
      <text x="50" y="76" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">LV.40</text>
    </svg>
  </div>
);

// =========================================================================
// 2. ACTIVITY MEDALS (النشاط - Silver / Platinum TOP3 Medals)
// =========================================================================

// Shared Silver Wreath & Crest Base
const SilverMedalBase: React.FC<{
  children: React.ReactNode;
  ribbonText?: string;
  size?: number;
}> = ({ children, ribbonText = 'TOP3', size = 72 }) => (
  <div style={{ width: size, height: size }} className="relative select-none">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="platSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#e2e8f0" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      {/* Silver Wings & Laurel Frame */}
      <circle cx="50" cy="46" r="28" fill="#1e293b" stroke="url(#platSilver)" strokeWidth="4" />
      {/* Top Crown */}
      <polygon points="50,14 42,22 45,24 50,19 55,24 58,22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      {/* Custom Inner Graphic */}
      {children}
      {/* Silver Ribbon with TOP3 */}
      <path d="M22 68 L78 68 L72 80 L50 76 L28 80 Z" fill="url(#platSilver)" stroke="#f8fafc" strokeWidth="1" />
      <text x="50" y="76" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="900" fontFamily="sans-serif">
        {ribbonText}
      </text>
    </svg>
  </div>
);

// 2.1 النجم العالمي TOP3 (الدولة TOP3)
export const WorldStarMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="الدولة TOP3" size={size}>
    {/* Silver Lion / Eagle shield */}
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">👑</text>
  </SilverMedalBase>
);

// 2.2 عيد الأضحى TOP3 (Silver Ram / Goat)
export const EidAdhaMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">🐏</text>
  </SilverMedalBase>
);

// 2.3 A عضو (بومة ملكية فضية عضو A)
export const MemberAMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="عضو A" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">🦉</text>
  </SilverMedalBase>
);

// 2.4 TOP3 عضو (دروع وسيوف فضية)
export const Top3MemberMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="عضو TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">⚔️</text>
  </SilverMedalBase>
);

// 2.5 الغرفة TOP3 (تاج الغرفة)
export const RoomTop3Medal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">🏰</text>
  </SilverMedalBase>
);

// 2.6 الجاذبية TOP3 (قلب الجاذبية الفضي)
export const CharmTop3Medal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">💎</text>
  </SilverMedalBase>
);

// 2.7 الثروة الشهرية TOP3 (كأس الثروة)
export const MonthlyWealthMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">🏆</text>
  </SilverMedalBase>
);

// 2.8 CP TOP3 (أجنحة CP)
export const CpTop3Medal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">🕊️</text>
  </SilverMedalBase>
);

// 2.9 النجم الأسبوعي TOP3 (نجمة التاج)
export const WeeklyStarMedal: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <SilverMedalBase ribbonText="TOP3" size={size}>
    <circle cx="50" cy="46" r="18" fill="url(#platSilver)" />
    <text x="50" y="52" textAnchor="middle" fill="#0f172a" fontSize="16">⭐</text>
  </SilverMedalBase>
);
