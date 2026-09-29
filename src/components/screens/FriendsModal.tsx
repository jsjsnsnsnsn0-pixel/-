import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sampleUsers } from '../../data/mockData';
import { UserAvatar } from '../common/UserAvatar';
import { VIPBadge } from '../common/VIPBadge';
import { LevelBadge } from '../common/LevelBadge';
import { ChevronRight, Users, UserPlus, Check, X } from 'lucide-react';

export const FriendsModal: React.FC = () => {
  const { setActiveSubScreen, setSelectedChatUser } = useApp();
  const [tab, setTab] = useState<'friends' | 'followers' | 'following' | 'requests'>('friends');

  const [requests, setRequests] = useState([
    {
      id: 'req1',
      user: sampleUsers[3],
      time: 'منذ 15 د',
    },
    {
      id: 'req2',
      user: sampleUsers[5],
      time: 'منذ ساعتين',
    },
  ]);

  const handleAcceptRequest = (reqId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    alert('تم قبول طلب الصداقة بنجاح!');
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubScreen(null)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
          <div className="flex items-center gap-1.5">
            <Users size={18} className="text-purple-400" />
            <h1 className="text-base font-bold text-slate-100">شبكة الأصدقاء والمتابعين</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-purple-500/10 text-xs font-semibold">
        {[
          { id: 'friends', label: 'الأصدقاء' },
          { id: 'followers', label: 'المتابعون' },
          { id: 'following', label: 'أتابعهم' },
          { id: 'requests', label: `الطلبات (${requests.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-[#141629] text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List content */}
      <div className="p-4 space-y-2.5">
        {tab === 'requests' ? (
          requests.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block mb-1">طلبات الصداقة المعلقة:</span>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={req.user} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100">{req.user.name}</span>
                        <VIPBadge level={req.user.vipLevel} size="sm" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{req.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-xs"
                      title="قبول"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
                      title="رفض"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              لا توجد طلبات صداقة معلقة حالياً
            </div>
          )
        ) : (
          sampleUsers.slice(1).map((usr) => (
            <div
              key={usr.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={usr} size="sm" showOnlineStatus />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100">{usr.name}</span>
                    <VIPBadge level={usr.vipLevel} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <LevelBadge level={usr.level} size="sm" />
                    <span>·</span>
                    <span>ID: {usr.id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedChatUser(usr);
                  setActiveSubScreen('chat_detail');
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-600 hover:text-white transition-colors"
              >
                رسالة
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
