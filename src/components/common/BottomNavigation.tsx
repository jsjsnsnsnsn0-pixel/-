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
  } = useApp();

  if (activeRoom) {
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
      className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto bg-[#1b7050]/95 backdrop-blur-md border-t border-[#2a8b65]/70 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-16 px-4">
        {/* Tab 1: الصفحة الرئيسية (Home with Golden Dome Palace) */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer relative group transition-transform active:scale-95"
          title="الصفحة الرئيسية"
        >
          <div className="relative flex flex-col items-center">
            {/* Mosque / Palace 3D Icon */}
            <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <span className="text-2xl leading-none select-none">🕌</span>
            </div>
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isHomeActive ? 'text-amber-300 font-black' : 'text-emerald-100/75 group-hover:text-white'
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
          className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer relative group transition-transform active:scale-95"
          title="الرسائل"
        >
          <div className="relative flex flex-col items-center">
            {/* Aladdin Brass Magic Oil Lamp */}
            <div className="w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <span className="text-2xl leading-none select-none">🪔</span>
            </div>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border border-white">
                {totalUnreadMessages}
              </span>
            )}
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isMessagesActive ? 'text-amber-300 font-black' : 'text-emerald-100/75 group-hover:text-white'
              }`}
            >
              الرسائل
            </span>
          </div>
        </button>

        {/* Tab 3: أنا (Profile with Green Cute Owl & Badge "2") */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer relative group transition-transform active:scale-95"
          title="أنا"
        >
          <div className="relative flex flex-col items-center">
            {/* Cute Green Owl Mascot */}
            <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-sm">
              <span className="text-2xl leading-none select-none">🦉</span>
              {/* Notification Pill on top left if unseen */}
              {profileUnseenCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-[#ef4444] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-xs border border-white">
                  {profileUnseenCount}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-bold mt-0.5 tracking-tight transition-colors ${
                isProfileActive ? 'text-amber-300 font-black' : 'text-emerald-100/75 group-hover:text-white'
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
