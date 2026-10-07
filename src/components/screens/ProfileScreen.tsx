import { copyText } from '../../utils/clipboard';
import { setImageFallback } from '../../utils/imageFallback';
import { useTimeouts } from '../../hooks/useTimeouts';
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
  PackageOpen,
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
  const {
    user,
    setActiveSubScreen,
    setSelectedChatUser,
    joinRoom,
    rooms,
    logout,
    hasUnseenVisitors,
    hasUnseenFollowers,
    markVisitorsAsSeen,
    markFollowersAsSeen,
  } = useApp();
  const scheduleTimeout = useTimeouts();
  const [copied, setCopied] = useState(false);

  const copyUserId = async () => {
    if (!await copyText(user.id)) return;
    setCopied(true);
    scheduleTimeout(() => setCopied(false), 2000);
  };

  // Open user's own room or join first room
  const handleOpenMyRoom = () => {
    const myRoom = rooms.find((r) => r.owner.id === user.id) || rooms[0];
    if (myRoom) {
      joinRoom(myRoom);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f4f5f8] text-slate-800 pb-28 select-none overflow-x-hidden">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_18%_10%,rgba(250,204,21,.22),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(168,85,247,.28),transparent_36%),linear-gradient(145deg,#121728_0%,#17233a_48%,#0f3f36_100%)]" />
      <div aria-hidden="true" className="absolute top-24 -left-14 w-40 h-40 rounded-full bg-emerald-300/10 blur-3xl" />
      {/* Top Bar with Profile Edit Icon */}
      <div className="relative z-10 px-5 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => setActiveSubScreen('edit_profile')}
          className="w-11 h-11 rounded-2xl bg-white/12 hover:bg-white/18 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95 border border-white/15 backdrop-blur-xl"
          title="تعديل الملف الشخصي والصورة والاسم"
        >
          <Edit3 size={20} className="stroke-[2] text-white" />
        </button>

        <div className="w-10" />
      </div>

      {/* Main Profile Info Section (Avatar on the Right, Info on the Left) */}
      <div className="relative z-10 mx-4 mt-8 p-4 flex items-center justify-between gap-4 rounded-[28px] bg-white/90 border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,.16)] backdrop-blur-xl">
        {/* Left Info Column */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name, Gender & Detail Profile Chevron */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectedChatUser(null); setActiveSubScreen('user_detail_profile'); }}
              className="ui-icon-button rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="عرض الملف الشخصي الكامل والشارات"
            >
              <ChevronLeft size={18} className="stroke-[2.5]" />
            </button>

            <div
              className="min-w-0 flex items-center gap-2 cursor-pointer group"
              title="اسم الحساب"
            >
              <ShimmeringAccountName
                name={user.name || 'مستخدم جديد'}
                vipLevel={user.vipLevel}
                size="xl"
                showSparkles={Boolean(user.vipLevel && user.vipLevel > 0)}
                onClick={() => { setSelectedChatUser(null); setActiveSubScreen('user_detail_profile'); }}
              />
              {/* Gender Badge */}
              {user.gender && <div
                className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[11px] font-bold shadow-xs shrink-0 ${
                  user.gender === 'female' ? 'bg-[#ec4899]' : 'bg-[#5b96f7]'
                }`}
              >
                {user.gender === 'female' ? '♀' : '♂'}
              </div>}
            </div>
          </div>

          {/* Row 2: Account ID and Country Flag */}
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="text-xs font-bold text-slate-500 font-mono">
              {user.countryCode} {user.countryFlag}
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
        <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
          onClick={() => { setSelectedChatUser(null); setActiveSubScreen('user_detail_profile'); }}
          className="relative shrink-0 cursor-pointer group"
          title="عرض الملف الشخصي"
        >
          <div className="w-[92px] h-[92px] rounded-full overflow-hidden border-[3px] border-white shadow-[0_10px_28px_rgba(15,23,42,.24)] bg-transparent ring-4 ring-amber-300/35 relative">
            <img
              src={user.avatar || '/assets/images/default_arab_user_avatar_1790806239365.jpg'}
              onError={(e) => setImageFallback(e, '/assets/images/default_arab_user_avatar_1790806239365.jpg')}
              alt={user.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Statistics Row: زائر | متابعين | متابعة */}
      <div className="relative z-10 mx-4 mt-3 p-3 rounded-3xl bg-white/92 border border-slate-200/70 shadow-sm">
        <div className="grid grid-cols-4 text-center divide-x divide-x-reverse divide-slate-100">
          {/* Column 1: زائر */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => {
              markVisitorsAsSeen();
              setActiveSubScreen('visitors');
            }}
            className="cursor-pointer relative group"
          >
            <div className="inline-block relative">
              <span className="block text-xl font-black text-slate-900 font-mono">
                {user.visitorsCount || 0}
              </span>
              {hasUnseenVisitors && (
                <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping ring-2 ring-white" />
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium block">زائر</span>
          </div>

          {/* Column 2: متابعين */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => {
              markFollowersAsSeen();
              setActiveSubScreen('friends');
            }}
            className="cursor-pointer relative group"
          >
            <div className="inline-block relative">
              <span className="block text-xl font-black text-slate-900 font-mono">
                {user.followersCount || 0}
              </span>
              {hasUnseenFollowers && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border border-white">
                  +1
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium block">متابعين</span>
          </div>

          <button type="button" onClick={()=>setActiveSubScreen('friends')} className="cursor-pointer"><span className="block text-xl font-black text-slate-900 font-mono">{user.friendsCount||0}</span><span className="text-xs text-slate-500">الأصدقاء</span></button>
          {/* Column 3: متابعة */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => setActiveSubScreen('friends')}
            className="cursor-pointer"
          >
            <span className="block text-xl font-black text-slate-900 font-mono">
              {user.followingCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium block">متابعة</span>
          </div>
        </div>
      </div>

      {/* VIP Luxury Card Banner */}
      <div className="relative z-10 px-4 mt-3">
        <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
          onClick={() => setActiveSubScreen('vip')}
          className="relative overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_88%_20%,rgba(251,191,36,.30),transparent_30%),linear-gradient(135deg,#151827,#28213d_55%,#4a3214)] p-5 text-white flex items-center justify-between shadow-[0_16px_34px_rgba(15,23,42,.18)] cursor-pointer hover:shadow-xl transition-all border border-amber-300/25"

        >
          {/* Left: عرض المزايا link */}
          <div className="flex items-center gap-1 text-[11px] text-amber-800 font-semibold hover:text-amber-300">
            <ChevronLeft size={14} className="stroke-[2.5]" />
            <span className="tracking-wide">عرض المزايا</span>
          </div>

          {/* Right: VIP Diamond */}
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-amber-200 tracking-wider">
              {user.vipLevel && user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'VIP'}
            </span>
            <span className="text-lg">💎</span>
          </div>
        </div>
      </div>

      {/* 4 Circular Action Buttons: محفظة | غرفتي | المتجر | وكالة */}
      <div className="relative z-10 mx-4 mt-4 rounded-[28px] bg-white/88 border border-white shadow-sm p-4 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* 1. محفظة / شحن */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => setActiveSubScreen('recharge')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ffede2] text-[#ff7828] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all">
              <Wallet size={24} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">شحن / محفظة</span>
          </div>

          {/* 2. غرفتي */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => setActiveSubScreen('store')}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ffeef3] text-[#f43f5e] flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all">
              <ShoppingBag size={24} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-1.5">المتجر</span>
          </div>

          {/* 4. وكالة */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
      <div className="relative z-10 px-4 mt-4">
        <div className="bg-white/92 rounded-[28px] border border-white shadow-[0_12px_32px_rgba(15,23,42,.07)] divide-y divide-slate-100/80 overflow-hidden backdrop-blur-xl">
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
            onClick={() => setActiveSubScreen('inventory')}
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300 stroke-[2]" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">الحقيبة</span>
              <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-xs">
                <PackageOpen size={16} />
              </div>
            </div>
          </div>

          {/* 1. شارة */}
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
          <div role="button" tabIndex={0} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();event.currentTarget.click();}}}
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
