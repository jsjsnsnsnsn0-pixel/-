import React, { useState, useEffect, ReactNode } from 'react';
import { User, Room } from '../types';
import {
  LeaderboardEntry,
  RoomLeaderboardEntry,
  RealtimeRankingsContext,
} from './RealtimeRankingsContext';

const WEALTH_STORAGE_KEY = 'toti_realtime_wealth_rankings_v3';
const CHARM_STORAGE_KEY = 'toti_realtime_charm_rankings_v3';
const ROOM_STORAGE_KEY = 'toti_realtime_room_rankings_v3';

// Authentic Top supporters for Wealth
const initialWealthRankings: LeaderboardEntry[] = [
  {
    id: '1331',
    rank: 1,
    name: '»xدولة العراق🖤«',
    avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    idNumber: '1331',
    countryFlag: '🇮🇶',
    countryCode: 'IQ',
    gender: 'male',
    vipLevel: 8,
    wealthLevel: 53,
    charmLevel: 32,
    score: 99900000,
  },
  {
    id: '5500',
    rank: 2,
    name: 'وكالة إبن سوريا 👑',
    avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    idNumber: '5500',
    countryFlag: '🇸🇾',
    countryCode: 'SY',
    gender: 'male',
    vipLevel: 10,
    wealthLevel: 60,
    charmLevel: 45,
    score: 65400000,
  },
  {
    id: '4392011',
    rank: 3,
    name: 'سلطان القحطاني 👑',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    idNumber: '4392011',
    countryFlag: '🇸🇦',
    countryCode: 'SA',
    gender: 'male',
    vipLevel: 9,
    wealthLevel: 48,
    charmLevel: 28,
    score: 42800000,
  },
  {
    id: '228811',
    rank: 4,
    name: 'بنت حمص 👑',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    idNumber: '228811',
    countryFlag: '🇸🇾',
    countryCode: 'SY',
    gender: 'female',
    vipLevel: 5,
    wealthLevel: 35,
    charmLevel: 42,
    score: 28500000,
  },
  {
    id: '2024',
    rank: 5,
    name: 'xنَفِسهـ🍁',
    avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg',
    idNumber: '2024',
    countryFlag: '🇮🇶',
    countryCode: 'IQ',
    gender: 'female',
    vipLevel: 7,
    wealthLevel: 28,
    charmLevel: 55,
    score: 19200000,
  },
];

// Authentic Top stars for Charm
const initialCharmRankings: LeaderboardEntry[] = [
  {
    id: '2024',
    rank: 1,
    name: 'xنَفِسهـ🍁',
    avatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg',
    idNumber: '2024',
    countryFlag: '🇮🇶',
    countryCode: 'IQ',
    gender: 'female',
    vipLevel: 7,
    wealthLevel: 28,
    charmLevel: 55,
    score: 88800000,
  },
  {
    id: '228811',
    rank: 2,
    name: 'بنت حمص 👑',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    idNumber: '228811',
    countryFlag: '🇸🇾',
    countryCode: 'SY',
    gender: 'female',
    vipLevel: 5,
    wealthLevel: 35,
    charmLevel: 42,
    score: 54200000,
  },
  {
    id: '1331',
    rank: 3,
    name: '»xدولة العراق🖤«',
    avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    idNumber: '1331',
    countryFlag: '🇮🇶',
    countryCode: 'IQ',
    gender: 'male',
    vipLevel: 8,
    wealthLevel: 53,
    charmLevel: 32,
    score: 36700000,
  },
  {
    id: '8910243',
    rank: 4,
    name: 'ليلى النجدية ✨',
    avatar: '/src/assets/images/avatar_layla_arab_1790226090704.jpg',
    idNumber: '8910243',
    countryFlag: '🇸🇦',
    countryCode: 'SA',
    gender: 'female',
    vipLevel: 8,
    wealthLevel: 32,
    charmLevel: 49,
    score: 21900000,
  },
  {
    id: '5500',
    rank: 5,
    name: 'وكالة إبن سوريا 👑',
    avatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    idNumber: '5500',
    countryFlag: '🇸🇾',
    countryCode: 'SY',
    gender: 'male',
    vipLevel: 10,
    wealthLevel: 60,
    charmLevel: 45,
    score: 16800000,
  },
];

