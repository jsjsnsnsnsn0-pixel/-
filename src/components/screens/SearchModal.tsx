import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SearchBar } from '../common/SearchBar';
import { UserAvatar } from '../common/UserAvatar';
import { VIPBadge } from '../common/VIPBadge';
import { supabase } from '../../services/supabase';
import { profileToUser } from '../../services/profile';
import { User } from '../../types';
import { ChevronRight, Radio, Users, Flame, Volume2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0b0c16]/95 border-b border-purple-500/20 px-4 py-3 backdrop-blur-md flex items-center gap-3">
        <button
          onClick={() => setActiveSubScreen(null)}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 shrink-0 cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>

        <div className="flex-1">
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

      {searching && <p role="status" className="text-center p-2">جارٍ البحث…</p>}
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
                  <div
                    key={room.id}
                    onClick={() => {
                      joinRoom(room);
                      setActiveSubScreen(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15 hover:border-purple-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                        <img
                          src={room.coverImage}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-100">{room.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-purple-300 font-mono mt-0.5">
                          <span>ID: {room.id}</span>
                          <span>·</span>
                          <span>مضيف: {room.owner.name}</span>
                          <span>·</span>
                          <span className="text-slate-400">{room.usersCount} متواجد</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-xs">
                      دخول
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">لا توجد غرف مطابقة لبحثك</span>
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
                  <div
                    key={itemUser.id}
                    onClick={() => {
                      setSelectedChatUser(itemUser);
                      setActiveSubScreen('chat_detail');
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#141629] border border-purple-500/15 hover:border-purple-400/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={itemUser} size="sm" showOnlineStatus />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-100">
                            {itemUser.name}
                          </span>
                          <VIPBadge level={itemUser.vipLevel} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>@{itemUser.username}</span>
                          <span>·</span>
                          <span>ID: {itemUser.id}</span>
                        </div>
                      </div>
                    </div>

                    <button className="px-3 py-1 bg-[#1a1d35] border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                      مراسلة
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">لا يوجد مستخدمون مطابقون</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
