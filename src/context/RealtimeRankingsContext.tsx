import { createContext, useContext } from 'react';
import { User, Room } from '../types';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  idNumber: string;
  countryFlag?: string;
  countryCode?: string;
  gender?: 'male' | 'female';
  vipLevel?: number;
  wealthLevel?: number;
  charmLevel?: number;
  score: number; // gold coins sent or received
}

export interface RoomLeaderboardEntry {
  id: string;
  rank: number;
  roomName: string;
  roomCover: string;
  roomId: string;
  hostName: string;
  hostAvatar: string;
  membersCount: number;
  supportScore: number;
}

export interface RealtimeRankingsContextType {
  period: 'daily' | 'weekly' | 'monthly';
  setPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
  wealthRankings: LeaderboardEntry[];
  charmRankings: LeaderboardEntry[];
  roomRankings: RoomLeaderboardEntry[];
  recordGiftSupport: (sender: User, recipient: User, room: Room | null, amount: number) => void;
  resetRankings: () => void;
}

export const RealtimeRankingsContext = createContext<RealtimeRankingsContextType | undefined>(undefined);

export const useRealtimeRankings = () => {
  const context = useContext(RealtimeRankingsContext);
  if (!context) {
    throw new Error('useRealtimeRankings must be used within RealtimeRankingsProvider');
  }
  return context;
};
