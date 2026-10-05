import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useRealtimeRankings } from '../../context/RealtimeRankingsContext';
import { ChevronDown, Search } from 'lucide-react';
import { SpecialIdModal } from '../modals/SpecialIdModal';
import { AgencyOpeningModal } from '../modals/AgencyOpeningModal';
import { SoulmatesWeeklyModal } from '../modals/SoulmatesWeeklyModal';
import { CustomGiftModal } from '../modals/CustomGiftModal';
import { RechargeActivityModal } from '../modals/RechargeActivityModal';

export const HomeScreen: React.FC = () => {
  const { rooms, joinRoom, setActiveSubScreen } = useApp();
  const { wealthRankings, charmRankings, roomRankings } = useRealtimeRankings();

  // Top header tab: حفلة | ملكي | اكتشف
  const [activeTopTab, setActiveTopTab] = useState<'party' | 'royal' | 'discover'>('party');

  // Filter bar: trending | iraq | saudi
  const [selectedFilter, setSelectedFilter] = useState<'trending' | 'iraq' | 'saudi'>('trending');
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  // Modal for displaying the official Special ID rules image (المعرف الجميل)
  const [showSpecialIdModal, setShowSpecialIdModal] = useState(false);

  // Modal for displaying the official Agency Opening rules image (نشاط فتح الوكالات)
  const [showAgencyModal, setShowAgencyModal] = useState(false);

  // Modal for displaying the official Soulmates Weekly event image (رفقاء الروح الاسبوعيه)
  const [showSoulmatesModal, setShowSoulmatesModal] = useState(false);

  // Modal for displaying the official Custom Gift poster (قيمة الشحن التراكمي الشهري $1500)
  const [showCustomGiftModal, setShowCustomGiftModal] = useState(false);

  // Modal for displaying the official Recharge Activity tiers ($9.9 to $10,000)
  const [showRechargeActivityModal, setShowRechargeActivityModal] = useState(false);

  // Top Rotating Banners Carousel (6 لوحات منعزلة: المعرف المميز + رفقاء الروح + افتتاح الوكالة + نشاط إعادة الشحن + هدية مخصصة + النجم العالمي)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const banners = [
    {
      id: 'distinguished_id',
      title: 'المعرف المميز - Toti Chat',
      image: '/assets/images/toti_distinguished_id_1790717836703.jpg',
      action: () => setShowSpecialIdModal(true),
    },
    {
      id: 'soulmates',
      title: 'رفقاء الروح الأسبوعية',
      image: '/assets/images/soulmates_exact_banner_1790725479589.jpg',
      action: () => setShowSoulmatesModal(true),
    },
    {
      id: 'agency_opening',
      title: 'افتتاح الوكالة جديده - Toty Chat',
      image: '/assets/images/agency_opening_banner_1790725265910.jpg',
      action: () => setShowAgencyModal(true),
    },
    {
      id: 'recharge_activity',
      title: 'نشاط إعادة الشحن',
      image: '/assets/images/recharge_activity_banner_1790725680784.jpg',
      action: () => setShowRechargeActivityModal(true),
    },
    {
      id: 'custom_gift',
      title: 'هدية مخصصة',
      image: '/assets/images/custom_gift_banner_1790726268730.jpg',
      action: () => setShowCustomGiftModal(true),
    },
    {
      id: 'global_star',
      title: 'النجم العالمي',
      image: '/assets/images/global_star_banner_1790726285845.jpg',
      action: () => setActiveSubScreen('charm_wealth'),
    },
  ];

  // Auto-scroll banners smoothly every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diffX > 40) {
      // Swiped right -> previous
      setActiveBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    } else if (diffX < -40) {
      // Swiped left -> next
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }
    touchStartXRef.current = null;
  };

  // Real Top 1, 2, 3 for Cards
  const wealthTop1 = wealthRankings && wealthRankings.length > 0 ? wealthRankings[0] : null;
  const wealthTop2 = wealthRankings && wealthRankings.length > 1 ? wealthRankings[1] : null;
  const wealthTop3 = wealthRankings && wealthRankings.length > 2 ? wealthRankings[2] : null;

  const charmTop1 = charmRankings && charmRankings.length > 0 ? charmRankings[0] : null;
  const charmTop2 = charmRankings && charmRankings.length > 1 ? charmRankings[1] : null;
  const charmTop3 = charmRankings && charmRankings.length > 2 ? charmRankings[2] : null;

  const roomTop1 = roomRankings && roomRankings.length > 0 ? roomRankings[0] : null;
  const roomTop2 = roomRankings && roomRankings.length > 1 ? roomRankings[1] : null;
  const roomTop3 = roomRankings && roomRankings.length > 2 ? roomRankings[2] : null;

  return (
    <div
      className="min-h-screen pb-24 select-none font-sans text-slate-800 transition-colors duration-300"
      dir="rtl"
      style={{
        background: activeTopTab === 'discover'
          ? '#0c0d12'
          : 'linear-gradient(180deg, #1fa373 0%, #30b885 120px, #a8dfc2 320px, #e4f7ed 580px, #f2faf6 100%)',
      }}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER: Icons on Left, Tabs on Right                     */}
      {/* ============================================================== */}
      <header className={`sticky top-0 z-30 pt-3 pb-2.5 px-3.5 flex items-center justify-between backdrop-blur-xs transition-colors duration-300 ${
        activeTopTab === 'discover' ? 'bg-[#0c0d12]/90 border-b border-white/10' : ''
      }`}>
        {/* Right: Text Tabs (حفلة | ملكي | اكتشف | ترتيب) */}
        <div className="flex items-center gap-3.5 font-bold">
          <button
            type="button"
            onClick={() => setActiveTopTab('party')}
            className={`transition-all cursor-pointer ${
              activeTopTab === 'party'
                ? 'text-[#063321] text-[22px] font-black scale-105'
                : activeTopTab === 'discover'
                  ? 'text-slate-400 hover:text-white text-base'
                  : 'text-emerald-900/70 hover:text-emerald-950 text-base'
            }`}
          >
            حفلة
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTopTab('royal');
              setActiveSubScreen('vip');
            }}
            className={`text-base font-bold transition-all cursor-pointer ${
              activeTopTab === 'royal'
                ? 'text-[#063321] font-black'
                : activeTopTab === 'discover'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-emerald-900/70 hover:text-emerald-950'
            }`}
          >
            ملكي
          </button>
          <button
            type="button"
            onClick={() => setActiveTopTab('discover')}
            className={`transition-all cursor-pointer ${
              activeTopTab === 'discover'
                ? 'text-amber-400 text-[22px] font-black scale-105 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'text-emerald-900/70 hover:text-emerald-950 text-base'
            }`}
          >
            اكتشف
          </button>
          <button
            type="button"
            onClick={() => setActiveSubScreen('wealth_ranking')}
            className={`text-base font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-105 ${
              activeTopTab === 'discover'
                ? 'text-slate-400 hover:text-white'
                : 'text-emerald-900/80 hover:text-emerald-950'
            }`}
          >
            <span>👑</span>
            <span>ترتيب</span>
          </button>
        </div>

        {/* Left: Search Glass & Palace with Plus */}
        <div className="flex items-center gap-3">
          {/* Magnifying Glass Search */}
          <button
            type="button"
            onClick={() => setActiveSubScreen('search')}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="بحث"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs border ${
              activeTopTab === 'discover'
                ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                : 'bg-amber-300/40 border-amber-300 text-[#113f2a]'
            }`}>
              <Search size={16} className="stroke-[3]" />
            </div>
          </button>

          {/* Green Palace / Room Creation Button with small + */}
          <button
            type="button"
            onClick={() => setActiveSubScreen('create')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="إنشاء غرفة"
          >
            <span className="text-2xl">🕌</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-[10px] font-black border border-white">
              +
            </span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN CONTENT AREA: Switch between حفلة (Party) and اكتشف (Discover) */}
      {/* ============================================================== */}
      {activeTopTab === 'discover' ? (
        /* DISCOVER VIEW: Exact vertical stack of banners like the screenshot + المعرف المميز */
        <div className="px-3 pt-2 pb-6 space-y-3.5 animate-fade-in bg-black/90 min-h-[calc(100vh-60px)]">
          {/* Banner 0: Toti Chat - المعرف المميز */}
          <div
            onClick={() => setShowSpecialIdModal(true)}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-amber-500/50 cursor-pointer active:scale-[0.99] transition-transform bg-black hover:border-amber-400"
          >
            <img
              src="/assets/images/toti_distinguished_id_1790717836703.jpg"
              alt="المعرف المميز - Toti Chat"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner 1: هدية مخصصة */}
          <div
            onClick={() => setShowCustomGiftModal(true)}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-purple-500/40 cursor-pointer active:scale-[0.99] transition-transform bg-black hover:border-purple-400"
          >
            <img
              src="/assets/images/custom_gift_banner_1790726268730.jpg"
              alt="هدية مخصصة"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner 2: النجم العالمي */}
          <div
            onClick={() => setActiveSubScreen('charm_wealth')}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-amber-500/40 cursor-pointer active:scale-[0.99] transition-transform bg-black"
          >
            <img
              src="/assets/images/global_star_banner_1790726285845.jpg"
              alt="النجم العالمي"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner 3: نشاط إعادة الشحن */}
          <div
            onClick={() => setShowRechargeActivityModal(true)}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-amber-500/40 cursor-pointer active:scale-[0.99] transition-transform bg-black hover:border-amber-400"
          >
            <img
              src="/assets/images/recharge_activity_banner_1790725680784.jpg"
              alt="نشاط إعادة الشحن"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner 4: رفقاء الروح الأسبوعية */}
          <div
            onClick={() => setShowSoulmatesModal(true)}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-pink-500/40 cursor-pointer active:scale-[0.99] transition-transform bg-black hover:border-pink-400"
          >
            <img
              src="/assets/images/soulmates_exact_banner_1790725479589.jpg"
              alt="رفقاء الروح الأسبوعية"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Banner 5: Toty Chat افتتاح الوكالة جديده */}
          <div
            onClick={() => setShowAgencyModal(true)}
            className="w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-lg border border-cyan-500/40 cursor-pointer active:scale-[0.99] transition-transform bg-black hover:border-cyan-400"
          >
            <img
              src="/assets/images/agency_opening_banner_1790725265910.jpg"
              alt="افتتاح الوكالة جديده"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        /* PARTY (حفلة) VIEW */
        <>
          {/* ============================================================== */}
          {/* 2. TOP BANNER: Moving Carousel (رفقاء الروح + المعرف المميز)     */}
          {/* ============================================================== */}
          <div className="px-3 mt-1">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[2.7/1] rounded-2xl overflow-hidden shadow-md cursor-pointer group active:scale-[0.99] transition-transform bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-white/40"
        >
          {/* Slides Container with smooth horizontal sliding */}
          <div
            className="flex w-full h-full transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(${activeBannerIndex * 100}%)`, // RTL layout sliding
            }}
          >
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={banner.action}
                className="w-full h-full shrink-0 relative"
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          {/* Left Arrow to slide manually */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveBannerIndex((prev) => (prev + 1) % banners.length);
            }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-opacity opacity-70 hover:opacity-100 cursor-pointer z-10 text-xs font-bold"
            title="التالي"
          >
            ❮
          </button>

          {/* Right Arrow to slide manually */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-opacity opacity-70 hover:opacity-100 cursor-pointer z-10 text-xs font-bold"
            title="السابق"
          >
            ❯
          </button>

          {/* Slide Indicator Dots at bottom-left */}
          <div className="absolute bottom-1.5 left-3 flex items-center gap-1 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBannerIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeBannerIndex === idx
                    ? 'w-4 h-1.5 bg-amber-300 shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. THREE FEATURE CARDS: الغرفة (Green) | الجاذبية (Blue) | الثروة (Red) */}
      {/* ============================================================== */}
      <div className="px-3 mt-3 grid grid-cols-3 gap-2">
        {/* CARD 1 (RIGHT): الثروة (Red/Burgundy Card with Lanterns) */}
        <div
          onClick={() => setActiveSubScreen('wealth_ranking')}
          className="aspect-[1.12/1] rounded-2xl bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#7f1d1d] p-1.5 flex flex-col justify-between text-white shadow-md border border-amber-400/50 cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          {/* Top Title: الثروة with Lanterns */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px]">🏮</span>
            <span className="text-[12px] font-black text-amber-200 drop-shadow-xs tracking-wide">
              الثروة
            </span>
            <span className="text-[10px]">🏮</span>
          </div>

          {/* 3 Podiums with Real Avatars or Empty Zero States */}
          <div className="relative flex items-end justify-center w-full pb-1">
            {/* 2nd Place (Left) */}
            <div className="relative z-10 -ml-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥈</span>
              <div className="w-[28px] h-[28px] rounded-full border border-slate-300 overflow-hidden bg-slate-900 shadow-xs flex items-center justify-center">
                {wealthTop2 && wealthTop2.score > 0 ? (
                  <img
                    src={wealthTop2.avatar}
                    alt={wealthTop2.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 1st Place (Center - Elevated) */}
            <div className="relative z-20 mb-1 flex flex-col items-center">
              <span className="text-[11px] drop-shadow-sm mb-0.5">👑</span>
              <div className="w-[32px] h-[32px] rounded-full border-2 border-amber-300 overflow-hidden bg-amber-950 shadow-md flex items-center justify-center">
                {wealthTop1 && wealthTop1.score > 0 ? (
                  <img
                    src={wealthTop1.avatar}
                    alt={wealthTop1.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-black text-amber-300 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 3rd Place (Right) */}
            <div className="relative z-10 -mr-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥉</span>
              <div className="w-[28px] h-[28px] rounded-full border border-amber-600 overflow-hidden bg-amber-950 shadow-xs flex items-center justify-center">
                {wealthTop3 && wealthTop3.score > 0 ? (
                  <img
                    src={wealthTop3.avatar}
                    alt={wealthTop3.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-amber-500/80 font-mono">--</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2 (CENTER): الجاذبية (Blue Card with Lanterns) */}
        <div
          onClick={() => setActiveSubScreen('charm_ranking')}
          className="aspect-[1.12/1] rounded-2xl bg-gradient-to-b from-[#1e40af] via-[#1d4ed8] to-[#172554] p-1.5 flex flex-col justify-between text-white shadow-md border border-amber-400/50 cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          {/* Top Title: الجاذبية with Lanterns */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px]">🏮</span>
            <span className="text-[12px] font-black text-amber-200 drop-shadow-xs tracking-wide">
              الجاذبية
            </span>
            <span className="text-[10px]">🏮</span>
          </div>

          {/* 3 Podiums with Real Avatars or Zero States */}
          <div className="relative flex items-end justify-center w-full pb-1">
            {/* 2nd Place */}
            <div className="relative z-10 -ml-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥈</span>
              <div className="w-[28px] h-[28px] rounded-full border border-slate-300 overflow-hidden bg-slate-900 shadow-xs flex items-center justify-center">
                {charmTop2 && charmTop2.score > 0 ? (
                  <img
                    src={charmTop2.avatar}
                    alt={charmTop2.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 1st Place */}
            <div className="relative z-20 mb-1 flex flex-col items-center">
              <span className="text-[11px] drop-shadow-sm mb-0.5">👑</span>
              <div className="w-[32px] h-[32px] rounded-full border-2 border-amber-300 overflow-hidden bg-amber-950 shadow-md flex items-center justify-center">
                {charmTop1 && charmTop1.score > 0 ? (
                  <img
                    src={charmTop1.avatar}
                    alt={charmTop1.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-black text-amber-300 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative z-10 -mr-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥉</span>
              <div className="w-[28px] h-[28px] rounded-full border border-amber-600 overflow-hidden bg-amber-950 shadow-xs flex items-center justify-center">
                {charmTop3 && charmTop3.score > 0 ? (
                  <img
                    src={charmTop3.avatar}
                    alt={charmTop3.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-amber-500/80 font-mono">--</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3 (LEFT): الغرفة (Emerald Green Card with Lanterns) */}
        <div
          onClick={() => setActiveSubScreen('room_rankings')}
          className="aspect-[1.12/1] rounded-2xl bg-gradient-to-b from-[#065f46] via-[#047857] to-[#064e3b] p-1.5 flex flex-col justify-between text-white shadow-md border border-amber-400/50 cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          {/* Top Title: الغرفة with Lanterns */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px]">🏮</span>
            <span className="text-[12px] font-black text-amber-200 drop-shadow-xs tracking-wide">
              الغرفة
            </span>
            <span className="text-[10px]">🏮</span>
          </div>

          {/* 3 Podiums with Real Room Avatars or Zero States */}
          <div className="relative flex items-end justify-center w-full pb-1">
            {/* 2nd Place */}
            <div className="relative z-10 -ml-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥈</span>
              <div className="w-[28px] h-[28px] rounded-full border border-slate-300 overflow-hidden bg-slate-900 shadow-xs flex items-center justify-center">
                {roomTop2 && roomTop2.supportScore > 0 ? (
                  <img
                    src={roomTop2.roomCover}
                    alt={roomTop2.roomName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 1st Place */}
            <div className="relative z-20 mb-1 flex flex-col items-center">
              <span className="text-[11px] drop-shadow-sm mb-0.5">👑</span>
              <div className="w-[32px] h-[32px] rounded-full border-2 border-amber-300 overflow-hidden bg-amber-950 shadow-md flex items-center justify-center">
                {roomTop1 && roomTop1.supportScore > 0 ? (
                  <img
                    src={roomTop1.roomCover}
                    alt={roomTop1.roomName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-black text-amber-300 font-mono">--</span>
                )}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="relative z-10 -mr-1 flex flex-col items-center">
              <span className="text-[9px] drop-shadow-xs mb-0.5">🥉</span>
              <div className="w-[28px] h-[28px] rounded-full border border-amber-600 overflow-hidden bg-amber-950 shadow-xs flex items-center justify-center">
                {roomTop3 && roomTop3.supportScore > 0 ? (
                  <img
                    src={roomTop3.roomCover}
                    alt={roomTop3.roomName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-amber-500/80 font-mono">--</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. FILTER PILLS BAR: شائع 🔥 | العراق 🇮🇶 | المملكة العربية السعودية 🇸🇦 | ▼ */}
      {/* ============================================================== */}
      <div className="px-3 mt-3 relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* 1. شائع 🔥 (Active Mint Green Pill) */}
          <button
            type="button"
            onClick={() => setSelectedFilter('trending')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-bold text-xs cursor-pointer whitespace-nowrap shadow-xs transition-colors shrink-0 ${
              selectedFilter === 'trending'
                ? 'bg-[#10b981] text-white shadow-emerald-600/30'
                : 'bg-white/80 text-emerald-950'
            }`}
          >
            <span>شائع</span>
            <span className="text-sm">🔥</span>
          </button>

          {/* 2. العراق 🇮🇶 */}
          <button
            type="button"
            onClick={() => setSelectedFilter('iraq')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-bold text-xs cursor-pointer whitespace-nowrap transition-colors shrink-0 ${
              selectedFilter === 'iraq'
                ? 'bg-[#10b981] text-white'
                : 'bg-white/80 text-emerald-950'
            }`}
          >
            <span>العراق</span>
            <span className="text-sm">🇮🇶</span>
          </button>

          {/* 3. المملكة العربية السعودية 🇸🇦 */}
          <button
            type="button"
            onClick={() => setSelectedFilter('saudi')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-bold text-xs cursor-pointer whitespace-nowrap transition-colors shrink-0 ${
              selectedFilter === 'saudi'
                ? 'bg-[#10b981] text-white'
                : 'bg-white/80 text-emerald-950'
            }`}
          >
            <span>المملكة العربية السعودية</span>
            <span className="text-sm">🇸🇦</span>
          </button>

          {/* 4. Dropdown Chevron ▼ */}
          <button
            type="button"
            onClick={() => setShowCountryMenu((p) => !p)}
            className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-emerald-950 cursor-pointer shrink-0 hover:bg-white active:scale-90 transition-transform"
            title="اختيار دولة"
          >
            <ChevronDown size={14} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Dropdown Menu for Countries */}
        {showCountryMenu && (
          <div className="mt-2 p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 flex flex-wrap gap-2 animate-fadeIn z-20">
            {[
              { id: 'trending', label: 'شائع', flag: '🔥' },
              { id: 'iraq', label: 'العراق', flag: '🇮🇶' },
              { id: 'saudi', label: 'المملكة العربية السعودية', flag: '🇸🇦' },
              { id: 'syria', label: 'سوريا', flag: '🇸🇾' },
              { id: 'uae', label: 'الإمارات', flag: '🇦🇪' },
              { id: 'kuwait', label: 'الكويت', flag: '🇰🇼' },
              { id: 'egypt', label: 'مصر', flag: '🇪🇬' },
            ].map((country) => (
              <button
                key={country.id}
                type="button"
                onClick={() => {
                  if (country.id === 'trending' || country.id === 'iraq' || country.id === 'saudi') {
                    setSelectedFilter(country.id as any);
                  }
                  setShowCountryMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-full text-xs font-bold text-emerald-950 transition-colors cursor-pointer"
              >
                <span>{country.flag}</span>
                <span>{country.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. 2x2 ROOMS GRID: Real Rooms from State                       */}
      {/* ============================================================== */}
      <div className="px-3 mt-3 grid grid-cols-2 gap-2.5">
        {rooms.slice(0, 4).map((room, index) => {
          const rankMedals = ['🥇', '🥈', '🥉', '✨'];
          return (
            <div
              key={room.id}
              onClick={() => joinRoom(room)}
              className="flex flex-col cursor-pointer group active:scale-[0.98] transition-transform"
            >
              {/* Card Media Box */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-amber-300/40 shadow-sm">
                <img
                  src={room.coverImage}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                {/* Rank Medal on top-right */}
                <div className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center filter drop-shadow-md">
                  <span className="text-xl">{rankMedals[index] || '✨'}</span>
                </div>

                {/* Equalizer & Listeners at bottom-left */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white font-mono text-xs font-bold bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full">
                  <span className="text-emerald-400 font-black animate-pulse">ııı</span>
                  <span>{room.usersCount}</span>
                </div>

                {/* Speaker Avatar at bottom-right */}
                <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full overflow-hidden border border-white/80 shadow-xs">
                  <img
                    src={room.owner.avatar}
                    alt={room.owner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Title Row with Country Flag */}
              <div className="flex items-center gap-1 mt-1.5 justify-start">
                <span className="text-xs">{room.countryFlag || '🇮🇶'}</span>
                <span className="text-xs font-black text-slate-900 truncate">
                  {room.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* Special ID Rules (المعرف الجميل) Modal when clicking on the Distinguished ID Banner */}
      <SpecialIdModal
        isOpen={showSpecialIdModal}
        onClose={() => setShowSpecialIdModal(false)}
      />

      {/* Agency Opening Rules (نشاط فتح الوكالات) Modal when clicking on the Agency Opening Banner */}
      <AgencyOpeningModal
        isOpen={showAgencyModal}
        onClose={() => setShowAgencyModal(false)}
      />

      {/* Soulmates Weekly Event (رفقاء الروح الاسبوعيه) Modal when clicking on Soulmates Banner */}
      <SoulmatesWeeklyModal
        isOpen={showSoulmatesModal}
        onClose={() => setShowSoulmatesModal(false)}
      />

      {/* Custom Gift Poster Modal (قيمة الشحن التراكمي الشهري $1500) */}
      <CustomGiftModal
        isOpen={showCustomGiftModal}
        onClose={() => setShowCustomGiftModal(false)}
      />

      {/* Recharge Activity Modal ($9.9 to $10,000) */}
      <RechargeActivityModal
        isOpen={showRechargeActivityModal}
        onClose={() => setShowRechargeActivityModal(false)}
      />
    </div>
  );
};
