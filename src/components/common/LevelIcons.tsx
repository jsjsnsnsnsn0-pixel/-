import React from 'react';

export type BadgeType = 'wealth' | 'charm';

export interface LevelBadgeProps {
  level: number;
  displayLevel?: number;
  type?: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

/**
 * EXACT VECTOR SVGS FOR THE WEALTH SHIELD CRESTS (Placed on the RIGHT of the number pill)
 * Perfectly matching Screenshot 1 (مستوى الثروة)
 */
export const WealthCrestSvg: React.FC<{ tier: number }> = ({ tier }) => {
  if (tier >= 150) {
    // Tier 150: Supreme Omnipotent Eternal Dragon God Crest (تاج إله التنانين الأبدي الأسطوري)
    return (
      <svg viewBox="0 0 38 38" className="w-full h-full overflow-visible drop-shadow-[0_2px_5px_rgba(234,179,8,0.7)]">
        <defs>
          <linearGradient id="godWings150" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
          <linearGradient id="godCrown150" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <radialGradient id="celestialDiamond150" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>
        </defs>
        {/* Floating Stellar Halo */}
        <circle cx="19" cy="8" r="7" fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.85" />
        {/* Outer Grand Dragon Wings */}
        <path d="M19 6 C11 -2, 1 2, 0 14 C3 18, 7 13, 9 17 C11 23, 13 28, 19 36 C25 28, 27 23, 29 17 C31 13, 35 18, 38 14 C37 2, 27 -2, 19 6 Z" fill="url(#godWings150)" stroke="#fff" strokeWidth="0.8" />
        {/* Inner Dragon Scales & Shield */}
        <path d="M12 12 L26 12 L25 24 C25 29 19 33 19 33 C19 33 13 29 13 24 Z" fill="url(#celestialDiamond150)" stroke="#fef08a" strokeWidth="1.2" />
        {/* Supreme Triple Dragon Crown */}
        <path d="M9 10 L14 4 L19 1 L24 4 L29 10 L26 13 L12 13 Z" fill="url(#godCrown150)" stroke="#fff" strokeWidth="0.6" />
        <circle cx="19" cy="1" r="1.8" fill="#fff" />
        <circle cx="14" cy="4" r="1.3" fill="#fde047" />
        <circle cx="24" cy="4" r="1.3" fill="#fde047" />
        {/* Sparkling Center God Gem */}
        <polygon points="19,16 22,21 19,26 16,21" fill="#fff" />
        <circle cx="19" cy="21" r="1.5" fill="#fef08a" />
      </svg>
    );
  }

  if (tier >= 140) {
    // Tier 140: Cosmic Galactic Emperor Crest (التاج الكوني الإمبراطوري)
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(99,102,241,0.6)]">
        <defs>
          <linearGradient id="cosmicWings140" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="35%" stopColor="#818cf8" />
            <stop offset="70%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="cosmicCore140" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
        <path d="M18 5 C11 0, 3 3, 1 13 C3 16, 6 12, 8 15 C10 21, 12 25, 18 33 C24 25, 26 21, 28 15 C30 12, 33 16, 35 13 C33 3, 25 0, 18 5 Z" fill="url(#cosmicWings140)" stroke="#c7d2fe" strokeWidth="0.8" />
        {/* Imperial Crown on Top */}
        <path d="M10 8 L14 3 L18 6 L22 3 L26 8 L23 11 L13 11 Z" fill="url(#cosmicCore140)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="18" cy="6" r="1.4" fill="#fff" />
        {/* Center Galaxy Nebula Medallion */}
        <circle cx="18" cy="20" r="7" fill="#1e1b4b" stroke="url(#cosmicCore140)" strokeWidth="1.2" />
        <polygon points="18,15 19.5,18.5 23.5,19 20.5,21.5 21.5,25.5 18,23.5 14.5,25.5 15.5,21.5 12.5,19 16.5,18.5" fill="#fef08a" />
        <circle cx="18" cy="20" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 130) {
    // Tier 130: Solar Flare Deity Crest (شمس الآلهة المتوهجة)
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(249,115,22,0.6)]">
        <defs>
          <linearGradient id="solarFlare130" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
        </defs>
        {/* Radiant Sunburst Rays */}
        <path d="M18 2 L20 7 L25 4 L23 9 L28 9 L24 13 L28 16 L23 17 L25 22 L20 19 L18 24 L16 19 L11 22 L13 17 L8 16 L12 13 L8 9 L13 9 L11 4 L16 7 Z" fill="#f97316" opacity="0.85" />
        {/* Majestic Solar Phoenix Wings */}
        <path d="M18 5 C11 0, 4 4, 2 13 C4 16, 7 12, 9 15 C11 20, 13 24, 18 32 C23 24, 25 20, 27 15 C29 12, 32 16, 34 13 C32 4, 25 0, 18 5 Z" fill="url(#solarFlare130)" stroke="#fef08a" strokeWidth="0.8" />
        <circle cx="18" cy="18" r="6" fill="#fef08a" stroke="#ea580c" strokeWidth="1.2" />
        <polygon points="18,14 19.5,17 22.5,17.5 20.2,19.5 21,22.5 18,20.8 15,22.5 15.8,19.5 13.5,17.5 16.5,17" fill="#c2410c" />
      </svg>
    );
  }

  if (tier >= 120) {
    // Tier 120: Mythic Celestial Cyan Diamond Dragon Crest (التنين السماوي الفيروزي الماسي)
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(6,182,212,0.6)]">
        <defs>
          <linearGradient id="cyanDragon120" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="35%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#164e63" />
          </linearGradient>
        </defs>
        <path d="M18 6 C12 1, 4 5, 2 14 C4 17, 7 13, 9 16 C11 21, 13 25, 18 32 C23 25, 25 21, 27 16 C29 13, 32 17, 34 14 C32 5, 24 1, 18 6 Z" fill="url(#cyanDragon120)" stroke="#a5f3fc" strokeWidth="0.8" />
        {/* Diamond Shield Facets */}
        <polygon points="18,10 24,14 22,23 18,28 14,23 12,14" fill="#a5f3fc" stroke="#fff" strokeWidth="1" />
        {/* Crown on top */}
        <path d="M11 9 L14 4 L18 7 L22 4 L25 9 Z" fill="#fef08a" stroke="#0891b2" strokeWidth="0.5" />
        <polygon points="18,13 21,17 18,23 15,17" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 110) {
    // Tier 110: Grand Imperial Cosmic Phoenix Crest (العنقاء الإمبراطورية البنفسجية)
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(168,85,247,0.6)]">
        <defs>
          <linearGradient id="phoenix110" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#faf5ff" />
            <stop offset="30%" stopColor="#c084fc" />
            <stop offset="70%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
          <linearGradient id="goldTrims110" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
        <path d="M18 6 C12 1, 4 5, 2 14 C4 17, 7 13, 9 16 C11 21, 13 25, 18 32 C23 25, 25 21, 27 16 C29 13, 32 17, 34 14 C32 5, 24 1, 18 6 Z" fill="url(#phoenix110)" stroke="url(#goldTrims110)" strokeWidth="0.8" />
        {/* Double Crown on Top */}
        <path d="M10 8 L14 3 L18 7 L22 3 L26 8 L23 11 L13 11 Z" fill="url(#goldTrims110)" stroke="#fff" strokeWidth="0.5" />
        {/* Royal Purple Medallion with Gold Star */}
        <circle cx="18" cy="19" r="6.5" fill="#581c87" stroke="url(#goldTrims110)" strokeWidth="1.2" />
        <polygon points="18,14 19.5,17.5 23.5,18 20.5,20.5 21.5,24.5 18,22.5 14.5,24.5 15.5,20.5 12.5,18 16.5,17.5" fill="#fef08a" />
      </svg>
    );
  }

  if (tier >= 100) {
    // Tier 100: Supreme Blazing Golden Dragon Crest with Imperial Crown
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
        <defs>
          <linearGradient id="goldDragon100" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="rubyGlow100" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>
        <path d="M18 6 C11 1, 3 4, 1 14 C3 17, 6 13, 8 16 C10 21, 12 25, 18 33 C24 25, 26 21, 28 16 C30 13, 33 17, 35 14 C33 4, 25 1, 18 6 Z" fill="url(#goldDragon100)" stroke="#fef08a" strokeWidth="0.8" />
        <path d="M12 11 L24 11 L23 21 C23 25 18 29 18 29 C18 29 13 25 13 21 Z" fill="url(#rubyGlow100)" stroke="#fef08a" strokeWidth="1" />
        <path d="M11 9 L18 4 L25 9 L22 12 L14 12 Z" fill="url(#goldDragon100)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="18" cy="4" r="1.5" fill="#fff" />
        <circle cx="11" cy="9" r="1.2" fill="#fde047" />
        <circle cx="25" cy="9" r="1.2" fill="#fde047" />
        <polygon points="18,14 19.5,18 23,18 20,20.5 21,24 18,22 15,24 16,20.5 13,18 16.5,18" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 90) {
    // Tier 90-99: Royal Ruby & Gold Imperial Crest with Double Wings & Crown
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
        <defs>
          <linearGradient id="goldRuby90" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="rubyCore90" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
        <path d="M18 7 C12 2, 4 6, 2 15 C5 18, 7 14, 9 17 C11 22, 13 25, 18 31 C23 25, 25 22, 27 17 C29 14, 31 18, 34 15 C32 6, 24 2, 18 7 Z" fill="url(#goldRuby90)" />
        <path d="M13 12 L23 12 L22 22 C22 25 18 28 18 28 C18 28 14 25 14 22 Z" fill="url(#rubyCore90)" stroke="#fef08a" strokeWidth="1" />
        <path d="M12 9 L15 6 L18 9 L21 6 L24 9 L22 12 L14 12 Z" fill="url(#goldRuby90)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="18" cy="19" r="2.5" fill="#fef08a" />
      </svg>
    );
  }

  if (tier >= 80) {
    // Tier 80-89: Royal Gold Winged Crest with Crown & Star
    return (
      <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="goldWings80" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        <path d="M17 6 C11 2, 4 6, 2 15 C5 18, 7 14, 9 17 C11 22, 13 25, 17 31 C21 25, 23 22, 25 17 C27 14, 29 18, 32 15 C30 6, 23 2, 17 6 Z" fill="url(#goldWings80)" stroke="#fef08a" strokeWidth="0.5" />
        <path d="M12 7 L14 4 L17 7 L20 4 L22 7 L21 10 L13 10 Z" fill="#fef08a" stroke="#b45309" strokeWidth="0.5" />
        <circle cx="17" cy="18" r="6" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
        <polygon points="17,14 18.2,16.8 21,17.2 19,19.2 19.5,22 17,20.6 14.5,22 15,19.2 13,17.2 15.8,16.8" fill="#d97706" />
      </svg>
    );
  }

  if (tier >= 70) {
    // Tier 70-79: Royal Purple Medallion with Gold Crown & Purple Ribbons
    return (
      <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="purpleGem70" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="60%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
          <linearGradient id="goldCrown70" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M12 24 L10 32 L14 29 L16 32 L15 24 Z M22 24 L24 32 L20 29 L18 32 L19 24 Z" fill="#6b21a8" />
        <path d="M5 12 C2 16 4 21 8 24 C11 26 13 23 11 20 C8 18 7 14 9 12 Z M29 12 C32 16 30 21 26 24 C23 26 21 23 23 20 C26 18 27 14 25 12 Z" fill="url(#goldCrown70)" />
        <circle cx="17" cy="17" r="7" fill="url(#purpleGem70)" stroke="url(#goldCrown70)" strokeWidth="1.5" />
        <path d="M12 11 L14 7 L17 10 L20 7 L22 11 Z" fill="url(#goldCrown70)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="17" cy="17" r="2.5" fill="#fef08a" />
      </svg>
    );
  }

  if (tier >= 60) {
    // Tier 60-69: Turquoise & Gold Medallion with Golden Leaves
    return (
      <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="turqRing60" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="goldCoin60" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <path d="M5 12 C3 16 5 21 9 24 C11 25 13 22 11 19 C8 17 8 14 10 12 Z M29 12 C31 16 29 21 25 24 C23 25 21 22 23 19 C26 17 26 14 24 12 Z" fill="url(#goldCoin60)" />
        <circle cx="17" cy="17" r="8" fill="url(#turqRing60)" stroke="#fef08a" strokeWidth="1.2" />
        <circle cx="17" cy="17" r="5" fill="url(#goldCoin60)" stroke="#fde047" strokeWidth="1" />
        <polygon points="17,13.5 18,15.8 20.5,16.2 18.7,17.8 19.2,20.2 17,19 14.8,20.2 15.3,17.8 13.5,16.2 16,15.8" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 50) {
    // Tier 50-59: Radiant Golden Star Medallion Shield
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="goldStar50" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        <path d="M12 22 L10 29 L14 27 L16 29 L15 22 Z M20 22 L22 29 L18 27 L16 29 L17 22 Z" fill="#b45309" />
        <path d="M16 4 L19 8 L24 8 L24 13 L28 16 L24 19 L24 24 L19 24 L16 28 L13 24 L8 24 L8 19 L4 16 L8 13 L8 8 L13 8 Z" fill="url(#goldStar50)" stroke="#fef08a" strokeWidth="0.8" />
        <polygon points="16,9 18,13.5 23,14 19.5,17.5 20.5,22.5 16,20 11.5,22.5 12.5,17.5 9,14 14,13.5" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 40) {
    // Tier 40-49: Amethyst Purple Crystal Shield with Star & Ribbons
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="amethyst40" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="30%" stopColor="#c084fc" />
            <stop offset="70%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
        </defs>
        <path d="M11 21 L9 28 L13 26 L15 28 L14 21 Z M21 21 L23 28 L19 26 L17 28 L18 21 Z" fill="#581c87" />
        <path d="M16 6 L24 10 L23 19 C23 23 16 26 16 26 C16 26 9 23 9 19 L8 10 Z" fill="url(#amethyst40)" stroke="#e9d5ff" strokeWidth="1.2" />
        <polygon points="16,9 21,12 16,22 11,12" fill="#d8b4fe" opacity="0.8" />
        <polygon points="16,11 19,13 16,19 13,13" fill="#ffffff" />
      </svg>
    );
  }

  if (tier >= 30) {
    // Tier 30-39: Sapphire Blue Faceted Crystal Shield
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="sapphire30" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="30%" stopColor="#60a5fa" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#1d4ed8" />
        <path d="M16 5 L24 9.5 L23 19.5 C23 23.5 16 27 16 27 C16 27 9 23.5 9 19.5 L8 9.5 Z" fill="url(#sapphire30)" stroke="#bfdbfe" strokeWidth="1.2" />
        <polygon points="16,8 21,12 16,23 11,12" fill="#93c5fd" opacity="0.85" />
        <polygon points="16,10 19,13 16,19 13,13" fill="#ffffff" />
      </svg>
    );
  }

  if (tier >= 20) {
    // Tier 20-29: Emerald Green Faceted Shield
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="emerald20" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="30%" stopColor="#34d399" />
            <stop offset="70%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
        <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#047857" />
        <path d="M16 6 L23 10 L22 19 C22 23 16 26 16 26 C16 26 10 23 10 19 L9 10 Z" fill="url(#emerald20)" stroke="#a7f3d0" strokeWidth="1.2" />
        <polygon points="16,9 18,13 22,14 19,17 20,21 16,19 12,21 13,17 10,14 14,13" fill="#ffffff" opacity="0.95" />
      </svg>
    );
  }

  if (tier >= 10) {
    // Tier 10-19: Bronze/Amber Diamond Shield with Laurels
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="bronze10" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        <path d="M12 21 L10 27 L14 25 L16 27 L15 21 Z M20 21 L22 27 L18 25 L16 27 L17 21 Z" fill="#92400e" />
        <polygon points="16,5 23,8 24,15 21,21 16,25 11,21 8,15 9,8" fill="url(#bronze10)" stroke="#fef08a" strokeWidth="1.2" />
        <polygon points="16,8 21,12 16,21 11,12" fill="#fde68a" stroke="#ffffff" strokeWidth="0.8" />
        <polygon points="16,10 19,13 16,18 13,13" fill="#ffffff" />
      </svg>
    );
  }

  // Tier 1-9: Ice Blue / Silver Faceted Crystal Shield
  return (
    <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id="iceBlue1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#bae6fd" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <polygon points="16,5 24,9 23,19 16,25 9,19 8,9" fill="url(#iceBlue1)" stroke="#ffffff" strokeWidth="1.5" />
      <polygon points="16,8 21,13 16,22 11,13" fill="#7dd3fc" opacity="0.85" />
      <polygon points="16,10 19,14 16,19 13,14" fill="#ffffff" />
    </svg>
  );
};

