import { copyText } from '../../utils/clipboard';
import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check } from 'lucide-react';

// Exact dual rounded rectangle copy icon matching screenshot
export const CopyDuoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 15,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Back rounded square */}
    <rect
      x="1.75"
      y="1.75"
      width="9.5"
      height="9.5"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    {/* Front overlapping rounded square */}
    <rect
      x="4.75"
      y="4.75"
      width="9.5"
      height="9.5"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="currentColor"
      fillOpacity="0.08"
    />
  </svg>
);

interface RoyalAccountIdProps {
  id?: string;
  vipLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VIP_ID_STYLES: Record<number, { background: string; textShadow?: string }> = {
  // VIP 1-2: Silver Platinum metallic gradient
  1: {
    background: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 50%, #f8fafc 100%)',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  },
  2: {
    background: 'linear-gradient(90deg, #64748b 0%, #94a3b8 40%, #e2e8f0 100%)',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  },
  // VIP 3-4: Radiant Gold & Amber
  3: {
    background: 'linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #fef08a 100%)',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  4: {
    background: 'linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #ffffff 100%)',
    textShadow: '0 1px 3px rgba(217,119,6,0.5)',
  },
  // VIP 5: Purple Crown Amethyst
  5: {
    background: 'linear-gradient(90deg, #9333ea 0%, #c084fc 50%, #f3e8ff 100%)',
    textShadow: '0 1px 3px rgba(147,51,234,0.5)',
  },
  // VIP 6: Blue Sapphire Cyan
  6: {
    background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #e0f2fe 100%)',
    textShadow: '0 1px 3px rgba(2,132,199,0.5)',
  },
  // VIP 7: Rose Ruby Flame
  7: {
    background: 'linear-gradient(90deg, #e11d48 0%, #fb7185 50%, #ffe4e6 100%)',
    textShadow: '0 1px 3px rgba(225,29,72,0.5)',
  },
  // VIP 8: Imperial Quad Luxury (Gold/Ruby/Black/Silver) - HIGHEST VIP
  8: {
    background: 'linear-gradient(90deg, #d92626 0%, #ea580c 45%, #eab308 75%, #fde047 100%)',
    textShadow: '0 1px 3px rgba(234,88,12,0.55)',
  },
};

export const RoyalAccountId: React.FC<RoyalAccountIdProps> = ({
  id = '30301',
  vipLevel,
  size = 'md',
  className = '',
}) => {
  const { user } = useApp();
  const scheduleTimeout = useTimeouts();
  const [copied, setCopied] = useState(false);

  // If vipLevel not passed directly as prop, check if this ID is the current user's ID (clamped to max VIP 8)
  const rawVip = vipLevel !== undefined ? vipLevel : (user.id === id ? user.vipLevel : 0);
  const effectiveVip = rawVip ? Math.min(rawVip, 8) : 0;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await copyText(id)) return;
    setCopied(true);
    scheduleTimeout(() => setCopied(false), 2000);
  };

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-base font-extrabold',
    lg: 'text-lg font-black',
  }[size];

  const copyIconSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  }[size];

  // If user does not have VIP (effectiveVip === 0 or undefined):
  // Clean default plain black / neutral slate text without any gradients or effects
  const hasVip = Boolean(effectiveVip && effectiveVip > 0);
  const vipStyle = hasVip ? VIP_ID_STYLES[effectiveVip!] || VIP_ID_STYLES[1] : null;

  return (
    <div
      onClick={handleCopy}
      title={`معرف الحساب: ${id} (انقر للنسخ)`}
      className={`relative inline-flex items-center gap-1.5 cursor-pointer select-none group transition-transform active:scale-95 py-0.5 ${className}`}
      dir="ltr"
    >
      {/* 1. Left: Dual Rounded Rectangles Copy Icon */}
      <div
        className={`shrink-0 flex items-center justify-center transition-colors ${
          hasVip
            ? 'text-slate-400 group-hover:text-amber-400'
            : 'text-slate-500 group-hover:text-slate-800'
        }`}
      >
        {copied ? (
          <Check size={copyIconSizes} className="text-emerald-500 stroke-[2.5]" />
        ) : (
          <CopyDuoIcon size={copyIconSizes} />
        )}
      </div>

      {/* 2. Middle: ID Number */}
      {hasVip && vipStyle ? (
        <span
          className={`${textSizes} font-mono font-black tracking-wide select-text transition-all group-hover:brightness-110`}
          style={{
            background: vipStyle.background,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: vipStyle.textShadow ? `drop-shadow(${vipStyle.textShadow})` : undefined,
          }}
        >
          {id}
        </span>
      ) : (
        /* Default new user / non-VIP ID: Pure plain black color without any effects */
        <span
          className={`${textSizes} font-mono font-black tracking-wide select-text text-black transition-colors`}
        >
          {id}
        </span>
      )}

      {/* Copied tooltip feedback */}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold shadow-lg animate-fade-in pointer-events-none z-30 whitespace-nowrap">
          تم نسخ المعرف!
        </span>
      )}
    </div>
  );
};
