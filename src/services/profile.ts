import { User } from '../types';

export const defaultAvatar = '/assets/images/default-user.svg';
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
    equipment: row.equipment || undefined,
    level: Number(row.level ?? 1), wealthLevel: Math.min(150, Math.floor(Number(row.sent_gold || 0) / 1000) + 1),
    charmLevel: Math.min(150, Math.floor(Number(row.received_gold || 0) / 1000) + 1),
    vipLevel: row.vip_expires_at && new Date(row.vip_expires_at).getTime() <= Date.now() ? 0 : Number(row.vip_level || 0), vipExpiresAt: row.vip_expires_at, gold: Number(row.gold || 0),
    diamonds: Number(row.diamonds || 0), silverCoins: Number(row.silver_coins || 0),
    sentGiftsCount: String(row.sent_gold || 0), receivedTotal: String(row.received_gold || 0),
    receivedGiftsCount: Number(row.received_gifts || 0), nameShimmerStyle: row.name_shimmer_style,
    friendsCount: Number(row.friends_count || 0), followersCount: Number(row.followers_count || 0),
    followingCount: Number(row.following_count || 0), visitorsCount: Number(row.visitors_count || 0),
    isOnline: Boolean(row.last_seen_at && Date.now() - new Date(row.last_seen_at).getTime() < 180000),
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

// Member snapshots are server-backed but intentionally abbreviated. Do not
// fabricate charm/wealth from missing snapshot fields.
export function roomMemberToUser(row: Record<string, unknown>): User {
  const user = profileToUser({id: row.user_id, public_id: row.member_public_id,
    display_name: row.member_display_name, avatar_url: row.member_avatar_url,
    username: row.member_username, level: row.member_level, vip_level: row.member_vip_level,
    equipment: row.member_equipment});
  return {...user, level: Number(row.member_level ?? 0), hasPublicLevel: typeof row.member_level === 'number' && Number.isFinite(row.member_level), charmLevel: undefined, wealthLevel: undefined};
}
