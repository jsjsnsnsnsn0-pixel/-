import React, { useState, useEffect, ReactNode } from 'react';
import { User, Room } from '../types';
import { isRecord, readStoredArray } from '../utils/storage';
import {
  LeaderboardEntry,
  RoomLeaderboardEntry,
  RealtimeRankingsContext,
} from './RealtimeRankingsContext';

const WEALTH_STORAGE_KEY = 'toti_realtime_wealth_rankings_v4_zeroed';
const CHARM_STORAGE_KEY = 'toti_realtime_charm_rankings_v4_zeroed';
const ROOM_STORAGE_KEY = 'toti_realtime_room_rankings_v4_zeroed';

// Dynamic real rankings: Starts clean/empty, updates only when users send real gifts or support
const initialWealthRankings: LeaderboardEntry[] = [];

// Dynamic real charm rankings: Starts clean/empty, updates only when users receive real gifts
const initialCharmRankings: LeaderboardEntry[] = [];

// Dynamic real room rankings: Starts clean/empty, updates only when rooms receive real support
const initialRoomRankings: RoomLeaderboardEntry[] = [];

const isLeaderboardEntry = (value: unknown): value is LeaderboardEntry =>
  isRecord(value) &&
  ['id', 'name', 'avatar', 'idNumber'].every((key) => typeof value[key] === 'string') &&
  typeof value.rank === 'number' && Number.isFinite(value.rank) &&
  typeof value.score === 'number' && Number.isFinite(value.score);

const isRoomLeaderboardEntry = (value: unknown): value is RoomLeaderboardEntry =>
  isRecord(value) &&
  ['id', 'roomName', 'roomCover', 'roomId', 'hostName', 'hostAvatar'].every(
    (key) => typeof value[key] === 'string'
  ) && ['rank', 'membersCount', 'supportScore'].every(
    (key) => typeof value[key] === 'number' && Number.isFinite(value[key])
  );

export const RealtimeRankingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Clear any old legacy cache keys on initial run to ensure 100% zeroed data
  useEffect(() => {
    try {
      localStorage.removeItem('toti_realtime_wealth_rankings');
      localStorage.removeItem('toti_realtime_charm_rankings');
      localStorage.removeItem('toti_realtime_room_rankings');
      localStorage.removeItem('toti_realtime_wealth_rankings_v2');
      localStorage.removeItem('toti_realtime_charm_rankings_v2');
      localStorage.removeItem('toti_realtime_room_rankings_v2');
      localStorage.removeItem('toti_realtime_wealth_rankings_v3');
      localStorage.removeItem('toti_realtime_charm_rankings_v3');
      localStorage.removeItem('toti_realtime_room_rankings_v3');
    } catch {
      // ignore
    }
  }, []);

  const [wealthRankings, setWealthRankings] = useState<LeaderboardEntry[]>(() => {
    return readStoredArray(WEALTH_STORAGE_KEY, isLeaderboardEntry);
  });

  const [charmRankings, setCharmRankings] = useState<LeaderboardEntry[]>(() => {
    return readStoredArray(CHARM_STORAGE_KEY, isLeaderboardEntry);
  });

  const [roomRankings, setRoomRankings] = useState<RoomLeaderboardEntry[]>(() => {
    return readStoredArray(ROOM_STORAGE_KEY, isRoomLeaderboardEntry);
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
