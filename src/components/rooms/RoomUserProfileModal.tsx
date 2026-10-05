import React from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { ShimmeringAccountName } from '../common/ShimmeringAccountName';
import { RoyalAccountId } from '../common/RoyalAccountId';
import {
  Copy,
  Check,
  X,
  Heart,
  Crown,
  Sparkles,
  Shield,
  Star,
  Award,
} from 'lucide-react';

interface RoomUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMore?: () => void;
  targetUser?: User | null;
}

export const RoomUserProfileModal: React.FC<RoomUserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenMore,
  targetUser,
}) => {
  const { user: currentUser, setActiveSubScreen } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Use the clicked user or fallback to current logged in user
  const displayUser: User = targetUser || currentUser;

  const handleCopyId = () => {
    navigator.clipboard?.writeText(displayUser.id || '1331');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Bottom Sheet Container */}
      <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#131118]/95 via-[#0e0c12]/98 to-[#07060a] rounded-t-[32px] pt-1 pb-6 px-4 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] border-t border-amber-500/20 text-center animate-slideUp">
        {/* Subtle drag handle / top glow line */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2" />

        {/* Close Button top-left */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* ========================================================= */}
        {/* 1. TOP WINGS & AVATAR (الأجنحة الذهبية المرصعة بالياقوت) */}
        {/* ========================================================= */}
        <div className="relative flex justify-center items-center mt-1 mb-2">
          {/* Symmetrical Ruby Wings Banner Asset */}
          <div className="relative w-72 h-20 flex items-center justify-center">
            <img
              src="/assets/images/ruby_wings_frame_1790377749780.jpg"
              alt="Ruby Wings"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(239,68,68,0.4)] mix-blend-screen scale-110"
            />

            {/* Circular Avatar in the Center */}
            <div className="absolute w-16 h-16 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,215,0,0.6)] overflow-hidden bg-black flex items-center justify-center z-10">
              <img
                src={displayUser.avatar || '/assets/images/avatar_prince_arab_1790226081300.jpg'}
                alt={displayUser.name}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. USERNAME & BADGES                                      */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mt-0.5">
          {/* Agency Badge - only if user has agency */}
          {displayUser.agencyName && (
            <button
              type="button"
              onClick={() => {
                onClose();
                setActiveSubScreen('agency');
              }}
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#991b1b] to-[#dc2626] hover:from-[#b91c1c] hover:to-[#ef4444] border border-amber-400/70 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
              title={`بيانات الوكالة: ${displayUser.agencyName}`}
            >
              <span className="text-[10px] font-bold text-amber-200">
                {displayUser.agencyName}
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[8px] font-black">
                👑
              </div>
            </button>
          )}

          {/* House Badge - only if host */}
          {displayUser.isHost && (
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-xs">
              🏠
            </div>
          )}

          {/* Gender Symbol */}
          <div className={`w-4 h-4 rounded-full ${displayUser.gender === 'female' ? 'bg-[#ec4899]' : 'bg-[#0284c7]'} text-white flex items-center justify-center text-[9px] font-bold shadow-xs`}>
            {displayUser.gender === 'female' ? '♀' : '♂'}
          </div>

          {/* Username: plain black if no VIP, radiant shimmer if VIP */}
          <ShimmeringAccountName
            name={displayUser.name || 'مستخدم جديد'}
            vipLevel={displayUser.vipLevel}
            size="lg"
            showSparkles={Boolean(displayUser.vipLevel && displayUser.vipLevel > 0)}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. ID & COUNTRY ROW:  IQ 🇮🇶 | 📋 ID                      */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-slate-300">
          {/* Country Flag & Code */}
          <div className="flex items-center gap-1 font-bold text-slate-300">
            <span>{displayUser.countryCode || 'IQ'}</span>
            <span className="text-sm">{displayUser.countryFlag || '🇮🇶'}</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Royal Account ID component */}
          <RoyalAccountId
            id={displayUser.id}
            vipLevel={displayUser.vipLevel}
            size="sm"
          />

          {/* ID Badge Icon */}
          <span className="text-xs">🪪</span>
        </div>

        {/* ========================================================= */}
        {/* 4. LEVEL BADGES (Charm | Wealth | VIP)                    */}
        {/* ========================================================= */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {/* Pink Charm Level Badge */}
          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#f43f5e] to-[#ec4899] border border-pink-300/40 flex items-center gap-1 shadow-[0_2px_8px_rgba(244,63,94,0.35)]">
            <span className="text-[9px]">💖</span>
            <span className="text-[11px] font-black text-white font-mono">
              {displayUser.charmLevel || 32}
            </span>
          </div>

          {/* Golden Wealth Level Badge */}
          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] border border-yellow-200/50 flex items-center gap-1 shadow-[0_2px_8px_rgba(234,179,8,0.35)]">
            <span className="text-[9px]">🪙</span>
            <span className="text-[11px] font-black text-amber-950 font-mono">
              {displayUser.wealthLevel || displayUser.level || 53}
            </span>
          </div>

          {/* VIP Badge */}
          <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#78350f] via-[#b45309] to-[#78350f] border border-amber-400/70 flex items-center gap-1 shadow-[0_2px_8px_rgba(217,119,6,0.4)]">
            <Crown size={11} className="text-amber-300" />
            <span className="text-[11px] font-black text-amber-200 font-mono tracking-wider">
              VIP{displayUser.vipLevel || 8}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. HONOR MEDALS CAPSULE (مصفوفة الأوسمة)                   */}
        {/* ========================================================= */}
        <div className="mt-2.5 flex justify-center">
          <div className="bg-[#1b1924]/80 border border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 shadow-inner">
            {/* Medal 1: Gold Star Crown */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full rounded-full bg-amber-950 flex items-center justify-center text-[10px]">
                ⭐
              </div>
            </div>

            {/* Medal 2: Purple Laurel 20M */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-400 p-0.5 flex items-center justify-center shadow-xs relative">
              <div className="w-full h-full rounded-full bg-purple-950 flex flex-col items-center justify-center">
                <span className="text-[8px]">👑</span>
                <span className="text-[6px] font-black text-purple-200 -mt-1 font-mono">20M</span>
              </div>
            </div>

            {/* Medal 3: Gift Crown 20M */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-300 p-0.5 flex items-center justify-center shadow-xs relative">
              <div className="w-full h-full rounded-full bg-blue-950 flex flex-col items-center justify-center">
                <span className="text-[8px]">🎁</span>
                <span className="text-[6px] font-black text-cyan-200 -mt-1 font-mono">20M</span>
              </div>
            </div>

            {/* Medal 4: Dollar Laurel 5M */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 p-0.5 flex items-center justify-center shadow-xs relative">
              <div className="w-full h-full rounded-full bg-amber-950 flex flex-col items-center justify-center">
                <span className="text-[8px] text-amber-300 font-bold">$</span>
                <span className="text-[6px] font-black text-amber-200 -mt-1 font-mono">5M</span>
              </div>
            </div>

            {/* Medal 5: Red Star Shield 6 */}
            <div className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 flex items-center gap-0.5 shadow-xs">
              <span className="text-[8px] font-black text-white font-mono">6</span>
              <span className="text-[8px] text-yellow-300">✪</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. CP / COUPLE BOND CARD (بطاقة الكبل / شريك الحياة)       */}
        {/* ========================================================= */}
        <div className="mt-3 relative w-full rounded-[22px] overflow-hidden border border-pink-400/40 shadow-[0_6px_24px_rgba(244,63,94,0.25)] bg-gradient-to-r from-[#2a0820] via-[#400d33] to-[#2a0820] p-2.5">
          {/* Background Ambient Stars Asset */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.5), transparent 70%)',
            }}
          />

          {/* Ornate Gold Filigree Corners */}
          <span className="absolute top-1 left-1.5 text-xs text-amber-300 opacity-70">✦</span>
          <span className="absolute top-1 right-1.5 text-xs text-amber-300 opacity-70">✦</span>
          <span className="absolute bottom-1 left-1.5 text-xs text-amber-300 opacity-70">✦</span>
          <span className="absolute bottom-1 right-1.5 text-xs text-amber-300 opacity-70">✦</span>

          {/* Center Couple Content */}
          <div className="relative z-10 flex items-center justify-between px-1">
            {/* Left: Female Partner (xنَفِسهـ🍁) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Heart-Shaped Golden Rose Frame */}
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-300 to-amber-200 shadow-[0_0_12px_rgba(244,63,94,0.5)] flex items-center justify-center">
                  <img
                    src="/assets/images/female_luxury_avatar_1790230899789.jpg"
                    alt="xنَفِسهـ"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -left-1 text-[11px]">🌹</span>
                <span className="absolute -top-1 -right-1 text-[11px]">💖</span>
              </div>
              <span className="text-[10px] font-bold text-pink-200 mt-1 truncate max-w-[70px]">
                xنَفِسهـ🍁
              </span>
              <span className="text-[9px] font-black text-amber-300 font-mono">LV.5</span>
            </div>

            {/* Center: Winged Glowing Crystal Pink Heart (263 أيام) */}
            <div className="flex flex-col items-center justify-center px-1">
              {/* Roman Numeral IV with Wings */}
              <div className="flex items-center gap-1 -mb-1">
                <span className="text-[10px] text-pink-300">🪽</span>
                <span className="text-[10px] font-black text-amber-300 font-serif tracking-widest">
                  IV
                </span>
                <span className="text-[10px] text-pink-300">🪽</span>
              </div>

              {/* Glowing Heart with Days Counter */}
              <div className="w-16 h-14 relative flex flex-col items-center justify-center filter drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]">
                <svg viewBox="0 0 32 32" className="w-full h-full fill-gradient">
                  <defs>
                    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#be185d" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#heartGrad)"
                    stroke="#fed7aa"
                    strokeWidth="1.2"
                    d="M16 28 C16 28 3 19 3 10 C3 5 7 2 12 2 C14.5 2 15.5 3.5 16 4.5 C16.5 3.5 17.5 2 20 2 C25 2 29 5 29 10 C29 19 16 28 16 28 Z"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-xs font-black font-mono tracking-tight drop-shadow-md">
                    263
                  </span>
                  <span className="text-[8px] font-bold text-pink-100 -mt-0.5">أيام</span>
                </div>
              </div>

              {/* Progress Bar 25M / 7571377 */}
              <div className="w-24 mt-1">
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-pink-400/40 p-[0.5px]">
                  <div className="w-[65%] h-full bg-gradient-to-r from-amber-400 to-pink-500 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-[7px] font-mono text-pink-200 mt-0.5">
                  <span>25M</span>
                  <span className="text-amber-300">7571377</span>
                </div>
              </div>
            </div>

            {/* Right: Male Partner (»xدولة العراق...«) */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Heart-Shaped Golden Rose Frame */}
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_12px_rgba(234,179,8,0.5)] flex items-center justify-center">
                  <img
                    src={displayUser.avatar || currentUser.avatar || '/assets/images/avatar_prince_arab_1790226081300.jpg'}
                    alt="xدولة العراق"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 text-[11px]">🌹</span>
                <span className="absolute -top-1 -left-1 text-[11px]">💖</span>
              </div>
              <span className="text-[10px] font-bold text-amber-200 mt-1 truncate max-w-[70px]">
                »xدولة العراق...«
              </span>
              <span className="text-[9px] font-black text-amber-300 font-mono">LV.4</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 7. MINT GREEN ACTION BUTTON:  المزيد                      */}
        {/* ========================================================= */}
        <div className="mt-3.5 px-2">
          <button
            type="button"
            onClick={() => {
              if (onOpenMore) {
                onOpenMore();
              } else {
                onClose();
              }
            }}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#2cdb7f] to-[#1ec76f] hover:from-[#25c672] hover:to-[#19b563] active:scale-[0.99] text-white font-black text-base shadow-[0_6px_20px_rgba(44,219,127,0.35)] transition-all cursor-pointer"
          >
            المزيد
          </button>
        </div>
      </div>
    </div>
  );
};
