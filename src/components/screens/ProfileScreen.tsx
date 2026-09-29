import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WealthBadgeExact, CharmBadgeExact } from '../common/LevelIcons';
import { ShimmeringAccountName } from '../common/ShimmeringAccountName';
import { VIPBadge } from '../common/VIPBadge';
import { RoyalAccountId } from '../common/RoyalAccountId';
import {
  ChevronLeft,
  Copy,
  Check,
  Edit,
  Edit3,
  Heart,
  Star,
  Wallet,
  Home as HomeIcon,
  ShoppingBag,
  Bookmark,
  Award,
  Sparkles,
  Coins,
  Headphones,
  Settings,
  Camera,
  LogOut,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { user, setActiveSubScreen, joinRoom, rooms, logout } = useApp();
  const [copied, setCopied] = useState(false);

  const copyUserId = () => {
    navigator.clipboard?.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open user's own room or join first room
  const handleOpenMyRoom = () => {
    const myRoom = rooms.find((r) => r.owner.id === user.id) || rooms[0];
    if (myRoom) {
      joinRoom(myRoom);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf6ee] via-[#f4faf6] to-[#f8fafc] text-slate-800 pb-24 select-none">
      {/* Top Bar with Profile Edit Icon and LogOut / Switch Account Button */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => setActiveSubScreen('edit_profile')}
          className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center cursor-pointer shadow-xs transition-transform active:scale-95 border border-slate-200/60"
          title="تعديل الملف الشخصي والصورة والاسم"
        >
          <Edit3 size={20} className="stroke-[2] text-slate-700" />
        </button>

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-rose-50 text-rose-600 border border-slate-200/60 text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-95"
          title="تسجيل الخروج وإعادة تسجيل الدخول"
        >
          <LogOut size={14} className="stroke-[2.5]" />
          <span>تبديل الحساب</span>
        </button>
      </div>

      {/* Main Profile Info Section (Avatar on the Right, Info on the Left) */}
      <div className="px-5 pt-1 pb-4 flex items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex-1">
          {/* Row 1: Name, Gender & Detail Profile Chevron */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSubScreen('user_detail_profile')}
              className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="عرض الملف الشخصي الكامل والشارات"
            >
              <ChevronLeft size={18} className="stroke-[2.5]" />
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer group"
              title="اسم الحساب"
            >
              {/* Custom Tag ملاذي 👑 - only shown if user has agency */}
              {user.agencyName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubScreen('agency');
                  }}
                  className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#991b1b] to-[#dc2626] hover:from-[#b91c1c] hover:to-[#ef4444] border border-amber-400/70 flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-transform"
                  title={`بيانات الوكالة: ${user.agencyName}`}
                >
                  <span className="text-[10px] font-bold text-amber-200">{user.agencyName}</span>
                  <span className="text-[8px]">👑</span>
                </button>
              )}

              <ShimmeringAccountName
                name={user.name || 'مستخدم جديد'}
                vipLevel={user.vipLevel}
                size="xl"
                showSparkles={Boolean(user.vipLevel && user.vipLevel > 0)}
                onClick={() => setActiveSubScreen('user_detail_profile')}
              />
              {/* Gender Badge */}
              <div
                className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[11px] font-bold shadow-xs shrink-0 ${
                  user.gender === 'female' ? 'bg-[#ec4899]' : 'bg-[#5b96f7]'
                }`}
              >
                {user.gender === 'female' ? '♀' : '♂'}
              </div>
            </div>
          </div>

          {/* Row 2: Account ID and Country Flag */}
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="text-xs font-bold text-slate-500 font-mono">
              {user.countryCode || 'IQ'} {user.countryFlag || '🇮🇶'}
            </span>
            <RoyalAccountId id={user.id} vipLevel={user.vipLevel} size="md" />
          </div>

          {/* Row 3: Rank Badges: Charm Level, Wealth Level, VIP Badge */}
          <div className="flex items-center justify-end gap-1.5 mt-2 flex-wrap">
            {/* Charm Level Badge */}
            {(user.charmLevel ?? 0) > 0 && (
              <CharmBadgeExact
                level={user.charmLevel ?? 1}
                size="sm"
                onClick={() => setActiveSubScreen('charm_level')}
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

            {/* Winged VIP Badge (only if user has VIP) */}
            {(user.vipLevel ?? 0) > 0 && (
              <VIPBadge
                level={user.vipLevel || 1}
                size="sm"
                onClick={() => setActiveSubScreen('vip')}
              />
            )}
          </div>
        </div>

        {/* Right Avatar with Circular Frame */}
        <div
          onClick={() => setActiveSubScreen('user_detail_profile')}
          className="relative shrink-0 cursor-pointer group"
          title="عرض الملف الشخصي"
        >
          <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-900 ring-2 ring-slate-200/60 relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Statistics Row: زائر | متابعين | متابعة */}
      <div className="px-6 py-3">
        <div className="grid grid-cols-3 text-center">
          {/* Column 1: زائر */}
          <div>
            <span className="block text-xl font-black text-slate-900 font-mono">
              {user.visitorsCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">زائر</span>
          </div>

          {/* Column 2: متابعين */}
          <div
            onClick={() => setActiveSubScreen('friends')}
            className="cursor-pointer"
          >
            <span className="block text-xl font-black text-slate-900 font-mono">
              {user.followersCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">متابعين</span>
          </div>

          {/* Column 3: متابعة */}
          <div
            onClick={() => setActiveSubScreen('friends')}
            className="cursor-pointer"
          >
            <span className="block text-xl font-black text-slate-900 font-mono">
              {user.followingCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">متابعة</span>
          </div>
        </div>
      </div>

      {/* VIP Luxury Card Banner */}
      <div className="px-5 mt-2">
        <div
          onClick={() => setActiveSubScreen('vip')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17161b] via-[#211e26] to-[#141318] p-3 text-white flex items-center justify-between shadow-md cursor-pointer hover:shadow-lg transition-all border border-amber-500/20"
          style={{
            backgroundImage: `radial-gradient(ellipse at 80% 50%, rgba(245, 158, 11, 0.15), transparent 70%), linear-gradient(135deg, #111015 0%, #1e1b24 50%, #111015 100%)`,
          }}
        >
          {/* Left: check now link */}
          <div className="flex items-center gap-1 text-[11px] text-[#e6ca95] font-semibold hover:text-amber-300">
            <ChevronLeft size={14} className="stroke-[2.5]" />
            <span className="tracking-wide">check now</span>
          </div>

          {/* Right: VIP Diamond */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-amber-300 tracking-wider">
              {user.vipLevel && user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'VIP'}
            </span>
            <span className="text-lg">💎</span>
          </div>
        </div>
      </div>

      {/* 4 Circular Action Buttons: محفظة | غرفتي | المتجر | وكالة */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* 1. محفظة / شحن */}
          <div
            onClick={() => setActiveSubScreen('recharge')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ffede2] text-[#ff7828] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all">
              <Wallet size={24} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">شحن / محفظة</span>
          </div>

          {/* 2. غرفتي */}
          <div
            onClick={handleOpenMyRoom}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#f4eefd] text-[#a855f7] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all relative">
              <HomeIcon size={24} className="stroke-[2.2]" />
              <Heart size={10} className="absolute inset-0 m-auto fill-[#a855f7] translate-y-0.5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">غرفتي</span>
          </div>

          {/* 3. المتجر */}
          <div
            onClick={() => setActiveSubScreen('store')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ffeef3] text-[#f43f5e] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all">
              <ShoppingBag size={24} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">المتجر</span>
          </div>

          {/* 4. وكالة */}
          <div
            onClick={() => setActiveSubScreen('agency')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#e6f9fa] text-[#06b6d4] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all">
              <Bookmark size={24} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">وكالة</span>
          </div>
        </div>
      </div>

      {/* Menu List Items Card */}
      <div className="px-5 mt-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-50 overflow-hidden">
          {/* 1. شارة */}
          <div
            onClick={() => setActiveSubScreen('badges')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">شارة</span>
              <div className="w-8 h-8 rounded-full bg-[#4f86f7] text-white flex items-center justify-center shadow-xs">
                <Star size={16} className="fill-white" />
              </div>
            </div>
          </div>

          {/* 2. السحر/ الثروة */}
          <div
            onClick={() => setActiveSubScreen('charm_wealth')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">السحر/ الثروة</span>
              <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-xs">
                <Sparkles size={16} className="fill-white" />
              </div>
            </div>
          </div>

          {/* 3. اكسب عملات فضية */}
          <div
            onClick={() => setActiveSubScreen('silver_coins')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />
              <span className="px-2.5 py-0.5 rounded-full bg-[#f59e0b] text-white text-[11px] font-black">
                جديد
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">اكسب عملات فضية</span>
              <div className="w-8 h-8 rounded-full bg-[#9333ea] text-white flex items-center justify-center shadow-xs">
                <Coins size={16} />
              </div>
            </div>
          </div>

          {/* 4. مركز المساعدة */}
          <div
            onClick={() => setActiveSubScreen('help_center')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">مركز المساعدة</span>
              <div className="w-8 h-8 rounded-full bg-[#06b6d4] text-white flex items-center justify-center shadow-xs">
                <Headphones size={16} />
              </div>
            </div>
          </div>

          {/* 5. اعدادات */}
          <div
            onClick={() => setActiveSubScreen('settings')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">اعدادات</span>
              <div className="w-8 h-8 rounded-full bg-[#a855f7] text-white flex items-center justify-center shadow-xs">
                <Settings size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
