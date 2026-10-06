import {EmptyState,InlineLoading} from '../common/UIState';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../common/SearchBar';
import { UserAvatar } from '../common/UserAvatar';
import { VIPBadge } from '../common/VIPBadge';
import { supabase } from '../../services/supabase';
import { profileToUser } from '../../services/profile';
import { User } from '../../types';
import { ChevronRight, Radio, Users } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { setActiveSubScreen, rooms, joinRoom, setSelectedChatUser, reportError } = useApp();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'rooms' | 'users' | 'ids'>('all');

  const normalizedQuery = query.toLowerCase().trim();

  // Search rooms
  const matchedRooms = rooms.filter(
    (r) =>
      r.title.toLowerCase().includes(normalizedQuery) ||
      r.id.includes(normalizedQuery) ||
      r.owner.name.toLowerCase().includes(normalizedQuery) ||
      r.category.toLowerCase().includes(normalizedQuery)
  );

  const [matchedUsers, setMatchedUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setMatchedUsers([]);
    if (normalizedQuery.length < 2) { setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const {data, error} = await supabase.rpc('search_public_profiles', {p_query: normalizedQuery, p_limit: 20});
        if (cancelled) return;
        if (error) throw error;
        setMatchedUsers((data || []).map(profileToUser));
      } catch { if (!cancelled) reportError('تعذر البحث عن المستخدمين. حاول مجدداً.'); }
      finally { if (!cancelled) setSearching(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [normalizedQuery]);

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-24" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex items-center gap-3">
        <button
          onClick={() => setActiveSubScreen(null)}
          aria-label="الرجوع" className="ui-icon-button rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 shrink-0 cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>

        <div className="flex-1 min-w-0">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            autoFocus
            placeholder="ابحث عن غرفة، اسم مستخدم، أو رقم ID..."
          />
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-purple-500/10">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'rooms', label: `الغرف (${matchedRooms.length})` },
          { id: 'users', label: `المستخدمون (${matchedUsers.length})` },
          { id: 'ids', label: 'أرقام ID' },
        ].map((tab) => (
          <button
            key={tab.id}
            aria-pressed={activeFilter===tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-[#15172b] text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {searching && <InlineLoading>جارٍ البحث…</InlineLoading>}
      {/* Results Feed */}
      <div className="p-4 space-y-4">
        {/* ROOMS RESULTS */}
        {(activeFilter === 'all' || activeFilter === 'rooms' || activeFilter === 'ids') && (
          <div>
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Radio size={14} className="text-purple-400" />
              <span>الغرف الصوتية المطابقة:</span>
            </h3>

            {matchedRooms.length > 0 ? (
              <div className="space-y-2">
                {matchedRooms.map((room) => (
                  <button type="button" aria-label={`دخول غرفة ${room.title}`}
                    key={room.id}
                    onClick={() => {
                      joinRoom(room);
                      setActiveSubScreen(null);
                    }}
                    className="w-full text-right min-w-0 flex items-center gap-3 justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15 hover:border-purple-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={room.coverImage}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-100 truncate">{room.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-purple-300 font-mono mt-1">
                          <span className="ui-id basis-full">ID: {room.id}</span>
                          <span>·</span>
                          <span className="truncate">مضيف: {room.owner.name}</span>
                          <span>·</span>
                          <span className="text-slate-400">{room.usersCount} متواجد</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-xs">
                      دخول
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد غرف مطابقة لبحثك" />
            )}
          </div>
        )}

        {/* USERS RESULTS */}
        {(activeFilter === 'all' || activeFilter === 'users' || activeFilter === 'ids') && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Users size={14} className="text-purple-400" />
              <span>المستخدمون:</span>
            </h3>

            {matchedUsers.length > 0 ? (
              <div className="space-y-2">
                {matchedUsers.map((itemUser) => (
                  <button type="button" aria-label={`مراسلة ${itemUser.name}`}
                    key={itemUser.id}
                    onClick={() => {
                      setSelectedChatUser(itemUser);
                      setActiveSubScreen('chat_detail');
                    }}
                    className="w-full text-right min-w-0 flex items-center gap-3 justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15 hover:border-purple-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <UserAvatar user={itemUser} size="sm" showOnlineStatus />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-100 truncate">
                            {itemUser.name}
                          </span>
                          <VIPBadge level={itemUser.vipLevel} size="sm" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                          <span>@{itemUser.username}</span>
                          <span>·</span>
                          <span>ID: {itemUser.id}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 px-3 py-2 bg-[#1a1d35] border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                      مراسلة
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              !searching && <EmptyState title={normalizedQuery.length<2?"اكتب حرفين على الأقل للبحث عن حساب":"لا يوجد مستخدمون مطابقون"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
