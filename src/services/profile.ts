import { User } from '../types';

export const defaultAvatar = '/assets/images/default_arab_user_avatar_1790806239365.jpg';
export const emptyUser: User = {
  id: '', username: '', name: 'مستخدم جديد', avatar: defaultAvatar,
  level: 1, vipLevel: 0, wealthLevel: 1, charmLevel: 1, isOnline: false,
  gold: 0, diamonds: 0, silverCoins: 0, friendsCount: 0, followersCount: 0,
  followingCount: 0, visitorsCount: 0, receivedGiftsCount: 0,
  sentGiftsCount: '0', receivedTotal: '0',
};

export function countryFlag(code?: string): string {
  return /^[A-Z]{2}$/.test(code || '')
    ? String.fromCodePoint(...code!.split('').map(c => c.charCodeAt(0) + 127397)) : '';
}

export function profileToUser(row: Record<string, any>): User {
  return {
    ...emptyUser, authId: row.id, id: String(row.public_id || ''),
    username: row.username || `user_${row.public_id}`, name: row.display_name || 'مستخدم جديد',
    avatar: row.avatar_url || defaultAvatar, bio: row.bio || '', birthday: row.birthday || '',
    gender: row.gender, region: row.region || '', country: row.country_name || '',
    countryCode: row.country_code || '', countryFlag: countryFlag(row.country_code),
    level: Number(row.level || 1), wealthLevel: Number(row.level || 1),
    charmLevel: Math.min(150, Math.floor(Number(row.received_gold || 0) / 1000) + 1),
    vipLevel: Number(row.vip_level || 0), gold: Number(row.gold || 0),
    diamonds: Number(row.diamonds || 0), silverCoins: Number(row.silver_coins || 0),
    sentGiftsCount: String(row.sent_gold || 0), receivedTotal: String(row.received_gold || 0),
    receivedGiftsCount: Number(row.received_gifts || 0), nameShimmerStyle: row.name_shimmer_style,
    isOnline: true,
  };
}

// Wallet, identity and privileges are never saved through profile editing.
export function editableProfile(user: User) {
  return {
    username: user.username || null, display_name: user.name.trim().slice(0, 80),
    avatar_url: user.avatar, bio: (user.bio || '').slice(0, 500),
    birthday: user.birthday || null, gender: user.gender || null,
    region: user.region || null, country_code: user.countryCode || null,
    country_name: user.country || null, name_shimmer_style: user.nameShimmerStyle || null,
  };
}
