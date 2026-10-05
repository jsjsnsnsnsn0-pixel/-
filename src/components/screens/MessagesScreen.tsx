import { usePublicChat } from '../../hooks/usePublicChat';
import { emptyUser } from '../../services/profile';
import React, { useState, useEffect } from 'react';
import { setImageFallback } from '../../utils/imageFallback';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { getSystemMessages } from '../../services/systemNotificationService';

// System Messages User
export const systemMessagesUser: User = {
  ...emptyUser, id: 'system_official_bot', username: 'system_messages', name: 'رسائل النظام',
  bio: 'إشعارات النظام', avatar: '/assets/images/system_bell_icon_1790421934665.jpg',
};

export const MessagesScreen: React.FC = () => {
  const { setSelectedChatUser, setActiveSubScreen, conversations, unreadSystemMessagesCount, markSystemMessagesAsRead } = useApp();
  const { opening, openChat } = usePublicChat();
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

  const handleOpenOfficialChat = () => { void openChat(); };

  return (
    <div
      className="min-h-screen text-slate-800 pb-24 select-none relative overflow-x-hidden font-sans"
      style={{
        background:
          'radial-gradient(ellipse 90% 45% at 50% -5%, #bce9c6 0%, #daf2e0 30%, #eef8f1 60%, #f6fbf7 85%, #f8faf8 100%)',
      }}
    >
      <header className="px-6 pt-9 pb-5 flex items-center justify-end">
        <h1 className="text-[25px] font-black text-[#153424] tracking-tight">
          الرسائل
        </h1>
      </header>

      {/* Fixed three-column message matrix: meta | text | avatar */}
      <div className="px-5 pt-1 space-y-4">
        <div
          onClick={handleOpenSystemChat}
          className="grid grid-cols-[44px_minmax(0,1fr)_58px] items-center gap-3.5 py-1 cursor-pointer group active:opacity-85 transition-opacity"
        >
          <div className="w-[44px] flex flex-col items-center justify-center self-stretch shrink-0">
            <span className="text-[12px] font-medium text-[#8ea396] whitespace-nowrap">
              {latestSysMsg?.timestamp || ''}
            </span>
            {unreadSystemMessagesCount > 0 && (
              <div className="w-[18px] h-[18px] rounded-full bg-[#ef4444] text-white text-[11px] font-black flex items-center justify-center shadow-xs mt-1.5 animate-pulse">
                {unreadSystemMessagesCount}
              </div>
            )}
          </div>

          <div className="text-right min-w-0 w-full" dir="rtl">
            <h2 className="font-bold text-[18px] text-[#1a251f] leading-snug truncate">
              رسائل النظام
            </h2>
            <p className="text-[13px] text-[#8ea396] truncate font-normal mt-0.5">
              {latestSysMsg?.content || 'لا توجد رسائل'}
            </p>
          </div>

          <div className="w-[58px] h-[58px] rounded-full overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.22)] border border-amber-200/70 bg-[#f6ba5d] flex items-center justify-center">
            <img
              src="/assets/images/system_bell_icon_1790421934665.jpg"
              onError={(e) => setImageFallback(e, '/assets/images/msg_system_bell_avatar_1790349025148.jpg')}
              alt="رسائل النظام"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div
          onClick={opening ? undefined : handleOpenOfficialChat}
          className="grid grid-cols-[44px_minmax(0,1fr)_58px] items-center gap-3.5 py-1 cursor-pointer group active:opacity-85 transition-opacity"
        >
          <div className="w-[44px]" aria-hidden="true" />

          <div className="text-right min-w-0 w-full" dir="rtl">
            <h2 className="font-bold text-[18px] text-[#1a251f] leading-snug truncate">
              رسائل رسمية
            </h2>
            <p dir="ltr" className="text-[13px] text-[#8ea396] font-normal mt-0.5 font-sans truncate text-right">
              {opening ? 'جارٍ فتح المحادثة…' : 'التواصل داخل التطبيق'}
            </p>
          </div>

          <div className="w-[58px] h-[58px] rounded-full overflow-hidden shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)] border border-emerald-200/70 bg-[#7ee0af] flex items-center justify-center">
            <img
              src="/assets/images/official_mascot_1790421946401.jpg"
              onError={(e) => setImageFallback(e, '/assets/images/msg_official_mascot_1790349038045.jpg')}
              alt="رسائل رسمية"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {conversations.map(conversation => <button key={conversation.id} className="w-full min-w-0 text-right flex items-center gap-3 p-3 border-b border-white/10" onClick={() => {setSelectedChatUser(conversation.user); setActiveSubScreen('chat_detail');}}>
          <img src={conversation.user.avatar} alt="" className="w-12 h-12 shrink-0 rounded-full object-cover" />
          <div className="flex-1 min-w-0"><p className="font-bold truncate">{conversation.user.name}</p><p className="text-sm text-slate-400 truncate">{conversation.lastMessage}</p></div>
          {conversation.unreadCount > 0 && <span className="bg-emerald-500 rounded-full px-2">{conversation.unreadCount}</span>}
        </button>)}
      </div>
    </div>
  );
};