/**
 * EXACT VECTOR SVGS FOR CHARM / MAGIC HEARTS (مستوى السحر)
 * Perfectly matching Screenshot 2 (مستوى السحر):
 * - Tier 1: Ice blue crystal heart with wings
 * - Tier 10: Lavender purple faceted heart with wings
 * - Tier 20: Bright magenta/purple crystal heart with wings
 * - Tier 30: Bright rose pink heart with wings
 * - Tier 40: Ruby magenta heart with gold crown
 * - Tier 50: Emerald green heart with gold crown
 * - Tier 60: Cyan/blue heart with royal gold crown
 * - Tier 70: Fiery gold heart with gold crown
 * - Tier 80: Crimson ruby heart with ornate gold crown
 * - Tier 90: Pure radiant golden heart with imperial crown
 * - Tier 100: Supreme ruby dragon heart with blazing crown
 */
export const CharmHeartSvg: React.FC<{ tier: number }> = ({ tier }) => {
  if (tier >= 110) {
    // Tier 110: Supreme Divine Celestial Diamond Heart (قلب العرش الماسي الأبدي المتوهج)
    return (
      <svg viewBox="0 0 38 38" className="w-full h-full overflow-visible drop-shadow-[0_2px_5px_rgba(244,63,94,0.7)]">
        <defs>
          <linearGradient id="divineHeart110" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="85%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          <linearGradient id="celestialWings110" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* Halo of Divine Starlight */}
        <circle cx="19" cy="8" r="6.5" fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.9" />
        {/* Triple Outspread Angelic Wings */}
        <path d="M19 10 C12 2, 3 6, 1 15 C4 18, 7 15, 9 18 C11 23, 14 26, 19 33 C24 26, 27 23, 29 18 C31 15, 34 18, 37 15 C35 6, 26 2, 19 10 Z" fill="url(#celestialWings110)" stroke="#fff" strokeWidth="0.6" />
        {/* Celestial Imperial Crown with Stars */}
        <path d="M11 9 L15 3 L19 7 L23 3 L27 9 L24 12 L14 12 Z" fill="url(#celestialWings110)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="19" cy="3" r="1.5" fill="#fff" />
        <circle cx="15" cy="3" r="1.1" fill="#fde047" />
        <circle cx="23" cy="3" r="1.1" fill="#fde047" />
        {/* Luminous Diamond Heart Core */}
        <path d="M19 15 C15 11, 9 12, 9 18 C9 24, 19 29, 19 29 C19 29, 29 24, 29 18 C29 12, 23 11, 19 15 Z" fill="url(#divineHeart110)" stroke="#fef08a" strokeWidth="1.2" />
        {/* Sparkle core */}
        <polygon points="19,16 20.5,19 23,19 21,21 22,23.5 19,22 16,23.5 17,21 15,19 17.5,19" fill="#fff" />
        <circle cx="19" cy="19.5" r="1.5" fill="#fef08a" />
      </svg>
    );
  }

  if (tier >= 100) {
    // Tier 100: Supreme Flaming Ruby & Gold Crowned Heart
    return (
      <svg viewBox="0 0 36 36" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
        <defs>
          <linearGradient id="rubyHeart100" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="flameCrown100" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        {/* Outspread Golden Dragon Wings */}
        <path d="M18 10 C12 3, 4 7, 2 16 C5 19, 8 16, 9 19 C11 23, 14 26, 18 32 C22 26, 25 23, 27 19 C28 16, 31 19, 34 16 C32 7, 24 3, 18 10 Z" fill="url(#flameCrown100)" stroke="#fef08a" strokeWidth="0.6" />
        {/* Imperial Flaming Crown */}
        <path d="M11 9 L14 4 L18 8 L22 4 L25 9 L23 12 L13 12 Z" fill="url(#flameCrown100)" stroke="#fff" strokeWidth="0.5" />
        <circle cx="18" cy="4" r="1.3" fill="#fff" />
        {/* Ruby Heart Core */}
        <path d="M18 15 C15 12, 10 13, 10 18 C10 23, 18 28, 18 28 C18 28, 26 23, 26 18 C26 13, 21 12, 18 15 Z" fill="url(#rubyHeart100)" stroke="#fef08a" strokeWidth="1" />
        <circle cx="18" cy="19" r="2" fill="#fff" opacity="0.8" />
      </svg>
    );
  }

  if (tier >= 90) {
    // Tier 90-99: Pure Radiant Golden Crowned Heart
    return (
      <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="goldHeart90" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
        <path d="M17 9 C12 3, 5 7, 3 16 C6 18, 8 16, 10 18 C12 22, 14 25, 17 30 C20 25, 22 22, 24 18 C26 16, 28 18, 31 16 C29 7, 22 3, 17 9 Z" fill="url(#goldHeart90)" stroke="#fef08a" strokeWidth="0.5" />
        {/* Crown on top */}
        <path d="M12 8 L14 4 L17 7 L20 4 L22 8 Z" fill="url(#goldHeart90)" stroke="#fff" strokeWidth="0.5" />
        {/* Golden Heart */}
        <path d="M17 14 C14 11, 10 12, 10 17 C10 22, 17 26, 17 26 C17 26, 24 22, 24 17 C24 12, 20 11, 17 14 Z" fill="url(#goldHeart90)" stroke="#fff" strokeWidth="1" />
        <circle cx="17" cy="18" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 80) {
    // Tier 80-89: Crimson/Ruby Crowned Heart with Ornate Wings
    return (
      <svg viewBox="0 0 34 34" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="crimsonHeart80" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
          <linearGradient id="goldTrim80" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <path d="M17 9 C12 3, 5 7, 3 16 C6 18, 8 16, 10 18 C12 22, 14 25, 17 30 C20 25, 22 22, 24 18 C26 16, 28 18, 31 16 C29 7, 22 3, 17 9 Z" fill="url(#goldTrim80)" />
        <path d="M12 8 L14 4 L17 7 L20 4 L22 8 Z" fill="url(#goldTrim80)" stroke="#fff" strokeWidth="0.5" />
        <path d="M17 13 C14 10, 10 11, 10 16 C10 21, 17 25, 17 25 C17 25, 24 21, 24 16 C24 11, 20 10, 17 13 Z" fill="url(#crimsonHeart80)" stroke="#fde047" strokeWidth="1" />
        <circle cx="17" cy="17" r="2" fill="#fff" opacity="0.9" />
      </svg>
    );
  }

  if (tier >= 70) {
    // Tier 70-79: Fiery Golden Heart with Crown
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="fireHeart70" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M5 11 C2 15 4 20 8 23 C11 24 13 21 11 18 C8 16 8 13 10 11 Z M27 11 C30 15 28 20 24 23 C21 24 19 21 21 18 C24 16 24 13 22 11 Z" fill="url(#fireHeart70)" />
        <path d="M11 9 L13 5 L16 8 L19 5 L21 9 Z" fill="url(#fireHeart70)" stroke="#fff" strokeWidth="0.5" />
        <path d="M16 12 C13 9, 9 10, 9 15 C9 20, 16 24, 16 24 C16 24, 23 20, 23 15 C23 10, 19 9, 16 12 Z" fill="url(#fireHeart70)" stroke="#fff" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 60) {
    // Tier 60-69: Cyan/Blue Heart with Golden Crown & Wings
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="cyanHeart60" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
          <linearGradient id="goldCrown60" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <path d="M5 11 C2 15 4 20 8 23 C11 24 13 21 11 18 C8 16 8 13 10 11 Z M27 11 C30 15 28 20 24 23 C21 24 19 21 21 18 C24 16 24 13 22 11 Z" fill="url(#goldCrown60)" />
        <path d="M11 9 L13 5 L16 8 L19 5 L21 9 Z" fill="url(#goldCrown60)" stroke="#fff" strokeWidth="0.5" />
        <path d="M16 12 C13 9, 9 10, 9 15 C9 20, 16 24, 16 24 C16 24, 23 20, 23 15 C23 10, 19 9, 16 12 Z" fill="url(#cyanHeart60)" stroke="#fde047" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 50) {
    // Tier 50-59: Emerald Green Heart with Golden Crown
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="emeraldHeart50" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="goldCrown50" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <path d="M5 11 C2 15 4 20 8 23 C11 24 13 21 11 18 C8 16 8 13 10 11 Z M27 11 C30 15 28 20 24 23 C21 24 19 21 21 18 C24 16 24 13 22 11 Z" fill="url(#goldCrown50)" />
        <path d="M11 9 L13 5 L16 8 L19 5 L21 9 Z" fill="url(#goldCrown50)" stroke="#fff" strokeWidth="0.5" />
        <path d="M16 12 C13 9, 9 10, 9 15 C9 20, 16 24, 16 24 C16 24, 23 20, 23 15 C23 10, 19 9, 16 12 Z" fill="url(#emeraldHeart50)" stroke="#fde047" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 40) {
    // Tier 40-49: Magenta Ruby Heart with Golden Crown
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="magentaHeart40" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
          <linearGradient id="goldCrown40" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <path d="M11 9 L13 5 L16 8 L19 5 L21 9 Z" fill="url(#goldCrown40)" stroke="#fff" strokeWidth="0.5" />
        <path d="M16 12 C13 9, 9 10, 9 15 C9 20, 16 24, 16 24 C16 24, 23 20, 23 15 C23 10, 19 9, 16 12 Z" fill="url(#magentaHeart40)" stroke="#fde047" strokeWidth="1" />
        <circle cx="16" cy="16" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 30) {
    // Tier 30-39: Bright Rose Pink Heart with Wings
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="pinkHeart30" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
        </defs>
        <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#fda4af" />
        <path d="M16 10 C13 7, 9 8, 9 13 C9 18, 16 22, 16 22 C16 22, 23 18, 23 13 C23 8, 19 7, 16 10 Z" fill="url(#pinkHeart30)" stroke="#fff" strokeWidth="1.2" />
        <circle cx="16" cy="14" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 20) {
    // Tier 20-29: Vivid Violet/Magenta Heart with Crystal Wings
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="violetHeart20" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>
        </defs>
        <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#d8b4fe" />
        <path d="M16 10 C13 7, 9 8, 9 13 C9 18, 16 22, 16 22 C16 22, 23 18, 23 13 C23 8, 19 7, 16 10 Z" fill="url(#violetHeart20)" stroke="#fff" strokeWidth="1.2" />
        <circle cx="16" cy="14" r="2" fill="#fff" />
      </svg>
    );
  }

  if (tier >= 10) {
    // Tier 10-19: Soft Lavender Heart with Wings
    return (
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="lavenderHeart10" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>
        <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#e9d5ff" />
        <path d="M16 10 C13 7, 9 8, 9 13 C9 18, 16 22, 16 22 C16 22, 23 18, 23 13 C23 8, 19 7, 16 10 Z" fill="url(#lavenderHeart10)" stroke="#fff" strokeWidth="1.2" />
        <circle cx="16" cy="14" r="2" fill="#fff" />
      </svg>
    );
  }

  // Tier 1-9: Ice Blue Crystal Heart with Wings
  return (
    <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
      <defs>
        <linearGradient id="iceHeart1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <path d="M6 10 C3 14 5 19 8 22 C10 21 11 18 10 16 C8 14 8 12 10 10 Z M26 10 C29 14 27 19 24 22 C22 21 21 18 22 16 C24 14 24 12 22 10 Z" fill="#bae6fd" />
      <path d="M16 10 C13 7, 9 8, 9 13 C9 18, 16 22, 16 22 C16 22, 23 18, 23 13 C23 8, 19 7, 16 10 Z" fill="url(#iceHeart1)" stroke="#fff" strokeWidth="1.2" />
      <circle cx="16" cy="14" r="2" fill="#fff" />
    </svg>
  );
};

export const getTierFromLevel = (lvl: number) => {
  if (lvl >= 150) return 150;
  if (lvl >= 140) return 140;
  if (lvl >= 130) return 130;
  if (lvl >= 120) return 120;
  if (lvl >= 110) return 110;
  if (lvl >= 100) return 100;
  if (lvl >= 90) return 90;
  if (lvl >= 80) return 80;
  if (lvl >= 70) return 70;
  if (lvl >= 60) return 60;
  if (lvl >= 50) return 50;
  if (lvl >= 40) return 40;
  if (lvl >= 30) return 30;
  if (lvl >= 20) return 20;
  if (lvl >= 10) return 10;
  return 1;
};

export interface ExactBadgeProps {
  level?: number;
  tier?: number;
  displayLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

/**
 * EXACT WEALTH BADGE MATCHING SCREENSHOT 1:
 * - Number Pill on the LEFT (rounded-l-full)
 * - Shield Crest on the RIGHT (attached to pill)
 */
export const WealthBadgeExact: React.FC<ExactBadgeProps> = ({
  level,
  tier,
  displayLevel,
  size = 'md',
  onClick,
  className = '',
}) => {
  const effectiveLevel = level !== undefined ? level : (tier || 1);
  const effectiveTier = tier !== undefined ? tier : getTierFromLevel(effectiveLevel);
  const num = displayLevel !== undefined ? displayLevel : effectiveLevel;

  const getPillColor = (t: number) => {
    if (t >= 150) return 'bg-[#7e22ce]';
    if (t >= 140) return 'bg-[#312e81]';
    if (t >= 130) return 'bg-[#9a3412]';
    if (t >= 120) return 'bg-[#0e7490]';
    if (t >= 110) return 'bg-[#581c87]';
    if (t >= 100) return 'bg-[#762b16]';
    if (t >= 90) return 'bg-[#96551b]';
    if (t >= 80) return 'bg-[#ce7b1e]';
    if (t >= 70) return 'bg-[#e39c2f]';
    if (t >= 60) return 'bg-[#62a733]';
    if (t >= 50) return 'bg-[#dca11c]';
    if (t >= 40) return 'bg-[#8255e5]';
    if (t >= 30) return 'bg-[#1d63e7]';
    if (t >= 20) return 'bg-[#1ea88e]';
    if (t >= 10) return 'bg-[#644927]';
    return 'bg-[#508de0]';
  };

  const metrics = {
    sm: { h: 'h-[18px]', pl: 'pl-1.5', pr: 'pr-1.5', font: 'text-[10px]', crest: 'w-5 h-5 -ml-1.5' },
    md: { h: 'h-6', pl: 'pl-2.5', pr: 'pr-2.5', font: 'text-xs', crest: 'w-7 h-7 -ml-2.5' },
    lg: { h: 'h-7', pl: 'pl-3', pr: 'pr-3', font: 'text-sm', crest: 'w-8 h-8 -ml-3' },
  }[size];

  return (
    <div
      onClick={onClick}
      dir="ltr"
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* 1. Pill on the LEFT with Number */}
      <div
        className={`${metrics.h} ${metrics.pl} ${metrics.pr} rounded-l-full ${getPillColor(
          effectiveTier
        )} border border-r-0 border-white/20 flex items-center justify-center shadow-xs z-0`}
      >
        <span
          className={`font-mono font-black ${metrics.font} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none`}
        >
          {num}
        </span>
      </div>

      {/* 2. Shield on the RIGHT overlapping the pill */}
      <div className={`${metrics.crest} shrink-0 z-10 flex items-center justify-center filter drop-shadow-md`}>
        <WealthCrestSvg tier={effectiveTier} />
      </div>
    </div>
  );
};

/**
 * EXACT CHARM / MAGIC BADGE MATCHING SCREENSHOT 2:
 * - Number Pill on the LEFT (rounded-l-full)
 * - Heart on the RIGHT (attached to pill)
 */
export const CharmBadgeExact: React.FC<ExactBadgeProps> = ({
  level,
  tier,
  displayLevel,
  size = 'md',
  onClick,
  className = '',
}) => {
  const effectiveLevel = level !== undefined ? level : (tier || 1);
  const effectiveTier = tier !== undefined ? tier : getTierFromLevel(effectiveLevel);
  const num = displayLevel !== undefined ? displayLevel : effectiveLevel;

  const getPillColor = (t: number) => {
    if (t >= 110) return 'bg-[#701a75]';
    if (t >= 100) return 'bg-[#872714]';
    if (t >= 90) return 'bg-[#b47e20]';
    if (t >= 80) return 'bg-[#af344f]';
    if (t >= 70) return 'bg-[#c97424]';
    if (t >= 60) return 'bg-[#b89123]';
    if (t >= 50) return 'bg-[#3e984f]';
    if (t >= 40) return 'bg-[#b02865]';
    if (t >= 30) return 'bg-[#c43e79]';
    if (t >= 20) return 'bg-[#9b41bd]';
    if (t >= 10) return 'bg-[#8766d6]';
    return 'bg-[#6b9fd8]';
  };

  const metrics = {
    sm: { h: 'h-[18px]', pl: 'pl-1.5', pr: 'pr-1.5', font: 'text-[10px]', heart: 'w-5 h-5 -ml-1.5' },
    md: { h: 'h-6', pl: 'pl-2.5', pr: 'pr-2.5', font: 'text-xs', heart: 'w-7 h-7 -ml-2.5' },
    lg: { h: 'h-7', pl: 'pl-3', pr: 'pr-3', font: 'text-sm', heart: 'w-8 h-8 -ml-3' },
  }[size];

  return (
    <div
      onClick={onClick}
      dir="ltr"
      className={`inline-flex items-center select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {/* 1. Pill on the LEFT with Number */}
      <div
        className={`${metrics.h} ${metrics.pl} ${metrics.pr} rounded-l-full ${getPillColor(
          effectiveTier
        )} border border-r-0 border-white/20 flex items-center justify-center shadow-xs z-0`}
      >
        <span
          className={`font-mono font-black ${metrics.font} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none`}
        >
          {num}
        </span>
      </div>

      {/* 2. Heart on the RIGHT overlapping the pill */}
      <div className={`${metrics.heart} shrink-0 z-10 flex items-center justify-center filter drop-shadow-md`}>
        <CharmHeartSvg tier={effectiveTier} />
      </div>
    </div>
  );
};
