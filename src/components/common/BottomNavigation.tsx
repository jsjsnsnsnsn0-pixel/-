import React, { useState } from 'react';
import { Home, MessageSquare, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNavigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    unreadMessagesCount,
    unreadSystemMessagesCount,
    hasUnseenVisitors,
    hasUnseenFollowers,
    activeRoom,
    activeSubScreen,
  } = useApp();

  if (activeRoom && !activeSubScreen) {
    return null;
  }

  const isHomeActive = activeTab === 'home';
  const isMessagesActive = activeTab === 'messages';
  const isProfileActive = activeTab === 'profile';

  const totalUnreadMessages = unreadMessagesCount + unreadSystemMessagesCount;
  const profileUnseenCount = (hasUnseenVisitors ? 1 : 0) + (hasUnseenFollowers ? 1 : 0);

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-3 inset-x-3 z-40 max-w-[calc(28rem-1.5rem)] mx-auto rounded-[24px] bg-[#0e302a]/75 backdrop-blur-[10px] border border-emerald-100/25 text-white shadow-[0_10px_26px_rgba(7,43,35,.24)] pb-safe"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-[66px] px-2">
        {/* Tab 1: الصفحة الرئيسية (Home with semantic icon) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center justify-center flex-1 h-[54px] mx-1 rounded-2xl cursor-pointer relative group transition-all active:scale-95 hover:bg-white/[0.05]"
          title="الصفحة الرئيسية"
          aria-current={isHomeActive ? "page" : undefined}
        >
          <div className="relative flex flex-col items-center">
            {/* Consistent 24dp line icon */}
            <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <Home size={24} strokeWidth={2.2} aria-hidden="true" className={isHomeActive ? "text-amber-300" : "text-slate-100"} />
            </div>
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isHomeActive ? 'text-amber-300 font-black' : 'text-slate-400 group-hover:text-white'
              }`}
            >
              الصفحة الرئيسية
            </span>
          </div>
        </button>

        {/* Tab 2: الرسائل (Messages with Aladdin Magic Lamp) */}
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className="flex flex-col items-center justify-center flex-1 h-[54px] mx-1 rounded-2xl cursor-pointer relative group transition-all active:scale-95 hover:bg-white/[0.05]"
          title="الرسائل"
          aria-current={isMessagesActive ? "page" : undefined}
        >
          <div className="relative flex flex-col items-center">
            {/* Consistent 24dp line icon */}
            <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <MessageSquare size={24} strokeWidth={2.2} aria-hidden="true" className={isMessagesActive ? "text-amber-300" : "text-slate-100"} />
            </div>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border border-white">
                {totalUnreadMessages}
              </span>
            )}
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isMessagesActive ? 'text-amber-300 font-black' : 'text-slate-400 group-hover:text-white'
              }`}
            >
              الرسائل
            </span>
          </div>
        </button>

        {/* Tab 3: أنا (Profile with semantic user icon) */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center justify-center flex-1 h-[54px] mx-1 rounded-2xl cursor-pointer relative group transition-all active:scale-95 hover:bg-white/[0.05]"
          title="أنا"
          aria-current={isProfileActive ? "page" : undefined}
        >
          <div className="relative flex flex-col items-center">
            {/* Consistent 24dp line icon */}
            <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <UserIcon size={24} strokeWidth={2.2} aria-hidden="true" className={isProfileActive ? "text-amber-300" : "text-slate-100"} />
              {/* Notification Pill on top left if unseen */}
              {profileUnseenCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-[#ef4444] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border border-white">
                  {profileUnseenCount}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isProfileActive ? 'text-amber-300 font-black' : 'text-slate-400 group-hover:text-white'
              }`}
            >
              أنا
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};