// Authentic Top Rooms for Room Trophy
const initialRoomRankings: RoomLeaderboardEntry[] = [
  {
    id: '1331',
    rank: 1,
    roomName: '»xدولة العراق«',
    roomCover: '/src/assets/images/room_wallpaper_crown_queen_1790560306491.jpg',
    roomId: '1331',
    hostName: '»xدولة العراق🖤«',
    hostAvatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    membersCount: 390,
    supportScore: 120500000,
  },
  {
    id: '5500',
    rank: 2,
    roomName: 'وكالة أبن سوريا 👑',
    roomCover: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    roomId: '5500',
    hostName: 'وكالة إبن سوريا',
    hostAvatar: '/src/assets/images/syrian_host_avatar_1790345251849.jpg',
    membersCount: 778,
    supportScore: 89400000,
  },
  {
    id: '1002',
    rank: 3,
    roomName: '1Million 🇱🇧',
    roomCover: '/src/assets/images/couple_room_cover_1790345237940.jpg',
    roomId: '1002',
    hostName: 'xنَفِسهـ🍁',
    hostAvatar: '/src/assets/images/female_luxury_avatar_1790230899789.jpg',
    membersCount: 494,
    supportScore: 61200000,
  },
  {
    id: '1000',
    rank: 4,
    roomName: 'خدمة العملاء الرسمية',
    roomCover: '/src/assets/images/bot_service_id1000_1790546859130.jpg',
    roomId: '1000',
    hostName: 'خدمة العملاء 🎧',
    hostAvatar: '/src/assets/images/bot_service_id1000_1790546859130.jpg',
    membersCount: 152,
    supportScore: 28900000,
  },
];

export const RealtimeRankingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wealthRankings, setWealthRankings] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(WEALTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialWealthRankings;
  });

  const [charmRankings, setCharmRankings] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(CHARM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialCharmRankings;
  });

  const [roomRankings, setRoomRankings] = useState<RoomLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(ROOM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialRoomRankings;
  });

  // Sync to storage
  useEffect(() => {
    try {
      localStorage.setItem(WEALTH_STORAGE_KEY, JSON.stringify(wealthRankings));
    } catch {
      // ignore
    }
  }, [wealthRankings]);

  useEffect(() => {
    try {
      localStorage.setItem(CHARM_STORAGE_KEY, JSON.stringify(charmRankings));
    } catch {
      // ignore
    }
  }, [charmRankings]);

  useEffect(() => {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomRankings));
    } catch {
      // ignore
    }
  }, [roomRankings]);

  const recordGiftSupport = (sender: User, recipient: User, room: Room | null, amount: number) => {
    setWealthRankings((prev) => {
      const list = [...prev];
      const index = list.findIndex((e) => e.id === sender.id);
      if (index >= 0) {
        list[index] = { ...list[index], score: list[index].score + amount };
      } else {
        list.push({
          id: sender.id,
          rank: list.length + 1,
          name: sender.name,
          avatar: sender.avatar,
          idNumber: sender.id,
          countryFlag: sender.countryFlag || '🇮🇶',
          gender: sender.gender,
          vipLevel: sender.vipLevel,
          wealthLevel: sender.wealthLevel,
          charmLevel: sender.charmLevel,
          score: amount,
        });
      }
      list.sort((a, b) => b.score - a.score);
      return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    });

    setCharmRankings((prev) => {
      const list = [...prev];
      const index = list.findIndex((e) => e.id === recipient.id);
      if (index >= 0) {
        list[index] = { ...list[index], score: list[index].score + amount };
      } else {
        list.push({
          id: recipient.id,
          rank: list.length + 1,
          name: recipient.name,
          avatar: recipient.avatar,
          idNumber: recipient.id,
          countryFlag: recipient.countryFlag || '🇮🇶',
          gender: recipient.gender,
          vipLevel: recipient.vipLevel,
          wealthLevel: recipient.wealthLevel,
          charmLevel: recipient.charmLevel,
          score: amount,
        });
      }
      list.sort((a, b) => b.score - a.score);
      return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    });

    if (room) {
      setRoomRankings((prev) => {
        const list = [...prev];
        const index = list.findIndex((r) => r.id === room.id);
        if (index >= 0) {
          list[index] = { ...list[index], supportScore: list[index].supportScore + amount };
        } else {
          list.push({
            id: room.id,
            rank: list.length + 1,
            roomName: room.title,
            roomCover: room.coverImage,
            roomId: room.id,
            hostName: room.owner.name,
            hostAvatar: room.owner.avatar,
            membersCount: room.usersCount,
            supportScore: amount,
          });
        }
        list.sort((a, b) => b.supportScore - a.supportScore);
        return list.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      });
    }
  };

  const resetRankings = () => {
    setWealthRankings(initialWealthRankings);
    setCharmRankings(initialCharmRankings);
    setRoomRankings(initialRoomRankings);
    try {
      localStorage.removeItem(WEALTH_STORAGE_KEY);
      localStorage.removeItem(CHARM_STORAGE_KEY);
      localStorage.removeItem(ROOM_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <RealtimeRankingsContext.Provider
      value={{
        wealthRankings,
        charmRankings,
        roomRankings,
        recordGiftSupport,
        resetRankings,
      }}
    >
      {children}
    </RealtimeRankingsContext.Provider>
  );
};
