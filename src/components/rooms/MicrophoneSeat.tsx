import React from 'react';
import {useRoomSeatProfile} from '../../hooks/useRoomSeatProfile';
import { MicrophoneSeatState } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { LevelBadge } from '../common/LevelBadge';
import { VIPBadge } from '../common/VIPBadge';
import { VIPUsernameColors } from '../common/VIPAssets';
import { Mic, MicOff, Lock, Plus } from 'lucide-react';

interface MicrophoneSeatProps {
  seat: MicrophoneSeatState;
  onSeatClick: (seatIndex: number) => void;
  isCurrentUserSeat?: boolean;
}

export const MicrophoneSeat: React.FC<MicrophoneSeatProps> = ({
  seat,
  onSeatClick,
  isCurrentUserSeat = false,
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
              ? 'bg-[#121324] border-red-500/30 text-rose-400'
              : 'bg-[#15172b]/80 border-dashed border-purple-500/30 text-purple-300 hover:border-purple-400 hover:bg-[#1d203b]'
          }`}
        >
          {isLocked ? (
            <Lock size={18} className="text-rose-400" />
          ) : (
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-center">
          <span className="text-[11px] text-slate-400 font-mono">
            {isLocked ? 'مقفل' : `مقعد ${seatIndex + 1}`}
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
      data-testid="occupied-seat"
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
      </div>
    </div>
  );
};
