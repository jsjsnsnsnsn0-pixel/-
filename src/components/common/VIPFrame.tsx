import React from 'react';

interface VIPFrameProps {
  level?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  isSpeaking?: boolean;
}

export const VIPFrame: React.FC<VIPFrameProps> = ({
  level = 0,
  size = 'md',
  children,
  isSpeaking = false,
}) => {
  if (level === 0) {
    return (
      <div className={`relative ${isSpeaking ? 'speaking-pulse rounded-full' : ''}`}>
        {children}
      </div>
    );
  }

  // Frame gradient border styles distributed across VIP levels:
  // VIP 1-2: Silver / Platinum Shimmer (فضي)
  // VIP 3-4: 24K Imperial Gold Shimmer (ذهبي)
  // VIP 5-6: Blazing Ruby Red Flame (أحمر)
  // VIP 7: Obsidian Black & Silver/Gold Trim (أسود ملكي)
  // VIP 8: Quad Luxury Blend: Gold, Red, Black, Silver (رباعي ملكي)
  // VIP 9+: Continuous Rainbow Diamond Prism (طيف متلألئ)
  const getFrameBorder = () => {
    if (level >= 9) {
      return 'p-[3px] shimmer-badge-rainbow shadow-lg shadow-purple-500/50';
    }
    if (level === 8) {
      return 'p-[3px] shimmer-badge-quad shadow-lg shadow-amber-500/50';
    }
    if (level === 7) {
      return 'p-[2.5px] shimmer-badge-black shadow-md shadow-slate-950/80 border border-amber-400/40';
    }
    if (level >= 5) {
      return 'p-[2.5px] shimmer-badge-red shadow-md shadow-rose-600/40';
    }
    if (level >= 3) {
      return 'p-[2px] shimmer-badge-gold shadow-md shadow-amber-500/40';
    }
    return 'p-[2px] shimmer-badge-silver shadow-md shadow-slate-400/30';
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full transition-all ${getFrameBorder()} ${
        isSpeaking ? 'ring-3 ring-amber-400 ring-offset-2 ring-offset-[#0b0c16] speaking-pulse' : ''
      }`}
    >
      {/* Crown topper decoration for high VIP */}
      {level >= 7 && (
        <div className="absolute -top-2.5 inset-x-0 flex justify-center z-10 pointer-events-none drop-shadow-md">
          <span className="text-[14px]">👑</span>
        </div>
      )}
      <div className="rounded-full overflow-hidden flex items-center justify-center bg-[#0e101f]">
        {children}
      </div>
    </div>
  );
};
