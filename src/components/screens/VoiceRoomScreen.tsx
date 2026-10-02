import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoomUserProfileModal } from '../rooms/RoomUserProfileModal';
import { GiftStoreModal } from '../rooms/GiftStoreModal';
import { RoomManagementModal } from '../rooms/RoomManagementModal';
import { GiftOverlayAnimation } from '../common/GiftOverlayAnimation';
import { User } from '../../types';
import { partnerUser, bintHomsUser } from '../../data/mockData';
import {
  ChevronLeft,
  Power,
  Mic,
  MicOff,
  Lock,
  Headphones,
  Smile,
  MessageCircle,
  LayoutGrid,
} from 'lucide-react';

export const VoiceRoomScreen: React.FC = () => {
  const {
    activeRoom,
    leaveRoom,
    user,
    isMyMicMuted,
    toggleMyMic,
    activeGiftOverlay,
    setActiveSubScreen,
  } = useApp();

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedSeatUser, setSelectedSeatUser] = useState<User | null>(null);

  // Quick toast notification for interactive clicks
  const [roomToast, setRoomToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setRoomToast(msg);
    setTimeout(() => setRoomToast(null), 2200);
  };

  if (!activeRoom) return null;

  // Dynamic room host user based on the joined activeRoom
  const hostUser: User = {
    ...activeRoom.owner,
    avatar: activeRoom.owner.avatar || activeRoom.coverImage,
    isOnline: true,
  };

  // Armchair SVG Icon for empty seats
  const ArmchairIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 fill-teal-200/90 stroke-teal-300 stroke-[1.2] drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]"
    >
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
      <path d="M5 19v2" />
      <path d="M19 19v2" />
    </svg>
  );

  const LockIcon = () => (
    <Lock size={18} className="text-teal-200 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)] stroke-[2]" />
  );

  return (
    <div
      className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-hidden pb-safe select-none bg-black font-sans"
      dir="rtl"
    >
      {/* 0. ROOM WALLPAPER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center z-0">
        <img
          src={activeRoom.coverImage || "/src/assets/images/room_wallpaper_crown_queen_1790560306491.jpg"}
          alt="خلفية الغرفة"
          className="w-full h-full object-cover max-w-[480px]"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Interactive Toast Notification */}
      {roomToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/85 border border-teal-400/50 text-teal-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce">
          {roomToast}
        </div>
      )}

      {/* Gift broadcast overlay animation */}
      <GiftOverlayAnimation overlayData={activeGiftOverlay} />

      {/* ============================================================== */}
      {/* 1. TOP ROOM HEADER                                             */}
      {/* ============================================================== */}
      <div className="relative z-20 px-3.5 pt-3 flex items-center justify-between">
        {/* Left: Power Exit Button ⏻ */}
        <button
          type="button"
          onClick={leaveRoom}
          className="w-10 h-10 rounded-full bg-black/60 border border-teal-500/40 text-teal-300 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-[0_0_15px_rgba(20,184,166,0.4)] cursor-pointer"
          title="مغادرة الغرفة"
        >
          <Power size={20} className="stroke-[2.5]" />
        </button>

        {/* Right Section: Room Header Pill (ID & Name & Return) */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => {
              setSelectedSeatUser(hostUser);
              setIsProfileModalOpen(true);
            }}
            className="flex items-center gap-2 bg-black/70 border border-teal-500/40 rounded-full py-1 px-1.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer hover:bg-black/85 active:scale-95 transition-transform"
            title={`معلومات الغرفة: ${activeRoom.title}`}
          >
            {/* Green Back Circle with Chevron */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                leaveRoom();
              }}
              className="w-6 h-6 rounded-full bg-teal-400 text-teal-950 flex items-center justify-center hover:opacity-90 active:scale-90 transition-transform cursor-pointer shadow-md"
              title="رجوع"
            >
              <ChevronLeft size={16} className="stroke-[3]" />
            </button>

            {/* Room Title & ID */}
            <div className="flex flex-col text-right pr-1">
              <span className="text-[11px] font-black text-slate-100 truncate max-w-[120px] drop-shadow">
                {activeRoom.title}
              </span>
              <span className="text-[9px] font-mono text-teal-300 font-bold -mt-0.5">
                ID:{activeRoom.id}
              </span>
            </div>

            {/* Room Owner Avatar with Golden Wings Border */}
            <div className="w-8 h-8 rounded-full border border-amber-400/90 overflow-hidden bg-black relative shadow-md">
              <img
                src={hostUser.avatar}
                alt="Room Owner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Top Row: Listeners Count & Online VIP Badges (Left) + Music & Gems (Right) */}
      <div className="relative z-20 px-3.5 mt-2 flex items-center justify-between">
        {/* Left: Online Listeners counter & VIP Badges */}
        <div
          onClick={() => setIsManagementOpen(true)}
          className="flex items-center gap-1.5 bg-black/55 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-xs cursor-pointer hover:bg-black/75 active:scale-95 transition-all"
          title="قائمة الحضور والأعضاء"
        >
          <span className="text-xs font-mono font-bold text-slate-200">
            {activeRoom.usersCount || 390}
          </span>
          {/* VIP Badges */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setActiveSubScreen('vip');
            }}
            className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-400 text-[8px] text-black font-black shadow-xs flex items-center gap-0.5 cursor-pointer hover:brightness-110"
            title="نظام VIP"
          >
            <span>VIP8</span>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setActiveSubScreen('vip');
            }}
            className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-600 to-rose-400 text-[8px] text-white font-black shadow-xs flex items-center gap-0.5 cursor-pointer hover:brightness-110"
            title="نظام VIP"
          >
            <span>VIP7</span>
          </div>
        </div>

        {/* Right: Music pill & Gems Pill */}
        <div className="flex items-center gap-2">
          {/* Music Button */}
          <div
            onClick={() => showToast('تم تشغيل مشغل الموسيقى الملكي 🎵')}
            className="flex items-center gap-1.5 bg-black/60 border border-white/20 px-2.5 py-1 rounded-full text-xs text-slate-200 shadow-sm backdrop-blur-xs cursor-pointer hover:bg-black/80 active:scale-95 transition-all"
            title="الموسيقى"
          >
            <span className="text-[11px] font-bold">موسيقى</span>
            <div className="w-4 h-4 rounded-full bg-teal-400 text-teal-950 flex items-center justify-center text-[9px]">
              <Headphones size={10} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Green Gems / Support Counter Pill (120.5K) */}
          <div
            onClick={() => setActiveSubScreen('room_rankings')}
            className="flex items-center gap-1 bg-black/60 border border-teal-400/50 px-2.5 py-0.5 rounded-full text-teal-300 text-xs font-bold font-mono shadow-[0_0_10px_rgba(20,184,166,0.3)] cursor-pointer hover:bg-black/80 active:scale-95 transition-all"
            title="ترتيب نقاط دعم الروم"
          >
            <span>120.5K</span>
            <span className="text-sm">💎</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MICROPHONE SEATS GRID (Exact 5 + 5 = 10 Microphones)        */}
      {/* ============================================================== */}
      <div className="relative z-10 flex-1 px-3 pt-3 flex flex-col justify-start">
        {/* ROW 1: Seats 5, 4, 3, 2, 1 */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {/* Seat 5: Locked */}
          <div
            onClick={() => showToast('المايك رقم 5 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">5</span>
          </div>

          {/* Seat 4: Locked */}
          <div
            onClick={() => showToast('المايك رقم 4 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">4</span>
          </div>

          {/* Seat 3: Empty Armchair */}
          <div
            onClick={() => showToast('صعدت إلى المايك رقم 3 🛋️')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
            title="الصعود للمايك 3"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <ArmchairIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">3</span>
          </div>

          {/* Seat 2: Locked */}
          <div
            onClick={() => showToast('المايك رقم 2 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">2</span>
          </div>

          {/* Seat 1: Locked */}
          <div
            onClick={() => showToast('المايك رقم 1 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">1</span>
          </div>
        </div>

        {/* ROW 2: Seats */}
        <div className="grid grid-cols-5 gap-2 text-center mt-3 items-start">
          {/* Seat (Host): Dynamic host */}
          <div
            onClick={() => {
              setSelectedSeatUser(hostUser);
              setIsProfileModalOpen(true);
            }}
            className="flex flex-col items-center cursor-pointer select-none relative group -mt-1 active:scale-95 transition-transform"
            title={`عرض بروفايل المضيف: ${hostUser.name}`}
          >
            <div className="relative flex items-center justify-center">
              {/* Luxury Ruby Winged Frame */}
              <div className="relative w-15 h-15 flex items-center justify-center">
                <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-cyan-600 via-teal-400 to-emerald-600 shadow-[0_0_18px_rgba(20,184,166,0.9)] flex items-center justify-center overflow-hidden">
                  <img
                    src={hostUser.avatar}
                    alt={hostUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {/* Host Badge */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-[8px] font-black text-black shadow-md border border-white/60">
                  {hostUser.vipLevel ? `VIP${hostUser.vipLevel}` : 'مضيف'}
                </span>
              </div>
            </div>

            {/* Name + Home Badge */}
            <div className="flex items-center gap-0.5 mt-1">
              <span className="text-[9px] font-black text-amber-300 truncate max-w-[56px] drop-shadow">
                {hostUser.name}
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[8px] shadow-xs">
                🏠
              </div>
            </div>

            {/* Support / Gift Pill */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsGiftModalOpen(true);
              }}
              className="mt-0.5 px-1.5 py-0.2 rounded-full bg-black/70 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-200 flex items-center gap-0.5 shadow-sm hover:scale-105 active:scale-95 transition-transform"
            >
              <span>1.0K</span>
              <span>🎁</span>
            </div>
          </div>

          {/* Seat: بنت حمص 👑 */}
          <div
            onClick={() => {
              setSelectedSeatUser(bintHomsUser);
              setIsProfileModalOpen(true);
            }}
            className="flex flex-col items-center cursor-pointer select-none relative group active:scale-95 transition-transform"
            title="عرض بروفايل: بنت حمص 👑"
          >
            <div className="relative">
              {/* Avatar circle with mic badge */}
              <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <img
                  src={bintHomsUser.avatar}
                  alt={bintHomsUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {/* Mic Icon on avatar */}
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-black/90 border border-teal-400 flex items-center justify-center text-teal-300 shadow-sm">
                <Mic size={9} />
              </div>
            </div>

            {/* Name + Female Icon */}
            <div className="flex items-center gap-0.5 mt-1">
              <span className="text-[9px] font-black text-pink-200 truncate max-w-[46px] drop-shadow">
                بنت ح...
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[8px] shadow-xs">
                ♀
              </div>
            </div>

            {/* 118 Gift Pill */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsGiftModalOpen(true);
              }}
              className="mt-0.5 px-1.5 py-0.2 rounded-full bg-black/70 border border-pink-500/40 text-[9px] font-mono font-bold text-pink-200 flex items-center gap-0.5 shadow-sm hover:scale-105 active:scale-95 transition-transform"
            >
              <span>118</span>
              <span>🎁</span>
            </div>
          </div>

          {/* Seat 8: Locked */}
          <div
            onClick={() => showToast('المايك رقم 8 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">8</span>
          </div>

          {/* Seat 7: Empty Armchair */}
          <div
            onClick={() => showToast('صعدت إلى المايك رقم 7 🛋️')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
            title="الصعود للمايك 7"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <ArmchairIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">7</span>
          </div>

          {/* Seat 6: Locked */}
          <div
            onClick={() => showToast('المايك رقم 6 مقفول من صاحب الغرفة 🔒')}
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-full bg-black/45 border border-teal-500/40 backdrop-blur-xs flex items-center justify-center shadow-[inset_0_0_12px_rgba(20,184,166,0.2)] hover:border-teal-400">
              <LockIcon />
            </div>
            <span className="text-[11px] text-teal-200/90 font-mono mt-1 font-bold">6</span>
          </div>
        </div>

        {/* Floating Left Activity Badges */}
        <div className="absolute left-3 top-64 flex flex-col items-center gap-3 z-20 pointer-events-auto">
          {/* Recharge Treasure Activity Icon */}
          <div
            onClick={() => setActiveSubScreen('recharge')}
            className="w-12 h-12 rounded-xl bg-black/60 border border-amber-400/80 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-pointer active:scale-90 transition-transform relative group"
            title="نشاط إعادة الشحن والمكافآت"
          >
            <img
              src="/src/assets/images/recharge_treasure_chest_1790560338083.jpg"
              alt="نشاط إعادة الشحن"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 inset-x-0 bg-red-600/90 text-[7px] text-center font-bold text-white py-0.2">
              نشاط الشحن
            </span>
          </div>

          {/* Rocket Event Badge with Progress Bar */}
          <div
            onClick={() => showToast('تم بدء فعالية سباق الصاروخ الفضائي 🚀!')}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            title="فعالية الصاروخ"
          >
            <div className="text-2xl drop-shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse">
              🚀
            </div>
            <div className="w-9 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-emerald-400/60 mt-0.5">
              <div className="w-2/3 h-full bg-emerald-400 rounded-full" />
            </div>
          </div>

          {/* Gamepad Icon */}
          <div
            onClick={() => showToast('فتح قائمة ألعاب الروم (لودو، دومينو، نرد الحظ) 🎮')}
            className="text-2xl drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] cursor-pointer active:scale-95 transition-transform hover:scale-110"
            title="ألعاب الروم"
          >
            🎮
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BOTTOM ROOM ACTION BAR                                       */}
      {/* ============================================================== */}
      <div className="relative z-30 px-3 py-3 flex items-center justify-between pb-6">
        {/* 1. Apps / Room Grid Menu Icon */}
        <button
          type="button"
          onClick={() => setIsManagementOpen(true)}
          className="w-10 h-10 rounded-full bg-black/65 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-lg cursor-pointer"
          title="قائمة وإعدادات الغرفة"
        >
          <LayoutGrid size={20} className="stroke-[2.2]" />
        </button>

        {/* 2. Messages / Inbox with Badge (1) */}
        <button
          type="button"
          onClick={() => setActiveSubScreen('messages')}
          className="relative w-10 h-10 rounded-full bg-black/65 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-lg cursor-pointer"
          title="صندوق الرسائل"
        >
          <MessageCircle size={20} className="stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md">
            1
          </span>
        </button>

        {/* 3. CENTRAL GIFT BOX */}
        <button
          type="button"
          onClick={() => setIsGiftModalOpen(true)}
          className="w-14 h-14 -mt-3 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-blue-400 to-teal-300 shadow-[0_0_25px_rgba(59,130,246,0.8)] flex items-center justify-center cursor-pointer active:scale-95 transition-all hover:scale-105"
          title="متجر الهدايا الفاخرة"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-indigo-900 to-purple-950 flex items-center justify-center text-2xl shadow-inner border border-white/40">
            🎁
          </div>
        </button>

        {/* 4. Microphone toggle */}
        <button
          type="button"
          onClick={() => {
            toggleMyMic();
            showToast(isMyMicMuted ? 'تم تشغيل المايكروفون 🎙️' : 'تم كتم المايكروفون 🔇');
          }}
          className="w-10 h-10 rounded-full bg-black/65 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-lg cursor-pointer"
          title="المايكروفون"
        >
          {isMyMicMuted ? (
            <MicOff size={20} className="text-rose-400 stroke-[2.2]" />
          ) : (
            <Mic size={20} className="text-teal-300 stroke-[2.2]" />
          )}
        </button>

        {/* 5. Emoji Reactions */}
        <button
          type="button"
          onClick={() => showToast('✨ أرسلت تفاعلاً رائعاً في الروم ✨')}
          className="w-10 h-10 rounded-full bg-black/65 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-lg cursor-pointer"
          title="التعبيرات السريعة"
        >
          <Smile size={20} className="stroke-[2.2]" />
        </button>

        {/* 6. Room Public Chat */}
        <button
          type="button"
          onClick={() => showToast('تم تفعيل إرسال الرسائل العامة في شات الروم 💬')}
          className="w-10 h-10 rounded-full bg-black/65 border border-white/20 text-slate-200 flex items-center justify-center hover:bg-black active:scale-90 transition-all shadow-lg cursor-pointer"
          title="دردشة الغرفة العامة"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-200">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* USER PROFILE BOTTOM MODAL */}
      <RoomUserProfileModal
        isOpen={isProfileModalOpen}
        targetUser={selectedSeatUser}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedSeatUser(null);
        }}
        onOpenMore={() => {
          setIsProfileModalOpen(false);
          setActiveSubScreen('user_detail_profile');
        }}
      />

      {/* GIFT STORE MODAL */}
      <GiftStoreModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        room={activeRoom}
        onRechargeClick={() => {
          setIsGiftModalOpen(false);
          setActiveSubScreen('recharge');
        }}
      />

      {/* ROOM MANAGEMENT MODAL */}
      <RoomManagementModal
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        room={activeRoom}
      />
    </div>
  );
};
