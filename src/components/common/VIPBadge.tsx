import React from 'react';
import { Crown } from 'lucide-react';

interface VIPBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const VIPBadge: React.FC<VIPBadgeProps> = ({
  level,
  size = 'md',
  className = '',
  onClick,
}) => {
  if (level <= 0) return null;

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-0.5 shadow-xs',
    md: 'text-[11px] px-2.5 py-0.5 gap-1 shadow-sm',
    lg: 'text-xs px-3.5 py-1 gap-1.5 font-bold shadow-md',
  };

  const iconSizes = {
    sm: 9,
    md: 11,
    lg: 14,
  };

  // Distinct colors and luxury styling for each VIP tier:
  // VIP 1: Bronze Deer
  // VIP 2: Ice Blue Eagle
  // VIP 3: Champagne Gold Wolf
  // VIP 4: Emerald Jade Leopard
  // VIP 5: Purple Amethyst Bear
  // VIP 6: Sapphire Cyan Tiger
  // VIP 7: Hot Pink / Ruby Flame Phoenix
  // VIP 8: Obsidian Black & 24K Gold Lion
  // VIP 9+: Rainbow Prism
  const clampedLevel = Math.min(Math.max(1, level), 8);

  const getBadgeStyle = () => {
    switch (clampedLevel) {
      case 1:
        return 'bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#b45309] text-amber-100 border border-amber-400/80 shadow-amber-900/40';
      case 2:
        return 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8] text-white border border-sky-300 shadow-sky-500/40';
      case 3:
        return 'bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] text-slate-950 font-black border border-yellow-200 shadow-amber-500/40';
      case 4:
        return 'bg-gradient-to-r from-[#065f46] via-[#059669] to-[#10b981] text-emerald-50 border border-emerald-300 shadow-emerald-500/40';
      case 5:
        return 'bg-gradient-to-r from-[#6b21a8] via-[#7e22ce] to-[#a855f7] text-purple-50 border border-purple-300 shadow-purple-500/40';
      case 6:
        return 'bg-gradient-to-r from-[#0c4a6e] via-[#0284c7] to-[#06b6d4] text-white border border-cyan-200 shadow-cyan-500/40';
      case 7:
        return 'bg-gradient-to-r from-[#9f1239] via-[#e11d48] to-[#f43f5e] text-white border border-pink-200 shadow-rose-500/40';
      case 8:
      default:
        return 'bg-gradient-to-r from-[#18181b] via-[#27272a] to-[#18181b] text-[#fef08a] border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
    }
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-black tracking-tight shrink-0 select-none transition-transform active:scale-95 cursor-pointer ${getBadgeStyle()} ${sizeClasses[size]} ${className}`}
    >
      <Crown size={iconSizes[size]} className="fill-current drop-shadow-xs" />
      <span>VIP{level}</span>
    </span>
  );
};
