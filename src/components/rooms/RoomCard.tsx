import React, { useState, useEffect } from 'react';
import { Room } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { VIPBadge } from '../common/VIPBadge';
import { Volume2, Users, Lock, Sparkles, Radio } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  variant?: 'featured' | 'standard' | 'compact';
  onJoin: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, variant = 'standard', onJoin }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [room.coverImage]);

  // 1. Featured Room Card (Panoramic Carousel)
  if (variant === 'featured') {
    return (
      <div
        onClick={() => onJoin(room)}
        className="group relative w-76 shrink-0 rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_6px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.1)] cursor-pointer active:scale-[0.98] transition-all"
      >
        {/* Cover Image & Scrim */}
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          {!imgError && room.coverImage ? (
            <img
              src={room.coverImage}
              alt={room.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center">
              <Sparkles className="text-white/80" size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {/* Top Badges: Live tag + VIP */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-md shadow-rose-600/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              مباشر
            </span>
            {room.isVIP && <VIPBadge level={room.owner.vipLevel || 5} size="sm" />}
          </div>

          {/* Listeners Count */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-mono shadow-xs">
            <Users size={12} className="text-cyan-300" />
            <span className="font-bold">{room.usersCount}</span>
          </div>

          {/* Category Chip over Image */}
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
            <Radio size={11} className="text-cyan-300" />
            <span>{room.category}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 bg-white">
          <h3 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-cyan-700 transition-colors">
            {room.title}
          </h3>

          {/* Host info and Join Button */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar user={room.owner} size="xs" showVIP={false} />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate block max-w-[120px]">
                  {room.owner.name}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">مستضيف الغرفة</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJoin(room);
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-cyan-600/25 active:scale-95 transition-all cursor-pointer"
            >
              دخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Standard Card (Grid layout with pristine white styling)
  return (
    <div
      onClick={() => onJoin(room)}
      className="group relative rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-500/50 p-2.5 shadow-[0_3px_15px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
    >
      {/* Top Banner Row */}
      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100 mb-2">
        {!imgError && room.coverImage ? (
          <img
            src={room.coverImage}
            alt={room.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center">
            <Volume2 className="text-white/80" size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-black/20 to-transparent" />

        {/* Live Audio Equalizer Waves */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs">
            <div className="flex items-center gap-0.5 h-2">
              <span className="w-0.5 bg-white wave-bar-1" />
              <span className="w-0.5 bg-white wave-bar-2" />
              <span className="w-0.5 bg-white wave-bar-3" />
            </div>
            <span>صوتي</span>
          </div>
          {room.isPrivate && (
            <span className="p-1 rounded-full bg-black/60 text-amber-300">
              <Lock size={10} />
            </span>
          )}
        </div>

        {/* Listeners Count */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-mono shadow-xs">
          <Users size={11} className="text-cyan-300" />
          <span className="font-bold">{room.usersCount}</span>
        </div>

        {/* Category tag chip */}
        <div className="absolute bottom-1.5 right-2">
          <span className="px-1.5 py-0.5 rounded-md bg-white/25 backdrop-blur-md text-white text-[9px] font-semibold">
            {room.category}
          </span>
        </div>

        {/* VIP badge if any */}
        {room.isVIP && (
          <div className="absolute bottom-1.5 left-2">
            <VIPBadge level={room.owner.vipLevel || 6} size="sm" />
          </div>
        )}
      </div>

      {/* Room Title */}
      <div className="px-0.5">
        <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-cyan-700 transition-colors">
          {room.title}
        </h4>
        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
          ID: {room.id}
        </span>
      </div>

      {/* Host Row & Join Action */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserAvatar user={room.owner} size="xs" showVIP={false} />
          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[85px]">
            {room.owner.name}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onJoin(room);
          }}
          className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          دخول
        </button>
      </div>
    </div>
  );
};
