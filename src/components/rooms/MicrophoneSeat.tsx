import React from 'react';
import {useRoomSeatProfile} from '../../hooks/useRoomSeatProfile';
import { MicrophoneSeatState } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { LevelBadge } from '../common/LevelBadge';
import { VIPBadge } from '../common/VIPBadge';
import { VIPUsernameColors } from '../common/VIPAssets';
import { Mic, MicOff, Lock, Armchair } from 'lucide-react';

interface MicrophoneSeatProps {
  seat: MicrophoneSeatState;
  onSeatClick: (seatIndex: number) => void;
  isCurrentUserSeat?: boolean;
  isOwner?: boolean;
  giftCount?: number;
}

export const MicrophoneSeat: React.FC<MicrophoneSeatProps> = ({
  seat,
  onSeatClick,
  isCurrentUserSeat = false,
  isOwner = false,
  giftCount = 0,
}) => {
  const { seatIndex, isLocked, isMuted, isSpeaking } = seat;
  const user = useRoomSeatProfile(seat.user);

  // Empty or Locked Seat
  if (!user) {
    return (
      <div
        onClick={() => onSeatClick(seatIndex)}
        role="button" tabIndex={0} aria-label={isLocked ? `مقعد ${seatIndex+1} مقفل` : `الجلوس في المقعد ${seatIndex+1}`} aria-disabled={isLocked}
        onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSeatClick(seatIndex);}}}
        className="flex flex-col items-center cursor-pointer select-none group"
      >
        <div
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all ${
            isLocked
              ? 'room-seat-empty room-seat-locked border-rose-300/30 text-rose-200'
              : 'room-seat-empty border-white/20 text-purple-100 hover:border-purple-300'
          }`}
        >
          {isLocked ? (
            <Lock size={18} className="text-rose-400" />
          ) : (
            <Armchair size={20} className="group-hover:scale-110 transition-transform" />
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-center">
          <span className="room-seat-number text-[11px] text-slate-200 font-mono">
            {seatIndex + 1}
          </span>
        </div>
      </div>
    );
  }

  // Occupied Seat
  return (
    <div
      onClick={() => onSeatClick(seatIndex)}
      role="button" tabIndex={0} aria-label={`عرض ملف ${user.name}`} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();onSeatClick(seatIndex);}}}
      data-testid="occupied-seat" data-seat-state={isMuted?'muted':isSpeaking?'speaking':'occupied'}
      className="flex flex-col items-center cursor-pointer select-none relative group"
    >
      {/* Speaking Soundwave Pulse Ring */}
      <div className="relative">
        <UserAvatar
          user={user}
          size="md"
          isSpeaking={isSpeaking && !isMuted}
          className="transition-transform group-hover:scale-105"
        />

        {/* Mic status badge overlay */}
        <div
          aria-label={isMuted ? 'المايك مكتوم' : isSpeaking ? 'يتحدث الآن' : 'المايك مفتوح'}
          className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white border border-[#0d0f1e] shadow-sm ${
            isMuted ? 'bg-rose-600' : isSpeaking ? 'bg-emerald-500 animate-pulse' : 'bg-purple-600'
          }`}
        >
          {isMuted ? <MicOff size={10} /> : <Mic size={10} />}
        </div>

        {/* VIP badge indicator if user has VIP */}
        {user.vipLevel > 0 && (
          <div className="absolute -top-1.5 -right-1.5">
            <VIPBadge level={user.vipLevel} size="sm" />
          </div>
        )}
      </div>

      <span className="room-seat-number absolute -top-1 left-0 text-[9px] text-slate-200">{seatIndex+1}</span>
      {seat.user?.roomRole==='moderator'&&<span className="text-[9px] text-cyan-300">مشرف</span>}
      {isOwner&&<span className="text-[9px] text-amber-300">المضيف</span>}
      {giftCount > 0 && <span aria-label={`هدايا المقعد ${giftCount}`} className="text-[9px] text-pink-300 font-bold">🎁 {giftCount.toLocaleString('ar-SA')}</span>}
      {/* Username & Level */}
      <div className="mt-1.5 flex flex-col items-center w-full min-w-0 max-w-[80px]">
        <span title={user.name}
          className={`text-xs font-semibold truncate w-full text-center ${
            user.vipLevel && user.vipLevel > 0
              ? VIPUsernameColors[user.vipLevel] || 'text-amber-400 font-bold'
              : isCurrentUserSeat
              ? 'text-amber-400 font-bold'
              : 'text-slate-200'
          }`}
        >
          {user.name}
        </span>
        {user.hasPublicLevel !== false && <div aria-label={`المستوى ${user.level}`} className="mt-0.5 scale-75 origin-center">
          <LevelBadge level={user.level} size="sm" />
        </div>}
        {user.roomReceivedGold!==undefined&&<span aria-label="قيمة الهدايا المستلمة" className="text-[9px] text-amber-200/90">🎁 {user.roomReceivedGold.toLocaleString('ar-IQ')}</span>}
      </div>
    </div>
  );
};
