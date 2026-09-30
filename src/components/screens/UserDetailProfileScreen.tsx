import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WealthBadgeExact, CharmBadgeExact } from '../common/LevelIcons';
import { ShimmeringAccountName } from '../common/ShimmeringAccountName';
import { VIPBadge } from '../common/VIPBadge';
import { RoyalAccountId } from '../common/RoyalAccountId';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Edit3,
  Users,
  Award,
  Crown,
  Share2,
  MoreVertical,
  Shield,
  Sparkles,
} from 'lucide-react';

export const UserDetailProfileScreen: React.FC = () => {
  const { user, setActiveSubScreen } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'details' | 'relation'>('details');

  const copyId = () => {
    navigator.clipboard?.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAgencyId = () => {
    navigator.clipboard?.writeText(user.agencyId || user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Badges row below the rank
  const honorBadges = [
    { id: 1, icon: '👑', color: 'bg-amber-900/60 border-amber-500/70', title: 'تاج الفخامة' },
    { id: 2, icon: '💖', color: 'bg-rose-950/60 border-rose-500/70', title: 'قلب السحر' },
    { id: 3, icon: '💎', color: 'bg-blue-950/60 border-blue-500/70', title: 'الماسة الحصرية' },
    { id: 4, icon: '🛡️', color: 'bg-teal-950/60 border-teal-500/70', title: 'درع الشرف' },
    { id: 5, icon: '🏆', color: 'bg-indigo-950/60 border-indigo-500/70', title: 'كأس التميز' },
    { id: 6, icon: '⚜️', color: 'bg-amber-950/60 border-amber-400/70', title: 'ختم الملكية' },
  ];

  return (
    <div className="min-h-screen bg-[#071311] text-white pb-24 select-none font-sans relative overflow-x-hidden">
      {/* 1. TOP HERO SECTION: Golden Throne Backdrop with Couple Floating Frames */}
      <div className="relative w-full h-[375px] overflow-hidden">
        {/* Background Image: Golden Throne with spread wings & rubies */}
        <img
          src="/src/assets/images/gold_throne_avatar_bg_1790230849820.jpg"
          alt="Luxury Golden Throne"
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Emerald & Gold Vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#071311]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#071311]/40 to-[#071311]" />

        {/* Top Floating Action Bar */}
        <div className="absolute top-3 inset-x-0 px-4 flex items-center justify-between z-30">
          {/* Right chevron to go back (or close modal) */}
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 transition-transform active:scale-95 cursor-pointer"
            title="رجوع"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>

          {/* Left top controls: More options & Edit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubScreen('edit_profile')}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 transition-transform active:scale-95 cursor-pointer"
              title="تعديل الحساب"
            >
              <Edit3 size={15} className="stroke-[2.2]" />
            </button>
            <button
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white border border-white/20 cursor-pointer"
              title="خيارات"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Floating Couple Relationship Section (Two Circular Avatars connected by Pink Crystal Hearts) */}
        <div className="absolute bottom-1 inset-x-0 flex flex-col items-center justify-center z-20">
          <div className="relative flex items-center justify-center">
            {/* Female / Left Avatar with glowing gold border */}
            <div className="relative w-[78px] h-[78px] rounded-full p-[2px] bg-gradient-to-b from-[#ffd700] via-[#ffaa00] to-[#b8860b] shadow-[0_0_15px_rgba(255,215,0,0.5)] z-10">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#121c1a]">
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Connecting Romantic Glowing Heart Ribbon */}
            <div className="relative -mx-3 z-30 flex items-center justify-center">
              <div className="relative flex items-center justify-center scale-110">
                <span className="text-xl filter drop-shadow-[0_0_8px_#ec4899] animate-pulse">
                  💖
                </span>
                <span className="text-sm -ml-2 filter drop-shadow-[0_0_8px_#f43f5e]">
                  💎
                </span>
              </div>
            </div>

            {/* Male / Right Partner Avatar with glowing border */}
            <div className="relative w-[78px] h-[78px] rounded-full p-[2px] bg-gradient-to-b from-[#ffd700] via-[#ffaa00] to-[#b8860b] shadow-[0_0_15px_rgba(255,215,0,0.5)] z-10">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#121c1a]">
                <img
                  src={user.coupleAvatar || user.agencyAvatar || '/src/assets/images/male_partner_avatar_1790230886065.jpg'}
                  alt="Partner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. USER IDENTITY & BADGES SECTION (Golden Crest on Left, Name & Badges on Right) */}
      <div className="px-4 pt-1 pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          {/* Left: 3D Golden Imperial Lion Emblem Crest */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-20 h-20 relative flex items-center justify-center drop-shadow-[0_4px_12px_rgba(234,179,8,0.4)]">
              <img
                src="/src/assets/images/imperial_lion_crest_1790230829162.jpg"
                alt="Imperial Lion Crest"
                className="w-full h-full object-contain rounded-2xl filter brightness-110"
              />
            </div>
          </div>

          {/* Right: User Information and Badges */}
          <div className="flex-1 flex flex-col items-end text-right">
            {/* Line 1: Name + Gender + Tag */}
            <div className="flex items-center gap-1.5 flex-row-reverse flex-wrap justify-start">
              {/* Account Name: Plain black by default; Shimmering only when VIP */}
              <ShimmeringAccountName
                name={user.name || 'مستخدم جديد'}
                vipLevel={user.vipLevel}
                size="lg"
                showSparkles={Boolean(user.vipLevel && user.vipLevel > 0)}
              />

              {/* Gender Icon */}
              <div
                className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                  user.gender === 'female' ? 'bg-[#ec4899]' : 'bg-[#3b82f6]'
                }`}
              >
                {user.gender === 'female' ? '♀' : '♂'}
              </div>
            </div>

            {/* Line 2: Account ID (Plain black by default, VIP gradient if VIP) */}
            <div className="flex items-center mt-1.5 flex-row-reverse justify-start">
              <RoyalAccountId id={user.id} vipLevel={user.vipLevel} size="md" />
            </div>

            {/* Line 3: Rank Badges */}
            <div className="flex items-center gap-1.5 mt-2 flex-row-reverse flex-wrap">
              {/* VIP Badge - only if user has VIP */}
              {(user.vipLevel ?? 0) > 0 && (
                <VIPBadge
                  level={user.vipLevel || 1}
                  size="sm"
                  onClick={() => setActiveSubScreen('vip')}
                />
              )}

              {/* Wealth Level Badge */}
              {(user.wealthLevel ?? 0) > 0 && (
                <WealthBadgeExact
                  level={user.wealthLevel ?? user.level ?? 1}
                  size="sm"
                  onClick={() => setActiveSubScreen('wealth_level')}
                />
              )}

              {/* Charm Level Badge */}
              {(user.charmLevel ?? 0) > 0 && (
                <CharmBadgeExact
                  level={user.charmLevel ?? 1}
                  size="sm"
                  onClick={() => setActiveSubScreen('charm_level')}
                />
              )}
            </div>

            {/* Line 4: "وطني TOP1 🏆" - shown for top ranked accounts */}
            {(user.vipLevel ?? 0) >= 5 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#78350f] via-[#92400e] to-[#b45309] text-amber-200 text-[10px] font-black border border-amber-400 shadow-md">
                <span>🏆</span>
                <span>وطني TOP1</span>
                <span>⚜️</span>
              </div>
            )}

            {/* Line 5: Horizontal Row of 6 Mini Honor Badges */}
            <div className="flex items-center gap-1 mt-2.5">
              {honorBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`w-6 h-6 rounded-full ${badge.color} border flex items-center justify-center text-xs shadow-xs hover:scale-110 transition-transform`}
                  title={badge.title}
                >
                  <span>{badge.icon}</span>
                </div>
              ))}
            </div>

            {/* Line 6: User Status / Bio Quote */}
            <div className="mt-2 text-right text-[11px] text-slate-300 font-sans flex items-center gap-1 flex-row-reverse">
              <span>🕊️</span>
              <span className="text-slate-200">{user.bio || 'ماتاجرت بسمك بس تعاطيت ❗m'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EMERALD LUXURY METRICS CARD: زائر 1372 | معجبين 711 | أرسلت 26.7M | تلقى 19.4M */}
      <div className="px-4 mt-2">
        <div
          className="rounded-2xl p-3 border border-[#1b3d36] shadow-xl relative overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, #15372f 0%, #0c211c 100%)`,
          }}
        >
          {/* Subtle ornate arabesque pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="grid grid-cols-4 text-center divide-x divide-x-reverse divide-[#1a4239] relative z-10">
            {/* 1. تلقى (Received Gifts / Wealth) */}
            <div>
              <span className="block text-base font-black text-white font-mono tracking-tight">
                {user.receivedTotal || '19.4M'}
              </span>
              <span className="text-[11px] text-teal-200/70 font-bold">تلقى</span>
            </div>

            {/* 2. أرسلت (Sent Gifts) */}
            <div>
              <span className="block text-base font-black text-white font-mono tracking-tight">
                {user.sentGiftsCount || '26.7M'}
              </span>
              <span className="text-[11px] text-teal-200/70 font-bold">أرسلت</span>
            </div>

            {/* 3. معجبين (Fans / Followers) */}
            <div onClick={() => setActiveSubScreen('friends')} className="cursor-pointer">
              <span className="block text-base font-black text-white font-mono tracking-tight">
                {user.followersCount || 711}
              </span>
              <span className="text-[11px] text-teal-200/70 font-bold">معجبين</span>
            </div>

            {/* 4. زائر (Visitors) */}
            <div>
              <span className="block text-base font-black text-white font-mono tracking-tight">
                {user.visitorsCount || 1372}
              </span>
              <span className="text-[11px] text-teal-200/70 font-bold">زائر</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AGENCY (الوكالة) LUXURY CARD SECTION */}
      <div className="px-4 mt-4">
        {/* Title header: الوكالة | with teal accent line */}
        <div className="flex items-center justify-end gap-1.5 mb-1.5">
          <span className="text-xs font-black text-white">الوكالة</span>
          <span className="w-1 h-3 rounded-full bg-[#10b981]" />
        </div>

        {/* Agency Info Container */}
        <div
          onClick={() => setActiveSubScreen('agency')}
          className="rounded-2xl p-3 border border-[#1b3d36] shadow-xl relative overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all"
          style={{
            backgroundImage: `radial-gradient(circle at 100% 50%, #15372f 0%, #0a1f1b 100%)`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Left Column: ID & Members Count Pill */}
            <div className="flex flex-col items-start gap-1.5">
              {/* Members Count Badge (11 members) */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1e483e] text-amber-200 text-xs font-mono font-bold border border-emerald-600/30">
                <span>{user.agencyMembersCount || 11}</span>
                <Users size={12} className="text-amber-400" />
              </div>

              {/* Agency ID Badge with Copy */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  copyAgencyId();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#15342c] text-slate-300 text-xs font-mono border border-emerald-700/30 hover:text-white"
              >
                <span className="px-1 py-0.1 bg-emerald-700/60 rounded text-[9px] text-emerald-300 font-bold">
                  ID
                </span>
                <span>{user.agencyId || '313'}</span>
                <Copy size={11} className="text-emerald-400 rotate-180" />
              </div>
            </div>

            {/* Right Column: Agency Name & Agency Owner Avatar */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                {/* Agency Name + Iraqi Flag */}
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <span className="text-sm font-black text-white">
                    {user.agencyName || 'ملاذي'}
                  </span>
                  <span className="text-xs">🇮🇶</span>
                </div>

                {/* Owner Tag "مالك 👑" */}
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-gradient-to-r from-red-900 to-rose-700 text-amber-200 text-[10px] font-bold border border-amber-500/50 shadow-xs">
                  <span>👑</span>
                  <span>مالك</span>
                </div>
              </div>

              {/* Agency Owner Square Avatar */}
              <div className="w-13 h-13 rounded-xl overflow-hidden border border-emerald-500/40 shadow-md shrink-0 bg-slate-900">
                <img
                  src={user.agencyAvatar || '/src/assets/images/male_partner_avatar_1790230886065.jpg'}
                  alt="Agency Owner"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM TABS: تفاصيل عني | علاقتي */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-around border-b border-[#1b3d36] pb-2 text-sm font-bold text-slate-400">
          <button
            onClick={() => setActiveBottomTab('relation')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeBottomTab === 'relation'
                ? 'text-[#2dd4bf] font-black border-b-2 border-[#2dd4bf]'
                : 'hover:text-slate-200'
            }`}
          >
            علاقتي
          </button>

          <button
            onClick={() => setActiveBottomTab('details')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeBottomTab === 'details'
                ? 'text-[#2dd4bf] font-black border-b-2 border-[#2dd4bf]'
                : 'hover:text-slate-200'
            }`}
          >
            تفاصيل عني
          </button>
        </div>

        {/* Tab Submenu: هدية | غطاء الرأس | المركبة | ميدالية */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-bold px-4">
          <span className="cursor-pointer hover:text-white">هدية</span>
          <span className="cursor-pointer hover:text-white">غطاء الرأس</span>
          <span className="cursor-pointer hover:text-white">المركبة</span>
          <span
            onClick={() => setActiveSubScreen('badges')}
            className="cursor-pointer text-[#2dd4bf] hover:underline font-black"
            title="عرض الميداليات والشارات الكاملة"
          >
            ميدالية
          </span>
        </div>

        {/* Bottom Medals Showcase Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2.5 pb-4">
          <div className="flex flex-col items-center p-2 rounded-xl bg-[#0c2420] border border-[#1b3d36]">
            <span className="text-2xl">🦁</span>
            <span className="text-[10px] text-slate-300 font-bold mt-1">الأسد الملكي</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-[#0c2420] border border-[#1b3d36]">
            <span className="text-2xl">👑</span>
            <span className="text-[10px] text-slate-300 font-bold mt-1">تاج الشرف</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-[#0c2420] border border-[#1b3d36]">
            <span className="text-2xl">💎</span>
            <span className="text-[10px] text-slate-300 font-bold mt-1">الماسة الذهبية</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-[#0c2420] border border-[#1b3d36]">
            <span className="text-2xl">🦅</span>
            <span className="text-[10px] text-slate-300 font-bold mt-1">الصقر الإمبراطوري</span>
          </div>
        </div>
      </div>
    </div>
  );
};
