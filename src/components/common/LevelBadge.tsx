import React from 'react';
import { WealthCrestSvg } from './LevelIcons';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'md',
  className = '',
  onClick,
}) => {
  // Determine tier base (1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150)
  const getTier = (lvl: number) => {
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

  const tier = getTier(level);

  // Exact pill color from the user's screenshot
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
    sm: {
      h: 'h-[18px]',
      pl: 'pl-1.5',
      pr: 'pr-1.5',
      font: 'text-[10px]',
      crest: 'w-5 h-5 -ml-1.5',
    },
    md: {
      h: 'h-5',
      pl: 'pl-2',
      pr: 'pr-2',
      font: 'text-[11px]',
      crest: 'w-6 h-6 -ml-2',
    },
    lg: {
      h: 'h-6',
      pl: 'pl-2.5',
      pr: 'pr-2.5',
      font: 'text-xs',
      crest: 'w-7 h-7 -ml-2.5',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      dir="ltr"
      className={`inline-flex items-center select-none cursor-pointer group active:scale-95 transition-transform ${className}`}
    >
      {/* 1. Pill on the LEFT with user's actual level */}
      <div
        className={`${metrics.h} ${metrics.pl} ${metrics.pr} rounded-l-full ${getPillColor(
          tier
        )} border border-r-0 border-white/30 flex items-center justify-center shadow-xs z-0`}
      >
        <span
          className={`font-mono font-black ${metrics.font} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none`}
        >
          {level}
        </span>
      </div>

      {/* 2. Shield on the RIGHT matching user's level tier */}
      <div
        className={`${metrics.crest} shrink-0 z-10 flex items-center justify-center filter drop-shadow-md`}
      >
        <WealthCrestSvg tier={tier} />
      </div>
    </div>
  );
};
