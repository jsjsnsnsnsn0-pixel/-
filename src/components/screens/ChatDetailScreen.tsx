import { useTimeouts } from '../../hooks/useTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { copyText } from '../../utils/clipboard';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { VIPBadge } from '../common/VIPBadge';
import { getSystemMessages, SystemNotificationMessage } from '../../services/systemNotificationService';
import {
  ChevronRight,
  Send,
  Mic,
  Volume2,
  ShieldCheck,
  Phone,
  Copy,
  Check,
} from 'lucide-react';

export const ChatDetailScreen: React.FC = () => {
  const {
    selectedChatUser,
    setActiveSubScreen,
    conversations,
    sendMessageToConversation,
    user,
  } = useApp();

  const scheduleTimeout = useTimeouts(selectedChatUser?.id);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [systemMsgs, setSystemMsgs] = useState<SystemNotificationMessage[]>(() => getSystemMessages());
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const nextMessageNumber = useRef(0);
  const messageId = (prefix: string) => `${prefix}-${Date.now()}-${++nextMessageNumber.current}`;

  useEffect(() => {
    setExtraMessages([]);
    setInputText('');
    setIsRecording(false);
    setCopiedPhone(false);
  }, [selectedChatUser?.id]);

  const conversation = conversations.find((c) => c.user.id === selectedChatUser?.id);
  const messageCount = systemMsgs.length + extraMessages.length + (conversation?.messages.length || 0);
  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [messageCount, isRecording, selectedChatUser?.id]);

  useEffect(() => {
    const handleSystemMsg = () => {
      setSystemMsgs(getSystemMessages());
    };
    window.addEventListener('toti_system_message_received', handleSystemMsg);
    return () => {
      window.removeEventListener('toti_system_message_received', handleSystemMsg);
    };
  }, []);

  if (!selectedChatUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-6 text-center" dir="rtl">
        <p className="mb-4">اختر محادثة للمتابعة</p>
        <button type="button" onClick={() => setActiveSubScreen(null)} className="px-6 py-2 rounded-full bg-emerald-600 text-white cursor-pointer">الرجوع</button>
      </div>
    );
  }

  const isOfficial = selectedChatUser.id === 'official_support_hamdan';
  const isSystem = selectedChatUser.id === 'system_official_bot';
  const officialPhone = '9647726450081';

  const defaultOfficialMessages = [
    {
      id: 'official-msg-1',
      senderId: selectedChatUser.id,
      senderName: 'السيد حـمـدان',
      senderAvatar: selectedChatUser.avatar,
      content: 'مرحباً بكم في توتي شات يمكنكم التواصل مع خدمة العملاء الرسمية +964 772 645 0081 السيد حـمـدان',
      timestamp: 'الآن',
      isMe: false,
      type: 'text' as const,
    },
    {
      id: 'official-msg-2',
      senderId: selectedChatUser.id,
      senderName: 'خدمة العملاء الرسمية',
      senderAvatar: selectedChatUser.avatar,
      content: 'يسعدنا خدمتك على مدار الساعة، لأي استفسار أو شكوى أو شحن رصيد يرجى ترك رسالتك هنا أو الاتصال مباشرة.',
      timestamp: 'الآن',
      isMe: false,
      type: 'text' as const,
    },
  ];
  const baseMessages = isOfficial
    ? defaultOfficialMessages
    : isSystem
    ? [...systemMsgs].reverse()
    : conversation
    ? conversation.messages
    : [
        {
          id: 'default-1',
          senderId: selectedChatUser.id,
          senderName: selectedChatUser.name,
          senderAvatar: selectedChatUser.avatar,
          content: 'مرحباً بك! يسعدني التواصل معك في توتي شات.',
          timestamp: '12:00',
          isMe: false,
          type: 'text' as const,
        },
      ];

  const allMessages = [...baseMessages, ...extraMessages];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: messageId('msg'),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: inputText.trim(),
      timestamp: 'الآن',
      isMe: true,
      type: 'text' as const,
    };

    if (conversation && !isOfficial && !isSystem) {
      sendMessageToConversation(conversation.id, inputText.trim(), 'text');
    } else {
      setExtraMessages((prev) => [...prev, newMsg]);
    }

    // Auto-reply for official support
    if (isOfficial) {
      scheduleTimeout(() => {
        setExtraMessages((prev) => [
          ...prev,
          {
            id: messageId('reply'),
            senderId: selectedChatUser.id,
            senderName: 'السيد حـمـدان',
            senderAvatar: selectedChatUser.avatar,
            content: 'شكراً لتواصلك، تم استلام رسالتك وسيتم الرد عليك في أقرب وقت. يمكنك الاتصال المباشر على +964 772 645 0081.',
            timestamp: 'الآن',
            isMe: false,
            type: 'text' as const,
          },
        ]);
      }, 1000, newMsg.id);
    }

    setInputText('');
  };

  const handleVoiceRecord = () => {
    if (isRecording) return;
    setIsRecording(true);
    scheduleTimeout(() => {
      setIsRecording(false);
      const voiceMessage: Message = {
        id: messageId('voice'),
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        content: 'تسجيل صوتي (0:08)',
        timestamp: 'الآن',
        isMe: true,
        type: 'voice',
      };
      if (conversation && !isOfficial && !isSystem) {
        sendMessageToConversation(conversation.id, voiceMessage.content, 'voice');
      } else {
        setExtraMessages((prev) => [...prev, voiceMessage]);
      }
    }, 1500, 'recording');
  };

  const handleCopyNumber = async () => {
    if (!await copyText(officialPhone)) return;
    setCopiedPhone(true);
    scheduleTimeout(() => setCopiedPhone(false), 2000, 'copy');
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-800 flex flex-col select-none overflow-hidden">
      {/* Top Chat App Bar */}
      <header className="shrink-0 sticky top-0 z-30 bg-white/95 border-b border-slate-200/80 px-4 py-2.5 backdrop-blur-md flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSubScreen(null)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>

          <div className="relative">
            {isOfficial ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xs">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-lg">
                  👑
                </div>
              </div>
            ) : isSystem ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-lg shadow-xs">
                ⚡️
              </div>
            ) : (
              <UserAvatar user={selectedChatUser} size="sm" showOnlineStatus />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-slate-900">{selectedChatUser.name}</h2>
              {isOfficial ? (
                <span className="flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  <ShieldCheck size={11} className="text-amber-600" />
                  <span>موثق</span>
                </span>
              ) : (
                <VIPBadge level={selectedChatUser.vipLevel} size="sm" />
              )}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block -mt-0.5">
              {isOfficial ? 'خدمة العملاء الرسمية (السيد حـمـدان)' : isSystem ? 'نظام معتمد' : 'متصل الآن'}
            </span>
          </div>
        </div>

        {isOfficial && (
          <button
            type="button"
            onClick={handleCopyNumber}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            {copiedPhone ? (
              <>
                <Check size={12} className="text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700">تم النسخ</span>
              </>
            ) : (
              <>
                <Phone size={12} className="text-amber-700" />
                <span>اتصال</span>
              </>
            )}
          </button>
        )}
      </header>

      {/* Official banner if Official Chat */}
      {isOfficial && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <span className="text-xs font-black text-slate-900 block">خدمة عملاء توتي شات الرسمية</span>
              <span className="text-[11px] text-slate-600 font-medium">المسؤول المباشر: السيد حـمـدان</span>
            </div>
          </div>
          <button
            onClick={handleCopyNumber}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-xs font-mono font-bold cursor-pointer"
          >
            <Copy size={11} />
            <span dir="ltr">{officialPhone}</span>
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div ref={feedRef} className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3">
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {!msg.isMe && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-sm font-bold shadow-2xs overflow-hidden">
                {isOfficial ? '👑' : isSystem ? '⚡️' : <UserAvatar user={selectedChatUser} size="xs" />}
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs text-sm ${
                msg.isMe
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                  : isOfficial
                  ? 'bg-white border-2 border-amber-200/90 text-slate-900 rounded-bl-xs font-medium'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
              }`}
            >
              {!msg.isMe && isOfficial && (
                <div className="flex items-center gap-1 text-[11px] font-black text-amber-700 mb-1 border-b border-amber-100 pb-0.5">
                  <ShieldCheck size={12} />
                  <span>السيد حـمـدان · خدمة العملاء الرسمية</span>
                </div>
              )}

              {msg.type === 'voice' ? (
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-white animate-pulse" />
                  <span className="text-xs font-mono">رسالة صوتية (0:08)</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-white/80 rounded-full" />
                    <span className="w-1 h-4 bg-white/80 rounded-full" />
                    <span className="w-1 h-2 bg-white/80 rounded-full" />
                  </div>
                </div>
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.content}</p>
              )}
              <span className={`block text-[9px] mt-1 font-mono text-left ${msg.isMe ? 'text-white/80' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isRecording && (
          <div className="text-center py-2 text-xs text-rose-500 font-bold animate-pulse flex items-center justify-center gap-1">
            <Mic size={14} />
            <span>جارٍ تسجيل الصوت...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 bg-white border-t border-slate-200/80 shadow-xs pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
          {/* Voice recorder button */}
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={isRecording}
            className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-600 hover:text-cyan-700 hover:bg-slate-200 flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            title="تسجيل صوتي"
          >
            <Mic size={18} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            dir="rtl"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isOfficial
                ? 'اكتب استفسارك لخدمة العملاء (السيد حـمـدان)...'
                : 'اكتب رسالتك هنا...'
            }
            className="flex-1 min-w-0 bg-slate-100 border border-slate-200 focus:border-cyan-500 focus:bg-white rounded-2xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-center disabled:opacity-40 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            title="إرسال"
          >
            <Send size={16} className="-rotate-90 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
