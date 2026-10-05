import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { getSystemMessages } from '../../services/systemNotificationService';

// System Messages User
export const systemMessagesUser: User = {
  id: 'system_official_bot',
  username: 'system_messages',
  name: 'رسائل النظام',
  bio: 'إشعارات النظام الرسمية ومكافآت الحساب والفعاليات',
  avatar: '/assets/images/system_bell_icon_1790421934665.jpg',
  level: 53,
  vipLevel: 8,
  charmLevel: 32,
  wealthLevel: 53,
  gold: 99999999,
  diamonds: 88888888,
  followersCount: 1000000,
  followingCount: 0,
  friendsCount: 0,
  receivedGiftsCount: 0,
  isOnline: true,
};

// Official Customer Service / Messages User (السيد حمدان)
export const officialSupportUser: User = {
  id: 'official_support_hamdan',
  username: 'official_messages',
  name: 'رسائل رسمية',
  bio: 'الرسائل الرسمية وتواصل خدمة العملاء - السيد حـمـدان | هاتف: +964 772 645 0081',
  avatar: '/assets/images/official_mascot_1790421946401.jpg',
  level: 53,
  vipLevel: 8,
  charmLevel: 32,
  wealthLevel: 53,
  gold: 99999999,
  diamonds: 88888888,
  followersCount: 500000,
  followingCount: 1,
  friendsCount: 1000,
  receivedGiftsCount: 99999,
  isHost: true,
  isOnline: true,
};

export const MessagesScreen: React.FC = () => {
  const { setSelectedChatUser, setActiveSubScreen, conversations, unreadSystemMessagesCount, markSystemMessagesAsRead } = useApp();
  const [latestSysMsg, setLatestSysMsg] = useState(() => {
    const list = getSystemMessages();
    return list[0] || null;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const list = getSystemMessages();
      setLatestSysMsg(list[0] || null);
    };
    window.addEventListener('toti_system_message_received', handleUpdate);
    return () => {
      window.removeEventListener('toti_system_message_received', handleUpdate);
    };
  }, []);

  const handleOpenSystemChat = () => {
    markSystemMessagesAsRead();
    setSelectedChatUser(systemMessagesUser);
    setActiveSubScreen('chat_detail');
  };

  const handleOpenOfficialChat = () => {
    setSelectedChatUser(officialSupportUser);
    setActiveSubScreen('chat_detail');
  };

  return (
    <div
      className="min-h-screen text-slate-800 pb-24 select-none relative overflow-x-hidden font-sans"
      style={{
        background:
          'radial-gradient(ellipse 90% 45% at 50% -5%, #bce9c6 0%, #daf2e0 30%, #eef8f1 60%, #f6fbf7 85%, #f8faf8 100%)',
      }}
    >
      {/* ============================================================== */}
      {/* 1. TOP HEADER: Exact Screenshot Title "الرسائل"                */}
      {/* ============================================================== */}
      <header className="px-6 pt-9 pb-5 flex items-center justify-end">
        <h1 className="text-[25px] font-black text-[#153424] tracking-tight">
          الرسائل
        </h1>
      </header>

      {/* ============================================================== */}
      {/* 2. MESSAGES LIST: Exact Screenshot Items                       */}
      {/* ============================================================== */}
      <div className="px-5 pt-1 space-y-6">
        {conversations.map(conversation => <button key={conversation.id} className="w-full text-right flex items-center gap-3 p-3 border-b border-white/10" onClick={() => {setSelectedChatUser(conversation.user); setActiveSubScreen('chat_detail');}}>
          <img src={conversation.user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1"><p className="font-bold">{conversation.user.name}</p><p className="text-sm text-slate-400 truncate">{conversation.lastMessage}</p></div>
          {conversation.unreadCount > 0 && <span className="bg-emerald-500 rounded-full px-2">{conversation.unreadCount}</span>}
        </button>)}
        {/* ROW 1: رسائل النظام (System Messages with Golden Bell Cloche) */}
        <div
          onClick={handleOpenSystemChat}
          className="flex items-start justify-between py-1 cursor-pointer group active:opacity-85 transition-opacity"
        >
          {/* Left Side: Date / Time + Red Unread Badge under it if unread */}
          <div className="flex flex-col items-center shrink-0 pt-0.5 pl-1">
            <span className="text-[12px] font-medium text-[#8ea396]">
              {latestSysMsg?.timestamp || 'الجمعة'}
            </span>
            {unreadSystemMessagesCount > 0 && (
              <div className="w-[18px] h-[18px] rounded-full bg-[#ef4444] text-white text-[11px] font-black flex items-center justify-center shadow-xs mt-1.5 animate-pulse">
                {unreadSystemMessagesCount}
              </div>
            )}
          </div>

          {/* Right Side: Text in Middle + Golden Bell Avatar on the Far Right */}
          <div className="flex items-center gap-3.5 flex-1 justify-end ml-3">
            {/* Middle Texts (Right-Aligned) */}
            <div className="text-right min-w-0 max-w-[240px]">
              <h2 className="font-bold text-[18px] text-[#1a251f] leading-snug">
                رسائل النظام
              </h2>
              <p
                dir="rtl"
                className="text-[13px] text-[#8ea396] truncate font-normal mt-0.5"
              >
                {latestSysMsg?.content || '...تهانينا! لقد حصلت على حزمة مكافأة المستخدم الجديد: ['}
              </p>
            </div>

            {/* Circular Bell Avatar */}
            <div className="w-[58px] h-[58px] rounded-full overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.22)] border border-amber-200/70 bg-[#f6ba5d] flex items-center justify-center">
              <img
                src="/assets/images/system_bell_icon_1790421934665.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/assets/images/msg_system_bell_avatar_1790349025148.jpg';
                }}
                alt="رسائل النظام"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* ROW 2: رسائل رسمية (Official Messages with Mint Mascot) */}
        <div
          onClick={handleOpenOfficialChat}
          className="flex items-start justify-between py-1 cursor-pointer group active:opacity-85 transition-opacity"
        >
          {/* Left Side: Empty spacer matching screenshot */}
          <div className="w-10" />

          {/* Right Side: Text in Middle + Mint Mascot Avatar on Far Right */}
          <div className="flex items-center gap-3.5 flex-1 justify-end ml-3">
            {/* Middle Texts (Right-Aligned) */}
            <div className="text-right min-w-0">
              <h2 className="font-bold text-[18px] text-[#1a251f] leading-snug">
                رسائل رسمية
              </h2>
              <p className="text-[13px] text-[#8ea396] font-normal mt-0.5 font-sans">
                No message
              </p>
            </div>

            {/* Circular Mascot Avatar */}
            <div className="w-[58px] h-[58px] rounded-full overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)] border border-emerald-200/70 bg-[#7ee0af] flex items-center justify-center">
              <img
                src="/assets/images/official_mascot_1790421946401.jpg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/assets/images/msg_official_mascot_1790349038045.jpg';
                }}
                alt="رسائل رسمية"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
