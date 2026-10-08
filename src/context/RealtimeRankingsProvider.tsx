import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { RealtimeRankingsContext, LeaderboardEntry, RoomLeaderboardEntry } from './RealtimeRankingsContext';
import { supabase } from '../services/supabase';
import { useApp } from './AppContext';
import { countryFlag, defaultAvatar } from '../services/profile';

export const RealtimeRankingsProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const {isAuthenticated, user, reportError} = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [wealthRankings, setWealthRankings] = useState<LeaderboardEntry[]>([]);
  const [charmRankings, setCharmRankings] = useState<LeaderboardEntry[]>([]);
  const [roomRankings, setRoomRankings] = useState<RoomLeaderboardEntry[]>([]);
  useEffect(() => {
    if (!isAuthenticated) { setWealthRankings([]); setCharmRankings([]); setRoomRankings([]); return; }
    let cancelled = false;
    let pending = false;
    const refresh = async () => {
      if (cancelled || pending || document.hidden) return;
      pending = true;
      try {
      const {data, error} = await supabase.rpc('get_gift_rankings', {p_period: period});
      if (cancelled) return;
      if (error) { reportError('تعذر تحميل التصنيفات.'); return; }
      const map = (rows: any[]): LeaderboardEntry[] => rows.map((r, i) => ({
        id: String(r.public_id), idNumber: String(r.public_id), rank: i + 1,
        name: r.display_name || 'مستخدم', avatar: r.avatar_url || defaultAvatar,
        countryCode: r.country_code, countryFlag: countryFlag(r.country_code),
        wealthLevel: r.wealth_level == null ? undefined : Number(r.wealth_level), charmLevel: r.charm_level == null ? undefined : Number(r.charm_level), vipLevel: Number(r.vip_level), score: Number(r.score),
      }));
      setWealthRankings(map(data?.wealth || [])); setCharmRankings(map(data?.charm || []));
      setRoomRankings((data?.rooms || []).map((r: any, i: number) => ({id: r.id, roomId: r.id,
        rank: i + 1, roomName: r.name, roomCover: r.image_url || '', hostName: r.owner_display_name || '',
        hostAvatar: r.owner_avatar_url || defaultAvatar, supportScore: Number(r.score), membersCount: 0})));
      } finally { pending = false; }
    };
    void refresh().catch(() => { if (!cancelled) reportError('تعذر تحميل التصنيفات.'); });
    const interval = setInterval(() => { void refresh().catch(() => {}); }, 60000);
    const resume=()=>{void refresh().catch(()=>{})};document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);
    return () => {document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume); cancelled = true; clearInterval(interval); };
  }, [isAuthenticated, user.authId, period, user.sentGiftsCount, user.receivedTotal]);
  return <RealtimeRankingsContext.Provider value={{wealthRankings, charmRankings, roomRankings,
    period, setPeriod,
  }}>{children}</RealtimeRankingsContext.Provider>;
};
