import React, { useState } from 'react';
import { User } from '../../types';
import { VIPFrame } from './VIPFrame';
import { LevelBadge } from './LevelBadge';
import { VIPBadge } from './VIPBadge';

interface UserAvatarProps {
  user?: Partial<User> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showOnlineStatus?: boolean;
  showLevel?: boolean;
  showVIP?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showOnlineStatus = false,
  showLevel = false,
  showVIP = false,
  isSpeaking = false,
  onClick,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const dimensionMap = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-24 h-24 text-xl',
  };

  const defaultAvatar = '/assets/images/default_arab_user_avatar_1790806239365.jpg';
  const effectiveAvatar = user?.avatar || defaultAvatar;

  const avatarContent = (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white font-bold select-none cursor-pointer ${dimensionMap[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src={effectiveAvatar}
          alt={user?.name || 'User'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <img
          src={defaultAvatar}
          alt={user?.name || 'User'}
          className="w-full h-full object-cover rounded-full"
        />
      )}

      {/* Online indicator */}
      {showOnlineStatus && user?.isOnline && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b0c16] rounded-full ring-1 ring-emerald-400/50"
          title="متصل الآن"
        />
      )}
    </div>
  );

  return (
    <div className="relative inline-flex flex-col items-center">
      <VIPFrame level={user?.vipLevel || 0} size={size} isSpeaking={isSpeaking}>
        {avatarContent}
      </VIPFrame>

      {/* Floating level badge */}
      {showLevel && user?.level !== undefined && (
        <div className="absolute -bottom-2 z-10 scale-90">
          <LevelBadge level={user.level} size="sm" />
        </div>
      )}

      {/* Floating VIP badge if requested */}
      {showVIP && user?.vipLevel !== undefined && user.vipLevel > 0 && (
        <div className="absolute -top-2 z-10 scale-90">
          <VIPBadge level={user.vipLevel} size="sm" />
        </div>
      )}
    </div>
  );
};
